'use strict';

let util = require('util');
let mongoose = require('mongoose');

module.exports = function (schema, schemaOptions) {

    schema.static('paginate', function (criteria, options, callback) {
        let self = this;
        callback = options && typeof options === 'function' ? options : callback;

        let o = buildOptions(options, schemaOptions);
        o.sort = o.convertSort(o.sort, schema);
        criteria = o.criteriaWrapper(o.convertCriteria(criteria, schema));

        return new Promise(function (resolve, reject) {
            let resultFn = (err, count, docs) => {
                let result = {total: count, limit: o.limit || count, page: o.page, data: docs};

                if (err) {
                    callback && callback(err);
                    return reject(err);
                }

                callback && callback(null, result);
                return resolve(result);
            };

            self.where(criteria).count().exec().then(function (count) {
                if (count <= 0) {
                    return resultFn(null, count, {});
                }

                let query = self.find(criteria).select(o.select).populate(o.populate).lean(o.lean).skip(o.skip);
                if (o.sort) {
                    query.sort(o.sort);
                }
                if (o.limit && o.limit > 0) {
                    query.limit(o.limit);
                }

                query.exec().then(function (docs) {
                    return resultFn(null, count, docs);
                });
            }, function (err) {
                resultFn(err);
            });
        });
    });

    schema.static('aggregatePaginated', function (pipeline, options, callback) {
        let self = this;
        callback = options && typeof options === 'function' ? options : callback;

        let o = buildOptions(options, schemaOptions);
        if (!util.isArray(pipeline)) {
            pipeline = [pipeline]
        }

        return new Promise((resolve, reject) => {
            let admin = new mongoose.mongo.Admin(mongoose.connection.db);
            admin.buildInfo(function (err, info) {
                if(/^3\.4/.exec(info.version) === null) {
                    return reject('Unsupported MongoDb version');
                }

                let stages = {},
                    countMode = false,
                    rPipeLine = [];

                for (let stage of pipeline) {
                    let s = stage;
                    let keys = Object.keys(stage);
                    if(keys.length > 1) {
                        reject('Invalid pipeline specified');
                    }

                    // store special stages
                    if (keys[0] === '$sort') {
                        stages['$sort'] = s;
                    } else if (keys[0] === '$skip') {
                        stages['$skip'] = s;
                    } else if (keys[0] === '$limit') {
                        stages['$limit'] = s;
                    } else {
                        if(keys[0] === '$count') {
                            countMode = true;
                        }

                        if(keys[0] === '$match') {
                            s = {
                                $match: o.criteriaWrapper(o.convertCriteria(stage.$match, schema))
                            }
                        }

                        rPipeLine.push(s);
                    }
                }

                let resultWrapper = (err, count, resultData) => {
                    let result = {total: count, limit: o.limit || count, page: o.page, data: resultData};

                    if (err) {
                        callback && callback(err);
                        return reject(err);
                    }

                    callback && callback(null, result);
                    return resolve(result);
                };

                if(!countMode) {
                    // build count-pipeline for counting result length
                    let countPipeLine = rPipeLine.slice(0);
                    countPipeLine.push({
                        $count: 'total'
                    });
                    self.aggregate(countPipeLine).then((data) => {
                        return data;
                    }).then((countData) => {
                        if(!countData.length) {
                            resultWrapper(null, 0, countData);
                        } else {
                            // add sort, limit and skip to main pipeline
                            if(stages.hasOwnProperty('$sort')) {
                                rPipeLine.push({
                                    $sort: o.convertSort(stages['$sort'].$sort)
                                });
                            } else if(o.sort) {
                                rPipeLine.push({
                                    $sort: o.convertSort(o.sort)
                                })
                            }

                            if(stages.hasOwnProperty('$skip')) {
                                rPipeLine.push(stages['$skip']);
                            } else {
                                rPipeLine.push({
                                    $skip: o.skip
                                });
                            }

                            if(stages.hasOwnProperty('$limit')) {
                                rPipeLine.push(stages['$limit']);
                            } else if(o.limit) {
                                rPipeLine.push({
                                    $limit: o.limit
                                });
                            }

                            // perform main pipeline
                            self.aggregate(rPipeLine).then((data) => {
                                resultWrapper(null, countData[0].total, data);
                            })
                        }
                    }).catch((err) => {
                        reject(err);
                    });
                } else { // pipeline is made for count records
                    self.aggregate(rPipeLine).then((data) => {
                        resolve(data);
                    }).catch((err) => {
                        reject(err);
                    });
                }
            });
        });
    });
};

function buildOptions(options, schemaOptions) {
    let o = Object.assign({}, options || {}, schemaOptions || {});

    // Basic options
    o.limit = o.limit && typeof o.limit === 'function' ? o.limit(o.maxLimit) : ((o.limit && o.maxLimit && o.limit > o.maxLimit) || !o.limit ? o.maxLimit : o.limit);
    o.page = o.page || 1;
    o.skip = (o.page - 1) * (o.limit || 0);
    o.lean = o.lean !== undefined ? o.lean : true; // Plain object, more peformance
    o.select = o.select && typeof o.select === 'function' ? o.select() : o.select;
    o.populate = o.populate && typeof o.populate === 'function' ? o.populate() : (o.populate || '');

    // Advanced options
    let convert = (converter) => {
        return converter && typeof converter === 'function' ? converter : function (value, schema) {
            return value;
        };
    };
    o.convertSort = convert(o.convertSort);
    o.convertCriteria = convert(o.convertCriteria);
    o.criteriaWrapper = o.criteriaWrapper && typeof o.criteriaWrapper === 'function' ? o.criteriaWrapper : function (criteria) {
        return criteria;
    };

    return o;
}