// Importing custom models
var Feedback = require('../models/feedbacksmodel');
var Users = require('../models/usersmodel.js');
var responseMessage = require('./responseMessage.js');

/**
 * Method used for feedback of user
 * @type : post
 * @params : feedback conatin feedbackContent
 * @returns : custom message
 */
exports.feedbackReport = function (req, res) {
	try{
		var userObject = {};
		var sessionId = req.headers.authorization.split(" ")[1];
		Users.getUser({sessionId: sessionId},{}, function(err, user){
			if(err){
				responseMessage.serverErrorFunction(res, err, "feedbackReport");
			}
			else if(!user){
				responseMessage.notFoundFunction(res, messages.userError, "feedbackReport");				
			}
			else{
				userObject._id = user._id;
				userObject.firstName = user.firstName;
				userObject.lastName = user.lastName;
				feedbackModel = {
					"subject": config.feedbackSubject,
					"createdOn": new Date(),
					"feedback": req.body.feedbackContent,
					"comment": "",
					"isPublish": config.falseValue,
					"user": userObject
				}
				Feedback.saveFeedback(feedbackModel,function(err, feedback){
					if(err){
						responseMessage.serverErrorFunction(res, err, "feedbackReport");
					}
					else if(!feedback){
						responseMessage.badRequestFunction(res, messages.feedbackError, "feedbackReport");
					}
					else{
						responseMessage.successsFunction(res, messages.feedbackSuccess,{}); 
					}
				});
			}
			
		});
		
	}catch (err) {
		responseMessage.serverErrorFunction(res, err, "feedbackReport");
	}	
};	

exports.getFeedbackMethod = function(req, res){
	try{
		Feedback.feedbackList({}, {}, function(err, feedbackList){
			if(err){
				responseMessage.serverErrorFunction(res, err, "getFeedbackMethod");
			}
			else if(feedbackList){
				responseMessage.successsFunction(res, messages.getFeedBackList, feedbackList);
			}
			else{
				responseMessage.notFoundFunction(res, messages.getFeedbackListError, "getFeedbackMethod");
			}
		});
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "getFeedbackMethod");
	}
};