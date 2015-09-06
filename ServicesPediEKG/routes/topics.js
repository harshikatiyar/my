// Importing custom models
var Topics = require('../models/topicsmodel'),
    responseMessage = require('./responseMessage.js'),
    EKGS = require('../models/ekgsmodel.js'),
    AnswerModel = require('../models/ekgsanswermodel.js'),
    ObjectId = require('mongoose').Types.ObjectId;

/**
 * Method used for get all topics 
 * @type : get
 * @returns : list of topic conatin topic name, id,isTest
 */
exports.topicListForMobile = function (req, res) {
	try{
		Topics.getAllTopics({isActive : true},{title: 1, _id: 1, isTest :1},function(err, topicsData){
			if(err){
				responseMessage.serverErrorFunction(res, err, "topicList");
			}
			else{
				responseMessage.successsFunction(res, messages.allTopicsSuccess, topicsData);
			}
		});
	}catch (err) {
		responseMessage.serverErrorFunction(res, err, "topicList");
	}	
};	

/**
 * Method used for get topics 
 * @type : get 
 * @returns : all topics
 */
exports.topicsListMethod = function (req, res){
    try{
        Topics.topicsList({type: req.params.type},{},function(err, topics){
            if (err) {
                responseMessage.serverErrorFunction(res, err, "topicsListMethod");
            } 
            else if(!topics){
                responseMessage.notFoundFunction(res, messages.topicError, "topicsListMethod");
            }     
            else{
                responseMessage.successsFunction(res, messages.allTopicsSuccess, topics);
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "topicsListMethod"); 
    } 
 };

 /**
 * Method used for add topic 
 * @type : post
 * @returns : newly added topic
 */
exports.addTopicMethod = function (req, res) {
    try{
        EKGS.getAllEKGS({_id: { $in: req.body.ekgs}},{history:1,imageURL:1,fileName:1, title:1},function(err, ekgs){           
            if(err){
                responseMessage.serverErrorFunction(res, err, "addTopicMethod");
            }
            else{
                var topicObject= req.body;
                topicObject.ekgs = ekgs;               
                Topics.createTopic( topicObject, function(err, topicsData){                    
                    if(err){
                        responseMessage.serverErrorFunction(res, err, "addTopicMethod");
                    }
                    else{
                        EKGS.updateInterpretation({_id: {$in : req.body.ekgs}},
                            {isActive: true},
                            {multi: true},
                            function(err, updated){                                
                            responseMessage.successsFunction(res, messages.allTopicsSuccess, topicsData);
                        });
                    }                    
                });
            }
        });       
    }catch (err) {
        responseMessage.serverErrorFunction(res, err, "addTopicMethod");
    }   
};

/**
 * Method used for update topic 
 * @type : post
 * @returns : custom message
 */
exports.updateTopicMethod = function (req, res) {
    try{
        EKGS.getAllEKGS({_id: { $in: req.body.data.ekgs}},{history:1,title:1,imageURL:1,fileName:1},function(err, ekgs){           
            if(err){
                responseMessage.serverErrorFunction(res, err, "updateTopicMethod");
            }
            else{
                var topicObject= req.body.data;
                topicObject.ekgs = ekgs;
                 Topics.updateTopic( req.body.condition, topicObject, {multi: false}, function(err, topicsData){
                    if(err){
                        responseMessage.serverErrorFunction(res, err, "updateTopicMethod");
                    }
                    else{
                        AnswerModel.updateAnswer({topicId:req.params.topicId},
                            {topicTitle: topicObject.topicName },
                            {multi: true},
                            function(err, removed){
                            if(err){
                                responseMessage.serverErrorFunction(res, err, "updateTopicMethod");
                            }
                            else{
                                responseMessage.successsFunction(res, messages.updateTopicSuccess, topicsData);
                            }
                        });                        
                    }
                });
            }
        });       
    }catch (err) {
        responseMessage.serverErrorFunction(res, err, "updateTopicMethod");
    }   
};

/**
 * Method used for delete topic 
 * @type : get
 * @returns : custom message
 */
exports.deleteTopicMethod = function (req, res) {
    try{
        Topics.deleteTopic({ _id: req.params.topicId}, function(err, topicsData){
            if(err){
                responseMessage.serverErrorFunction(res, err, "deleteTopicMethod");
            }
            else{
                AnswerModel.removeAnswer({topicId:req.params.topicId}, function(err, removed){
                    if(err){
                        responseMessage.serverErrorFunction(res, err, "deleteTopicMethod");
                    }
                    else{
                        responseMessage.successsFunction(res, messages.deleteTopicSuccess, topicsData);
                    }
                });                
            }
        });
    }catch (err) {
        responseMessage.serverErrorFunction(res, err, "deleteTopicMethod");
    }   
};