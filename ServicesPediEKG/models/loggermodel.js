//Importing node modules
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//user schema
var logs = new mongoose.Schema({
    methodName :{type:String},
    response : {type:String},
    message : {type:String},
    date : {type: Date}
});

var logs = mongoose.model('logdetails', logs);
module.exports={
	
	//Method used to create new log
	createLog : function( data, callback) {		
		new logs(data).save();		
	},
	
	//Method used for get logs
	getLogs : function( condition, fields, callback){
		if(!fields)
			fields = {};
		if(!condition)
			condition = {};
		users.find( condition, fields, callback);
	},	
	schema : logs
}