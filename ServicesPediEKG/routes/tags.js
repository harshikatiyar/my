var Tags = require('../models/tagmodel.js');
var EKGS = require('../models/ekgsmodel.js');
var responseMessage = require('./responseMessage.js');
var ObjectId = require('mongoose').Types.ObjectId

  /**
 * Method used for list of tags
 * @type : get
 * @returns : custom message
 */ 
 exports.tagListMethod = function ( req, res){
 	try{  					
		Tags.tagssList( {}, {}, function(err, tags){
			if (err) {
				responseMessage.serverErrorFunction(res, err, "tagListMethod");			
			}
			else if(!tags){
				responseMessage.notFoundFunction(res, messages.tagError, "tagListMethod");
			}
			else{
				responseMessage.successsFunction(res, messages.tagSuccess, tags);				
			}
		});			
 	}catch(err){
 		responseMessage.serverErrorFunction(res, err, "tagListMethod");
 	}
 };

 /**
 * Method used for add tag
 * @type : post
 * @returns : custom message
 */ 
 exports.addTagMethod = function ( req, res){
 	try{  					
		Tags.createTag( req.body, function(err, tags){
			if (err) {
				responseMessage.serverErrorFunction(res, err, "addTagMethod");			
			}
			else{
				responseMessage.successsFunction(res, messages.addTagSuccess, tags);				
			}
		});			
 	}catch(err){
 		responseMessage.serverErrorFunction(res, err, "addTagMethod");
 	}
 };

   /**
 * Method used for update tag
 * @type : post
 * @returns : custom message
 */ 
 exports.updateTagMethod = function (req, res){
 	try{  					
		Tags.updateTag( req.body.condition, req.body.data, {multi: false}, function(err, tags){
			if (err) {
				responseMessage.serverErrorFunction(res, err, "updateTagMethod");			
			}
			else if(!tags){
				responseMessage.badRequestFunction(res, messages.updateTagError, "updateTagMethod");
			}
			else{
				EKGS.updateArrayInDocuments({'tags._id': req.body.condition._id},
					{'tags.$.tagName': req.body.data.tagName},
					function(err, updatedEkg){
					if (err) {
						responseMessage.serverErrorFunction(res, err, "updateTagMethod");			
					}
					else if(!updatedEkg){
						responseMessage.badRequestFunction(res, messages.updateTagError, "updateTagMethod");
					}
					else{
						responseMessage.successsFunction(res, messages.updateTagSuccess, tags);
					}
				});				
			}
		});			
 	}catch(err){
 		responseMessage.serverErrorFunction(res, err, "updateTagMethod");
 	}
 };

 /**
 * Method used for delete tag
 * @type : get
 * @returns : custom message
 */ 
 exports.deleteTagMethod = function ( req, res){
 	try{  					
		Tags.removeTag({ _id:req.params.tagId}, function(err, tags){
			if (err) {
				responseMessage.serverErrorFunction(res, err, "deleteTagMethod");			
			}
			else if(!tags){
				responseMessage.badRequestFunction(res, messages.deleteTagError, "deleteTagMethod");
			}
			else{
				EKGS.updateTag({},
					{ $pull: { 'tags': { '_id': ObjectId(req.params.tagId) }}},
					{ multi: true},
					function( err, ekgsUpdated){
					if (err) {
						responseMessage.serverErrorFunction(res, err, "deleteTagMethod");			
					}
					else{	
						responseMessage.successsFunction(res, messages.deleteTagSuccess, {});
					}	
				});							
			}
		});			
 	}catch(err){
 		responseMessage.serverErrorFunction(res, err, "deleteTagMethod");
 	}
 };