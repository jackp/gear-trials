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

app.use(function(req, res, next){
  // respond with html page
  if (req.accepts('html')) {
    res.status(404);
    res.render('error/404', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

app.use(function(err, req, res, next){
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  res.status(err.status || 500);
  res.render('error/500', { error: err });
});

function restrict(req, res, next){
  if(req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!'
    res.redirect('/login');
  }
}

function admin(req, res, next){
  if(req.session.user && req.session.user.admin) {
    next();
  } else {
    res.send('You do not have admin permissions');
  }
}
/*************************************************************
  Socket.io Configuration
*************************************************************/
var io = require('socket.io').listen(server);

/*************************************************************
  Mongoose Models
*************************************************************/
var Users = require('./models').Users,
    Vouchers = require('./models').Vouchers,
    Applications = require('./models').Applications,
    Surveys = require('./models').Surveys,
    Contents = require('./models').Contents;

// Create admin user if database empty
Users.find({}, function(err, docs){
  if(!docs.length){
    var admin = new Users();
    admin.name = "Jack Parker";
    admin.email = "parkej3@gmail.com";

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync('j6286ipp', salt);
    admin.password = hash;
    admin.location = 'CFRF';
    admin.admin = true;
    admin.save(function(err){
      console.log('admin added');
    });
  }
});

// Init page databases
var pages = ['home', 'faq', 'apply'];

Contents.find({}, function(err, docs){
  if(!docs.length){
    pages.forEach(function(page){
      var Content = new Contents({page: page});
      Content.save();
    });
  }
});

/*************************************************************
  Routes
*************************************************************/
// Home Page
app.get('/', function(req, res){
  Contents.findOne({page: 'home'}, function(err, doc){
    res.render('index', { 
      title: 'Gear Trials Project',
      content: doc.toObject() 
    });
  });
});
// Error Page
app.get('/404', function(req, res, next){
  next();
});
// Error Page
app.get('/500', function(req, res, next){
  next(new Error('keyboard cat!'));
});
// Login
app.post('/login', function(req, res){
  var form = req.body;
  // Check for valid email
  Users.findOne({email: form.email}, function(err, doc){
    if(doc){
      // If found, check password
      if(bcrypt.compareSync(form.password, doc.password)){
        // Successful login
        delete doc.password;
        req.session.user = doc.toObject();
        res.redirect('admin');
      }
    } else {
      // Send to /login with error message
    }
  });
});
// Logout
app.get('/logout', function(req, res){
  req.session.destroy(function(err){
    if(err) console.log(err);
    res.redirect('/');
  });
});

/***********************************************************
  Content Pages
***********************************************************/
app.get('/apply', function(req, res){
  Contents.findOne({page: 'apply'}, function(err, doc){
    res.render('apply', { 
      title: 'Apply Now',
      page: 'apply',
      content: doc.toObject() 
    });
  });
});
app.get('/faq', function(req, res){
  Contents.findOne({page: 'faq'}, function(err, doc){
    res.render('faq', { 
      title: 'FAQ',
      page: 'faq',
      content: doc.toObject() 
    });
  });
});
/***********************************************************
  Admin Pages
***********************************************************/
// Admin Welcome Page
app.get('/admin', restrict, function(req, res){
  res.render('admin/admin', {
    title: 'Admin Page'
  });
});
// Pages
app.get('/admin/pages/:page', restrict, function(req, res){
  req.session.page = req.params.page;
  Contents.findOne({page: req.params.page}, function(err, doc){
    if(doc){
      var content = doc.toObject();
    } else {
      var content = {};
    }
    res.render('admin/pages/' + req.params.page, {
      title: 'Admin - Pages: ' + req.params.page,
      page: req.params.page,
      content: content
    });
  });
});
// Applications
app.get('/admin/actions/applications', restrict, function(req, res){
  Applications.find({}, [], {sort: {date_submitted: -1}}, function(err, apps){
    var open = [], accepted = [], declined = [];
    apps.forEach(function(app){
      if(app.status === 'open') {
        open.push(app.toObject());
      } else if(app.status === 'accepted'){
        accepted.push(app.toObject());
      } else if(app.status === 'declined'){
        declined.push(app.toObject());
      } 
    });
    res.render('admin/actions/applications', {
      title: 'View Applications',
      open_applications: open,
      accepted_applications: accepted,
      declined_applications: declined
    });
  }); 
});

app.get('/admin/all-vouchers', admin, function(req, res){
  Vouchers.find({}, [], {sort: {issued_date: -1}}, function(err, vouchers){
    var open = [], used = [], expired = [];
    vouchers.forEach(function(voucher){
      if((voucher.status === 'open') && (new Date(voucher.expiration_date) >= new Date())) {
        open.push(voucher);
      } else if(voucher.status === 'used') {
        used.push(voucher);
      } else {
        expired.push(voucher);
      }
    });
    res.render('admin/all-vouchers', {
      title: 'Admin: Vouchers',
      open_vouchers: open,
      used_vouchers: used,
      expired_vouchers: expired
    });
  });
});
app.get('/admin/issue-voucher', admin, function(req, res){
  res.render('admin/issue-voucher', {
    title: 'Admin: Issue New Voucher'
  });
});
app.get('/admin/users', admin, function(req, res){
  // Get Users
  var query = Users.find({});
  query.where('_id').ne(req.session.user._id);
  query.exclude('password');
  query.run(function(err, users){
    res.render('admin/users', {
      title: 'Admin: User Management',
      users: users
    });
  });
});
app.get('/admin/applications', admin, function(req, res){
  Applications.find({}, [], {sort: {date_submitted: -1}}, function(err, apps){
    var open = [], accepted = [], declined = [];
    apps.forEach(function(app){
      if(app.status === 'open') {
        open.push(app);
      } else if(app.status === 'accepted'){
        accepted.push(app);
      } else if(app.status === 'declined'){
        declined.push(app);
      } 
    });
    res.render('admin/applications', {
      title: 'Admin: Applications',
      open_applications: open,
      accepted_applications: accepted,
      declined_applications: declined
    });
  }); 
});
app.get('/admin/master-reports', admin, function(req, res){
  res.render('admin/master-reports', {
    title: 'Admin: Master Reports'
  });
});

app.get('/process-voucher', restrict, function(req, res){
  res.render('dealer/process-voucher', {
    title: 'Process Voucher'
  });
});
app.get('/vouchers', restrict, function(req, res){
  res.render('dealer/vouchers', {
    title: 'Vouchers'
  });
});
app.get('/reports', restrict, function(req, res){
  res.render('dealer/reports', {
    title: 'Reports'
  });
});

app.get('/gallery', function(req, res){
  res.render('gallery', {
    title: 'Image Gallery'
  });
});
app.get('/about', function(req, res){
  res.render('about', {
    title: 'About the Program'
  });
});

app.get('/survey', function(req, res){
  res.render('survey', {
    title: 'Fisherman Survey Form'
  });
});



/*************************************************************
  Socket.io Events
*************************************************************/
var ObjectId = mongoose.Types.ObjectId;

io.sockets.on('connection', function(socket){
  // Save Page Content
  socket.on('saveContent', function(page, content){
    Contents.update({page: page}, {$set: content}, {upsert: true}, function(err){
      if(err) console.log(err);
      socket.emit('saveContentResp');
    });
  });
  // Get Application Information
  socket.on('getApplication', function(id){
    Applications.findOne({_id: id}, function(err, doc){
      if(err) console.log(err);
      socket.emit('getApplicationResp', doc.toObject());
    });
  });
  // Accept Application
  socket.on('acceptApplication', function(id){
    Applications.update({_id: id}, {$set: {status: 'accepted', date_accepted: new Date()}}, {upsert: true}, function(err){
      if(err) console.log(err);
      socket.emit('acceptApplicationResp');
    });
  });
  // Decline Application
  socket.on('declineApplication', function(id){
    Applications.update({_id: id}, {$set: {status: 'declined', date_declined: new Date()}}, {upsert: true}, function(err){
      if(err) console.log(err);
      socket.emit('declineApplicationResp');
    });
  });
  socket.on('add_user', function(form){
    var new_user = new Users();
    new_user.name = form.name;
    new_user.email = form.email;
    new_user.location = form.location;
    new_user.admin = form.admin;
    // For testing only
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync('j6286ipp', salt);
    new_user.password = hash;

    new_user.save(function(err){
      // SEND NEW USER EMAIL HERE
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
      // SEND VOUCHER EMAIL HERE
      socket.emit('issue_voucher_resp', err);
    });
  });

  socket.on('applicationSubmit', function(app){
    var App = new Applications(app);
    App.save(function(err){
      if(err){
        socket.emit('application_resp', {error: err});
      } else {
        socket.emit('application_resp', {success: true});
      }
    });
  });

  socket.on('surveySubmit', function(survey){
    var Survey = new Surveys(survey);
    Survey.save(function(err){
      if(err){
        socket.emit('survey_resp', {error: err});
      } else {
        socket.emit('survey_resp', {success: true});
      }
    });
  });

  socket.on('accept_application', function(id){
    Applications.update({_id: id}, { status: 'accepted', date_accepted: new Date()}, function(err){
      if(err) console.log(err);
      // CREATE VOUCHER IN DATABASE
      Applications.findById(id, function(err, doc){
        var new_voucher = new Vouchers();
        new_voucher.number = (Math.random()+' ').substring(2,10)+(Math.random()+' ').substring(2,10);
        new_voucher.type = doc.voucher_type;
        switch(doc.voucher_type){
          case 'Belly Panel':
            new_voucher.amount = 350;
            break;
          case 'Drop Chain (Small)':
            new_voucher.amount = 450;
            break;
          case 'Drop Chain (Large)':
            new_voucher.amount = 800;
            break;
        }
        new_voucher.name = doc.name;
        new_voucher.vessel = doc.vessel;
        new_voucher.permit = doc.permit;
        new_voucher.email = doc.email;
        new_voucher.phone = doc.phone;
        new_voucher.issued_date = new Date();
        new_voucher.expiration_date = new Date(new_voucher.issued_date.getTime() + 180 * 24 * 60 * 60 * 1000);
        console.log(new_voucher);
        new_voucher.save(function(err){
          if(err) console.log(err);
          // SEND VOUCHER EMAIL HERE
          socket.emit('accept_application_resp');
        });
      });
    });
  });
  socket.on('decline_application', function(id){
    Applications.update({_id: id}, { status: 'declined', date_declined: new Date()}, function(err){
      if(err) console.log(err);
      // SEND DECLINE EMAIL HERE
      socket.emit('decline_application_resp');
    });
  });

  socket.on('voucher_lookup', function(num){
    Vouchers.findOne({number: num}, function(err, doc){
      if(err) console.log(err);
      
      socket.emit('voucher_lookup_resp', doc);
    });
  });

  socket.on('process_voucher', function(num, location){
    Vouchers.update({number: num}, { status: 'used', used_date: new Date(), used_location: location }, function(err){
      if(err) console.log(err);
      socket.emit('process_voucher_resp');
    });
  });
});

/*************************************************************
  Startup
*************************************************************/
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
