//Importing node modules
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//topic schema
var topicsSchema = new mongoose.Schema({
    title: {type:String},
    isActive : {type: Boolean, default: true },
    isTest :{type: Boolean, default: false },
	type : {type: Number},
    ekgs : [{
            title :{type : String},
            _id : {type : Schema.Types.ObjectId}, 
            fileName : {type: String}, 
            history:{type:String}, 
            imageURL : {type : String}            
    }]
});

var topics = mongoose.model('ekgtopics', topicsSchema);

module.exports={
    //create topic
    createTopic : function( data, callback) {        
        new topics(data).save(callback);     
    },
	//get all the topics of the system
	getAllTopics : function(condition, fields, callback){
		if(!fields)
			fields = {};
		topics.find(condition, fields, {sort:{title:1}}, callback);
	},

	//get topic by condition
	getTopic : function(condition, fields, callback){
		if(!fields)
			fields = {};
		topics.findOne(condition, fields, callback);
	},
    
    //update topic
    updateTopic : function(condition, data, query, callback){
        topics.update(condition, data, query, callback);
    },
	//get topics by condtion and projection
	getRandomEkgsGroupByTopic: function(condition, projection, callback){
         topics.aggregate({$match: condition},{$project: projection}, callback);
    },
    //get topics list
    topicsList : function(condition, fields, callback){
        topics.find(condition, fields).sort({title :1}).exec(function(err,topicsList){
            if(err){
                callback(err, null);
            }
            else{
                topics.count(condition, function(err, totalCount){
                    if(err){
                        callback(err, null);
                    }
                    else{
                        callback(null, { count: totalCount, topics:topicsList });
                    }
                });
            }
        });
    },

    //remove topic
    deleteTopic : function(condition, callback){
        topics.remove(condition,callback);
    },
    
    //update ekgs in all topics
    updateEkgInTopic : function(condition, data, callback){
        topics.find(condition, function(err, topicObjects){
            var i=0, count=0;
            for(i; i< topicObjects.length; i++){
                condition._id = topicObjects[i]._id;
                topics.update(condition, { $set: data}, function(err, result){
                    if(err){
                        callback(err);
                    }
                    else{
                         count ++;
                    }
                    if(count == topicObjects.length){
                        callback(null, 1);
                    }                  
                });                
            } 
        });
    },
	schema : topics
}