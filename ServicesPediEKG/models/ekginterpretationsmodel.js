//node module
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//ekgInterpretatiob schema
var ekgInterpretationsSchema = new mongoose.Schema({
    groupName : {type: String},
    interpretations : [{_id : {type: Schema.Types.ObjectId}, interpretation : {type : String}}],
});

var ekgInterpretations = mongoose.model('ekginterpretations', ekgInterpretationsSchema);

module.exports={
	//get all the interpretations
	getInterpretations : function(condition, fields, callback){
		if(!fields)
			fields = {};
		ekgInterpretations.find(condition, fields, callback);
	},

    //get all the interpretation
    getInterpretation : function(condition, fields, callback){
        if(!fields)
            fields = {};
        ekgInterpretations.findOne(condition, fields, callback);
    },
    
	//get ekgs list
    interpretationGroupsList : function(condition, fields, callback){
        if(!fields)
            fields = {};
        ekgInterpretations.find(condition, fields).sort({groupName:1}).exec(function(err, groupList){
            if(err){
                callback(err, null);
            }
            else{
                ekgInterpretations.count(condition, function(err, totalCount){
                    if(err){
                        callback(err, null);
                    }
                    else{
                        callback(null,{count: totalCount,groups: groupList});
                    }
                });
            }
        });
    },
    //save group
    saveInterpretations : function(data, callback){
    	new ekgInterpretations(data).save(callback);
    },
    //update group
    updateGroup : function( condition, data, callback){
    	ekgInterpretations.findOneAndUpdate(condition, data, callback);
	},  
    updateInterpretation : function( condition, data, options, callback){
        ekgInterpretations.update(condition, data, options, callback);
    },
    //remove group
    removeGroup : function(condition, callback){
        ekgInterpretations.remove(condition,callback);
    },
	schema : ekgInterpretations
}