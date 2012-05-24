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
	admin : { type: Boolean	}
});

exports.Users = mongoose.model('Users', Users);

/***********************************************************
	Voucher Schema
***********************************************************/
var Vouchers = new Schema({
	number: { type: String },
	type: { type: String},
	amount: { type: Number},
	name: {type: String},
	vessel: {type: String},
	permit: {type: String},
	email : { type: String},
	phone : {type: String}
});

exports.Vouchers = mongoose.model('Vouchers', Vouchers);

/***********************************************************
	Application Schema
***********************************************************/
var Applications = new Schema({
	name: {type: String},
	vessel: {type: String},
	permit: {type: String},
	email: {type: String},
	phone: {type: String}
});

exports.Applications = mongoose.model('Applications', Applications);