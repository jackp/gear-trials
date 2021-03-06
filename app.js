/*************************************************************
  Module Dependencies
*************************************************************/
var express = require('express')
  , mongoose = require('mongoose')
  , bcrypt = require('bcrypt')
  , moment = require('moment')
  , MongoStore = require('connect-mongodb')
  , sessionStore = new MongoStore({
    url: 'mongodb://localhost/gear-trials',
    collection: 'sessions'
  })
  , http = require('http')
  , email = require('emailjs')
  , email_server = email.server.connect({
    user: 'jack@cfrfoundation.org',
    password: 'j6286ipp',
    host: 'smtp.gmail.com',
    ssl: true
  });

var app = express();
var server = http.createServer(app);

/*************************************************************
  App Configuration
*************************************************************/
// Global Config
app.configure(function(){
  app.set('port', process.env.PORT || 8080);
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
  mongoose.connect('mongodb://localhost/gear-trials');
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
var pages = [
  'home', 
  'faq', 
  'apply', 
  'about-program', 
  'get-involved',
  'research',
  'feedback',
  'gallery',
  'about',
  'contact',
  'survey'];

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
// Error Page
app.get('/404', function(req, res, next){
  next();
});
// Error Page
app.get('/500', function(req, res, next){
  next(new Error('keyboard cat!'));
});


app.post('/login', function(req, res){
  Users.findOne({email: req.body.email}, function(err, doc){
    if(doc){
      if(bcrypt.compareSync(req.body.password, doc.password)){
        var user = doc.toObject();
        delete user.password;
        req.session.user = user;
        if(user.admin){
          res.redirect('/admin');
        } else {
          res.redirect('/dealer');
        }
        
      } else {
        res.render('login', {
          title: 'Login Error',
          error: 'Incorrect password.'
        });
      }
    } else {
      res.render('login', {
        title: 'Login Error',
        error: 'Email not registered.'
      });
    }
  });
});

app.post('/adduser', function(req, res){
  var form = req.body,
      salt = bcrypt.genSaltSync(10);
  console.log(form);
  var user = new Users();
  user.name = form.name;
  user.email = form.email;
  user.password = bcrypt.hashSync(form.password, salt);
  user.location = form.location;
  if(form.location == 'CFRF'){
    user.admin = true;
  } else {
    user.dealer = true;
  }
  console.log(user);
  user.save(function(err){
    if(err) console.log(err);

    res.redirect('/admin/actions/users');
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
// Home Page
app.get('/', function(req, res){
  Contents.findOne({page: 'home'}, function(err, doc){
    res.render('index', { 
      title: 'Gear Trials Project',
      page: 'home',
      admin: false,
      content: doc.toObject() 
    });
  });
});

app.get('/about-program', function(req, res){
  Contents.findOne({page: 'about-program'}, function(err, doc){
    res.render('about-program', { 
      title: 'About Gear Trials',
      page: 'about-program',
      admin: false,
      content: doc.toObject() 
    });
  });
});

app.get('/get-involved', function(req, res){
  Contents.findOne({page: 'get-involved'}, function(err, doc){
    res.render('get-involved', { 
      title: 'Get Involved!',
      page: 'get-involved',
      admin: false,
      content: doc.toObject() 
    });
  });
});

app.get('/research', function(req, res){
  Contents.findOne({page: 'research'}, function(err, doc){
    res.render('research', { 
      title: 'Research',
      page: 'research',
      admin: false,
      content: doc.toObject() 
    });
  });
});

app.get('/feedback', function(req, res){
  Contents.findOne({page: 'feedback'}, function(err, doc){
    res.render('feedback', { 
      title: 'Fisherman Feedback',
      page: 'feedback',
      admin: false,
      content: doc.toObject() 
    });
  });
});

app.get('/gallery', function(req, res){
  res.render('gallery', {
    title: 'Image Gallery'
  });
});

app.get('/faq', function(req, res){
  Contents.findOne({page: 'faq'}, function(err, doc){
    res.render('faq', { 
      title: 'FAQ',
      page: 'faq',
      admin: false,
      content: doc.toObject() 
    });
  });
});

app.get('/about', function(req, res){
  Contents.findOne({page: 'about'}, function(err, doc){
    res.render('about', { 
      title: 'About the CFRF',
      page: 'about',
      admin: false,
      content: doc.toObject() 
    });
  });
});

app.get('/contact', function(req, res){
  Contents.findOne({page: 'contact'}, function(err, doc){
    res.render('contact', { 
      title: 'Contact Us',
      page: 'contact',
      admin: false,
      content: doc.toObject() 
    });
  });
});

app.get('/apply', function(req, res){
  Contents.findOne({page: 'apply'}, function(err, doc){
    res.render('apply', { 
      title: 'Apply Now',
      page: 'apply',
      admin: false,
      content: doc.toObject() 
    });
  });
});

app.get('/survey', function(req, res){
  Contents.findOne({page: 'survey'}, function(err, doc){
    res.render('survey', { 
      title: 'Fisherman Survey Form',
      page: 'survey',
      admin: false,
      content: doc.toObject() 
    });
  });
});
/***********************************************************
  Admin Pages
***********************************************************/
// Admin Welcome Page
app.get('/admin', admin, function(req, res){
  res.render('admin/admin', {
    title: 'Admin Page',
    page: 'admin',
    admin: true
  });
});
// Pages
app.get('/admin/pages/:page', admin, function(req, res){
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
      content: content,
      admin: true
    });
  });
});
// Applications
app.get('/admin/actions/applications', admin, function(req, res){
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

app.get('/admin/actions/vouchers', admin, function(req, res){
  Vouchers.find({}, [], {sort: {issued_date: -1}}, function(err, vouchers){
    var open = [], used = [];
    vouchers.forEach(function(voucher){
      if(voucher.status === 'open') {
        open.push(voucher);
      } else if(voucher.status === 'used') {
        used.push(voucher);
      }
    });
    res.render('admin/actions/vouchers', {
      title: 'Admin: Vouchers',
      open_vouchers: open,
      used_vouchers: used,
    });
  });
});

app.get('/admin/actions/users', admin, function(req, res){
  res.render('admin/actions/users', {
    title: 'Admin: Users'
  });
});

/***********************************************************
  Dealer Pages
***********************************************************/
// Dealer Welcome Page
app.get('/dealer', restrict, function(req, res){
  res.render('dealer/admin', {
    title: 'Dealer Page',
    page: 'dealer'
  });
});
// Process Voucher
app.get('/dealer/actions/process', restrict, function(req, res){
  res.render('dealer/actions/process', {
    title: 'Process Voucher'
  });
});

// View Vouchers
app.get('/dealer/actions/vouchers', restrict, function(req, res){
  Vouchers.find({used_location: req.session.user.location}, function(err, docs){
    res.render('dealer/actions/vouchers', {
      title: 'Dealer: View Vouchers',
      vouchers: docs
    });
  });
});

// View Vouchers
app.get('/dealer/actions/reports/:month', restrict, function(req, res){
  if(req.params.month){
    var now = moment(req.params.month, 'M-YYYY');
  } else {
    var now = moment();
  }
  var month_start = now.date(1).sod();
  var month_end = now.date(now.daysInMonth()).eod();
  Vouchers.find({used_location: req.session.user.location, used_date: { $gte: month_start, $lte: month_end}}, [], {sort: {used_date: -1}},function(err, docs){
    var dcl = 0, dcs = 0, bp = 0, total = 0;
    docs.forEach(function(v){
      if(v.type == 'Drop Chain - Large'){
        dcl++;
        total += v.amount;
      } else if(v.type == 'Drop Chain - Small'){
        dcs++;
        total += v.amount;
      } else if(v.type == 'Belly Panel'){
        bp++;
        total += v.amount;
      }
    });

    var month = moment();
    var select_array = [];
    while(month >= moment([2012, 5, 1])){
      select_array.push({
        month: month.month() + 1,
        year: month.year(),
        human: month.format('MMMM')
      });
      month.subtract('months', 1);
    }
    console.log(select_array);
    res.render('dealer/actions/reports', {
      title: 'Dealer: Report',
      month: now.month(),
      date: now.format('MMMM') + ' ' + now.format('YYYY'),
      vouchers: docs,
      dcl: dcl,
      dcs: dcs,
      bp: bp,
      total: total,
      select_array: select_array
    });
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
      // Create Vouchers
      Applications.findOne({_id: id}, function(err, doc){
        if(err) console.log(err);
        var app = doc.toObject();

        // Drop Chain
        if(app.voucher.drop_chain){
          var voucher1 = new Vouchers();
          voucher1.number = Date.now().toString().substr(7);

          if(app.vessel.hp >= 500){
            voucher1.type = 'Drop Chain - Large';
            voucher1.amount = 800;
          } else {
            voucher1.type = 'Drop Chain - Small';
            voucher1.amount = 450;
          }

          voucher1.owner = {
            name: app.applicant.name,
            vessel: app.vessel.name,
            permit: app.applicant.license
          };
          voucher1.contact = {
            email: app.contact.email,
            home_phone: app.contact.phone_home,
            cell_phone: app.contact.phone_cell,
            mailing_address: app.contact.mail_address || app.contact.res_address
          };
          voucher1.issued_date = new Date();
          voucher1.save(function(err){
            if(err) console.log(err);
          });
        }
        // Belly Panel
        if(app.voucher.belly_panel){
          var voucher2 = new Vouchers();
          voucher2.number = Date.now().toString().substr(7);
          voucher2.type = 'Belly Panel';
          voucher2.amount = 400;

          voucher2.owner = {
            name: app.applicant.name,
            vessel: app.vessel.name,
            permit: app.applicant.license
          };
          voucher2.contact = {
            email: app.contact.email,
            home_phone: app.contact.phone_home,
            cell_phone: app.contact.phone_cell,
            mailing_address: app.contact.mail_address || app.contact.res_address
          };
          voucher2.issued_date = new Date();
          voucher2.save(function(err){
            if(err) console.log(err);
          });
        }
      });
      
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
        // Send email
        var html_email = 
        '<html><p>An application has been submitted by <b>' + app.applicant.name + '</b>. Please log into the Gear Trials website to view the application.</p></html>';

        email_server.send({
          text: 'Gear Trials Application Submitted',
          from: 'Gear Trials Application <survey@cfrfoundation.org>',
          to: 'pparker@cfrfoundation.org, jdickinson@cfrfoundation.org',
          subject: 'Gear Trials application has been submitted',
          attachment: 
             [
                {data:html_email, alternative:true},
             ]
        }, function(err, message){ console.log(err || message)});


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
        // Send email

        // Get variables for gear types
        var dc_s = 'No',
            dc_l = 'No',
            bp = 'No';
        if(survey.gear_type.drop_chain_small){
          dc_s = 'Yes'
        }
        if(survey.gear_type.drop_chain_large){
          dc_l = 'Yes'
        }
        if(survey.gear_type.belly_panel){
          bp = 'Yes'
        }
        // Get variables for species
        var squid = 'No',
            whiting = 'No',
            scup = 'No',
            other = '';
        if(survey.targeted_fishery.squid){
          squid = 'Yes';
        }
        if(survey.targeted_fishery.whiting){
          whiting = 'Yes';
        }
        if(survey.targeted_fishery.scup){
          scup = 'Yes';
        }
        if(survey.targeted_fishery.other_details){
          other = survey.targeted_fishery.other_details;
        }

        var html_email = 
        '<html> \
          <h1>Gear Trials Survey</h1> \
          <p><b>Name: </b> ' + survey.name + '</p> \
          <p><b>Vessel: </b> ' + survey.vessel + '</p> \
          <p><b>Reporting Month: </b> ' + survey.reporting_month + '</p> \
          <p><b>Reporting Year: </b> ' + survey.reporting_year + '</p> \
          <p><b>Gear Types Used: </b><ul> \
            <li>Small Drop Chain: ' + dc_s + '</li> \
            <li>Large Drop Chain: ' + dc_l + '</li> \
            <li>Belly Panel: ' + bp + '</li> \
          </ul></p> \
          <p><b>What small mesh fishery were you targeting? </b><ul> \
            <li>Squid: ' + squid + '</li> \
            <li>Whiting: ' + whiting + '</li> \
            <li>Scup: ' + scup + '</li> \
            <li>Other: ' + other + '</li> \
          </ul></p> \
          <p><b>What statistical areas did you primarily fish in while using the bycatch reduction gear? </b> ' + survey.statistical_area + '</p> \
          <p><b>Did you make any adjustments or modifications to the gear? If so, how? </b> ' + survey.adjustments + '</p> \
          <p><b>Under what fishing conditions did you use the bycatch reduction gear? </b> ' + survey.conditions + '</p> \
          <p><b>Did you find the gear to be effective in reducing winter flounder bycatch? </b> ' + survey.effective + '</p> \
          <p><b>Over the past month, did you observe a reduction in target species when using the bycatch reduction gear? If so, estimate the percent reduction of each target species. </b> ' + survey.reduction_target + '</p> \
          <p><b>Over the past month, did you observe a reduction in bycatch species when using the bycatch reduction gear? If so, estimate the percent reduction of each bycatch species. </b> ' + survey.reduction_bycatch + '</p> \
          <p><b>Will you continue to use the gear? </b> ' + survey.will_continue + '</p> \
          <p><b>Please share any additional observations below. </b> ' + survey.observations + '</p> \
        </html>';

        email_server.send({
          text: 'Survey Results',
          from: 'Gear Trials Survey <survey@cfrfoundation.org>',
          to: 'jns8@cornell.edu, kk334@cornell.edu, jh2333@cornell.edu, jdickinson@cfrfoundation.org, taf4@cornell.edu, jc2282@cornell.edu',
          subject: 'Gear Trials survey has been submitted',
          attachment: 
             [
                {data:html_email, alternative:true},
             ]
        }, function(err, message){ 
          if(err) console.log(err);
          else console.log(message);
        });

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
