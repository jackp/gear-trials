/*************************************************************
  Module Dependencies
*************************************************************/
var express = require('express')
  , mongoose = require('mongoose')
  , io = require('socket.io')
  , sio = require('socket.io-sessions')
  , MongoStore = require('connect-mongodb')
  , sessionStore = new MongoStore({
    url: 'mongodb://localhost/gear-trials',
    collection: 'sessions'
  })
  , http = require('http');

var app = express();
var server = http.createServer(app);

/*************************************************************
  App Configuration
*************************************************************/
// Global Config
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session({ store: sessionStore}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// Dev Config Only
app.configure('development', function(){
  app.use(express.errorHandler());
  mongoose.connect('mongodb://localhost/gear-trials');
});

// Prod Config Only
app.configure('production', function(){
  mongoose.connect('mongodb://YOUR-DB-HERE');
});

/*************************************************************
  Socket.io Configuration
*************************************************************/
var socket = sio.enable({
  socket: io.listen(server),
  store:  sessionStore,
  parser: express.cookieParser('your secret here')
});

/*************************************************************
  Mongoose Models
*************************************************************/
var Users = require('./models').Users;

/*************************************************************
  Routes
*************************************************************/
app.get('/', function(req, res){
  res.render('index', { title: 'Gear Trials Project' });
});

/*************************************************************
  Socket.io Events
*************************************************************/
socket.on('sconnection', function(client, session){
  console.log('CONNECTED');
  
});

/*************************************************************
  Startup
*************************************************************/
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
