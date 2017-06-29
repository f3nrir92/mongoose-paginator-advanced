# mongoose-paginator

[![Build Status](https://travis-ci.org/f3nrir92/mongoose-paginator-advanced.svg?branch=master)](http://travis-ci.org/f3nrir92/mongoose-paginator-advanced)

An pagination plugin for ORM [mongoose.js](http://mongoosejs.com/).

## Requirements

 - [NodeJS](https://nodejs.org/en/) >= 4.1

## Installation

```bash
$ npm install mongoose-paginator-advanced
```

## Credits
Plugin based on [mongoose-paginator-simple](https://github.com/raphaelfjesus/mongoose-paginator) of Raphael F. Jesus <raphaelfjesus@gmail.com>

## Usage

```javascript
// model.js
var mongoose = require('mongoose');
var mongoosePaginator = require('mongoose-paginator-simple');

var schema = new mongoose.Schema({ /* definition */ });
schema.plugin(mongoosePaginator, { /* options for apply in all queries paging */ });

module.exports = mongoose.model('YourModel', schema);

// controller.js
var YourModel = mongoose.model('YourModel');

/*
 * Using callback
 */
YourModel.aggregatePaginated([pipeLine], [options], function(err, result) {
  console.log(result);
});

// or 

YourModel.aggregatePaginated([pipeLine], function(err, result) {
  console.log(result);
});

/*
 * Using native promise (ECMAScript 6)
 */
YourModel.aggregatePaginated([pipeLine], [options]).then(function(result) {
  console.log(result);
}, function(err) {
  // ...
});

// or

YourModel.aggregatePaginated([pipeLine]).then(function(result) {
  console.log(result);
}, function(err) {
  // ...
});
```

Output will be:
```javascript
/*
{
  total: <Number>, 
  limit: <Number>,
  page: <Number>,
  data: <Document...N>
}
*/
```

## Tests

To run the test suite, first install the dependencies, then run npm test:

```bash
$ npm install
$ npm test
```

## License

The MIT License (MIT)

Copyright (c) 2016 Raphael F. Jesus <raphaelfjesus@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
