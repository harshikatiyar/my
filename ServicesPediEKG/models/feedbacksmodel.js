//node module
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//feedbackschema
var feedbacksSchema = new mongoose.Schema({
    subject :{ type: String },
    createdOn :{ type: Date, default: Date.now },
    feedback : { type: String },
    comment : { type: String },
    isPublish : String,
    user : {firstName:{ type: String }, lastName:{ type: String }, _id:{ type: Schema.Types.ObjectId }}
});

var feedbacks = mongoose.model('userfeedbacks', feedbacksSchema);

module.exports={
    //save user feedback
	saveFeedback : function(data, callback){
		new feedbacks(data).save(callback);		
	},
    
    //get feedback list
    feedbackList : function(condition, fields, callback){
        if(!fields)
            fields = {};
        feedbacks.find(condition, fields).sort({'user.firstName':1}).exec(function(err, feedbackList){
            if(err){
                callback(err, null);
            }
            else{
                feedbacks.count(condition, function(err, totalCount){
                    if(err){
                        callback(err, null);
                    }
                    else{
                        callback(null,{count: totalCount,feedbacks: feedbackList});
                    }
                });
            }
        });
    },
	schema : feedbacks
}