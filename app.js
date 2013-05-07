
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var VALID_SYMBOLS = ["APPL", "GOOG", "MSFT"];

var Mongoose = require('mongoose');
var db = Mongoose.createConnection('localhost', 'meandemo');

var StockSchema = new Mongoose.Schema(
    { symbol : {  type : String,
                  required : true,
                  validate : [
                      function(v) { return VALID_SYMBOLS.indexOf(v) != -1; },
                      'Invalid symbol, valid stocks are ' + JSON.stringify(VALID_SYMBOLS)]
                },
      price : { type : Number,
                required : true,
                validate : [function(v) { return v >= 0; }, 'Price must be positive']
              },
      quantity : {  type : Number,
                    required : true,
                    validate : [function(v) { return v >= 0; }, 'Quantity must be positive']
                  }
    });

var StockListSchema = new Mongoose.Schema({
  stocks : [StockSchema]
});

var Stock = db.model('stocks', StockSchema);
var StocksList = db.model('stockslists', StockListSchema);

var stocksList = new StocksList();

app.get('/stocks', function(req, res) {
  res.render('list_view', { stocksList : stocksList });
});

app.post('/stocks.json', function(req, res) {
  var stock = new Stock(req.body.stock);
  stock.validate(function(error) {
    if (error) {
      res.json({ error : error });
    } else {
      stocksList.stocks.push(stock);
      stocksList.save(function(error, stocksList) {
        // Should never fail
        res.json({ stocksList : stocksList });
      });
    }
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
