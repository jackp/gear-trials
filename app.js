/*************************************************************
  Module Dependencies
*************************************************************/
var express = require('express')
  , mongoose = require('mongoose')
  , bcrypt = require('bcrypt')
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

// Dynamic Helpers
app.locals.use(function(req, res){
  res.locals.session = req.session;
  
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
var io = require('socket.io').listen(server);

/*************************************************************
  Mongoose Models
*************************************************************/
var Users = require('./models').Users;
var Vouchers = require('./models').Vouchers;
var Applications = require('./models').Applications;

/*************************************************************
  Routes
*************************************************************/
app.get('/', function(req, res){
  res.render('index', { title: 'Gear Trials Project' });
});

app.get('/admin', function(req, res){
  var query = Users.find({});
  query.where('_id').ne(req.session.user._id);
  query.sort('admin', -1);
  query.exclude('password');
  query.run(function(err, docs){
    res.render('admin', {
      title: 'Admin Area',
      users: docs
    });
  });
});
app.get('/apply', function(req, res){
  res.render('apply', {
    title: 'Apply Now'
  });
}); 
app.post('/login', function(req, res){
  var form = req.body;

  // Check for valid email
  Users.findOne({email: form.email}, function(err, doc){
    if(doc){
      // If found, check password
      if(bcrypt.compareSync(form.password, doc.password)){
        // Successful login
        delete doc.password;
        req.session.user = doc;
        res.redirect('admin');
      }
    } else {
      // Send to /login with error message
    }
  });

});

app.post('/register', function(req, res){
  var form = req.body;

  // Encrypt password
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(form.password, salt);

  var new_user = new Users();
  new_user.email = form.email;
  new_user.password = hash;

  new_user.save(function(err){
    if(err) console.log(err);
    req.session.user = {
      _id: new_user._id,
      email: new_user.email
    };
    res.redirect('admin');
  });

  
});

/*************************************************************
  Socket.io Events
*************************************************************/
var ObjectId = mongoose.Types.ObjectId;

io.sockets.on('connection', function(socket){
  socket.on('add_user', function(form){
    var new_user = new Users();
    new_user.name = form.name;
    new_user.email = form.email;
    new_user.admin = form.admin;
    // For testing only
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync('j6286ipp', salt);
    new_user.password = hash;

    new_user.save(function(err){
      socket.emit('add_user_resp');
    });
  });

  socket.on('remove_user', function(id){
    Users.findById(id, function(err, doc){
      if(err) console.log(err);
      doc.remove();
      socket.emit('remove_user_resp', err);
    });
  });

  socket.on('issue_voucher', function(voucher){
    voucher.number = (Math.random()+' ').substring(2,10)+(Math.random()+' ').substring(2,10);
    voucher.issued_date = new Date();
    voucher.expiration_date = new Date(voucher.issued_date.getTime() + 180 * 24 * 60 * 60 * 1000);
    var new_voucher = new Vouchers(voucher);
    new_voucher.save(function(err){
      if(err) console.log(err);
      socket.emit('issue_voucher_resp', err);
    });
  });
});

/*************************************************************
  Startup
*************************************************************/
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
