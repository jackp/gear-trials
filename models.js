/*************************************************************
  Module Dependencies
*************************************************************/
var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = Schema.ObjectId;

/*************************************************************
  Users Schema
*************************************************************/
var Users = new Schema({
	name	: { type: String },
	email	: { type: String },
	password : { type: String},
	location: { type: String},
	admin : { type: Boolean	}
});

exports.Users = mongoose.model('Users', Users);

/***********************************************************
	Voucher Schema
***********************************************************/
var Vouchers = new Schema({
	number: { type: String, unique: true },
	type: { type: String}, //['Drop Chain - Large', 'Drop Chain - Small', 'Belly Panel']
	amount: { type: Number},
	owner: {
		name: {type: String},
		vessel: {type: String},
		permit: {type: String}
	},
	contact: {
		email: {type: String},
		home_phone: {type: String},
		cell_phone: {type: String},
		mailing_address: {type: String}
	},
	issued_date: {type: Date},
	status: {type: String, default: 'open'}, // Open, Used
	used_date: {type: Date},
	used_location: {type: String}
});

exports.Vouchers = mongoose.model('Vouchers', Vouchers);

/***********************************************************
	Application Schema
***********************************************************/
var Applications = new Schema({
	date_submitted: {type: Date, default: new Date() },
	status: {type: String, default: 'open'}
});

exports.Applications = mongoose.model('Applications', Applications);
/***********************************************************
	Survey Schema
***********************************************************/
var Surveys = new Schema({
	date_submitted: {type: Date, default: new Date() }
});

exports.Surveys = mongoose.model('Surveys', Surveys);

/***********************************************************
	Content Schema
***********************************************************/
var Contents = new Schema();
exports.Contents = mongoose.model('Contents', Contents);