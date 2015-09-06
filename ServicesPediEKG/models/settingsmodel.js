//node module
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//setting shema
var settingsSchema = new mongoose.Schema({
	label: {type: String},
   	emailSettings: Schema.Types.Mixed
});

var settings = mongoose.model('settings', settingsSchema);

module.exports={
	//get settings of the system
	getSetting : function(condition, fields, callback){
		if(!fields)
			fields = {};
		settings.findOne(condition, fields, callback);
	},

	//update setting
	updateSetting : function(condition, data, callback){
		settings.findOneAndUpdate(condition, data, callback);
	},

	//get settings
	getSettings : function(condition, fields, callback){
		if(!fields)
			fields = {};
		settings.find(condition, fields, callback);
	},

	//save setting
	saveSetting : function(data, callback){
		new settings(data).save(callback);
	},
	schema : settings
}