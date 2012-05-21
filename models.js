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
	username : { type: String},
	password : { type: String},
	access_level : { type: Number	}
});

exports.Users = mongoose.model('Users', Users);