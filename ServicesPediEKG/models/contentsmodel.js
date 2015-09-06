//node module
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//content schema
var contentsSchema = new mongoose.Schema({
	aboutus :{ type:String },
	tutorial : { type:String},
	ekgAlgorithm : [{step:{ type:String} , url:{ type:String} , index: {type: Number}, _id: false}],
	references : { type:String},
	TandC : { type:String}
});

var contents = mongoose.model('contents', contentsSchema);

module.exports={
	//get all contents
	getContents : function(condition, fields, callback){
		if(!fields)
			fields = {};
		contents.find(condition, fields).sort({'ekgAlgorithm.index':1}).exec(callback);
	},

	//update contenet
	updateContent : function(condition, data, callback){
		contents.findOneAndUpdate(condition, data, callback);
	},

	//save content
	saveContent : function(data, callback){
		new contents(data).save(callback);
	},
	schema : contents
}