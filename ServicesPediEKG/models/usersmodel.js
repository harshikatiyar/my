//Importing node modules
var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;

//user schema
var userSchema = new mongoose.Schema({
    firstName :{ type:String, required: true },
    lastName : { type:String, required: true },
    email : { type:String, required: true },
    userName : { type:String },
    password : { type:String, required: true },
    createdBy : { type:String, default: "" },
    createdOn : { type: Date, default: Date.now },
    modifiedBy :  { type:String, default: "" },
    modifiedOn : { type: Date },
    isActive : { type: Boolean, default: true },    
    isPasswordReset : { type: Boolean, default: false },
    fileName: { type:String, default: "" },
    imageURL :  { type:String, default:"" },
    isPushNotificationDisabled : { type: Boolean, default: false },
    deviceId :  { type:String, default: "" },
    deviceType :  { type:Number, default: 0},
    isAdmin : { type: Boolean, default: false },
    isSuperUser : { type: Boolean, default: false },
	lastAccessTime : { type : String , default:'' },
	sessionId : { type: String , default :'' },
	isProfessionalStatus: { type: Boolean,default: false },
	isMedicalStudent: { type: Boolean,default: false },
	medicalStudent:{
		class:{type: String}
	},
	isResident: { type: Boolean,default: false },
	resident:{
		type:{type: String}, postGraduateYear:{type: Number}
	},	
	isFellow: { type: Boolean,default: false },
	fellow:{
		specialty:{type: String}, postGraduateYear:{type: Number}
	},	
	isAttending: { type: Boolean,default: false },
	attending:{
		specialty:{type: String}, postGraduateYear:{type: Number}
	},
	isAdvancedPractitioner: { type: Boolean,default: false },
	advancedPractitioner:{
		type:{type: String}, postGraduateYear:{type: Number}
	},
	institutionOfEmployment : {type : String},	
	other:{ type: String }
});

var users = mongoose.model('users', userSchema);
module.exports={
	//Method used for log in user
	loginAuth : function( data, callback){
		users.findOneAndUpdate(data,{"sessionId":crypto.randomBytes(90).toString('base64'),"lastAccessTime":Date.now()}, callback);
	},
	
	//Method used to create new user
	createUser : function( data, callback) {		
		new users(data).save(callback);		
	},
	
	//Method used for get user
	getUser : function( condition, fields, callback){
		if(!fields)
			fields = {};
		users.findOne( condition, fields, callback);
	},
	
	//Method used for get users
	getUsers : function( condition, fields, callback){
		if(!fields)
			fields = {};
		users.find( condition, fields, callback);
	},
	
	//Method used for update user
	updateUser : function( condition, data, callback){
		users.update(condition,data,callback);
	},

	//Method used for update user and return User
	findAndUpdate : function( condition, data, callback){
		users.findOneAndUpdate(condition, data, callback);
	},
	removeUser : function(condition, callback){
		users.remove(condition,callback);
	},
	userList : function( condition, fields, callback){
		users.find(condition, fields).sort({firstName:1}).exec(function(err,usersList){
			if(err){
				callback(err, null);
			}
			else{
				users.count(condition, function(err, totalCount){
					if(err){
						callback(err, null);
					}
					else{
						callback(null, { count: totalCount, users:usersList });
					}
				});
			}
		});
	},
	schema : users
}