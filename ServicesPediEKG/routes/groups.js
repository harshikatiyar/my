var Interpretations = require('../models/ekginterpretationsmodel.js'),
    responseMessage = require('./responseMessage.js'),
    mongoose = require('mongoose'),
    EKGS = require('../models/ekgsmodel.js'),
    ObjectId = require('mongoose').Types.ObjectId;

/**
 * Method used for get groups
 * @type : get 
 * @returns : all interpretation groups
 */
exports.groupsListMethod = function (req, res){
    try{
        Interpretations.interpretationGroupsList({},{},function(err, groups){
            if (err) {
                responseMessage.serverErrorFunction(res, err, "groupsListMethod");
            }
            else if(!groups){
                responseMessage.notFoundFunction(res, messages.groupError, "groupsListMethod");
            }   
            else{
                responseMessage.successsFunction(res, messages.groupSuccess, groups);
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "groupsListMethod"); 
    } 
 };

 /**
 * Method used for add group
 * @type : post 
 * @returns : mewly added interpretation group
 */
exports.addGroupMethod = function (req, res){
    var count = 0, 
        groupObject = {
            groupName: req.body.groupName,
            interpretations : []
        };
    for(index in req.body.interpretations){
        groupObject.interpretations.push({
            _id : mongoose.Types.ObjectId(),
            interpretation : req.body.interpretations[index]
        });
        count ++;
        if(count == req.body.interpretations.length){
            saveInterpretationGroup( res, groupObject);
        }
    }
    if(req.body.interpretations.length == 0){
         saveInterpretationGroup( res, groupObject);
    }
 };

/**
 * Method used for save interpretation 
 * @type : post 
 * @returns : custom message
 */
 saveInterpretationGroup = function(res, data){
     try{        
        Interpretations.saveInterpretations(data, function(err, groups){
            if (err) {
                responseMessage.serverErrorFunction(res, err, "addGroupMethod-saveInterpretationGroup");
            }  
            else{
                responseMessage.successsFunction(res, messages.addGroupSuccess, groups);
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "addGroupMethod-saveInterpretationGroup"); 
    } 
 };

/**
 * Method used for update group
 * @type : post 
 * @returns : custom message
 */
exports.updategroupMethod = function (req, res){
    try{            
        Interpretations.updateGroup(req.body.condition, req.body.data, function(err, groupInterpretation){
            var i=0;
            if (err) {
                responseMessage.serverErrorFunction(res, err, "updategroupMethod");
            }  
            else if(!groupInterpretation){
                responseMessage.badRequestFunction(res, messages.updateGroupError, "updategroupMethod");                
            }
            else{                
                responseMessage.successsFunction(res, messages.updateGroupSuccess, groupInterpretation);                        
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "updategroupMethod"); 
    } 
 };

/**
 * Method used for delete groups 
 * @type : get 
 * @returns : custom message
 */
exports.deleteGroupMethod = function (req, res){
    try{
        Interpretations.getInterpretation({_id: ObjectId(req.params.groupId)}, { "interpretations": 1}, function(err, GroupObject){
            Interpretations.removeGroup({_id: ObjectId(req.params.groupId)}, function(err, updated){
                if (err) {
                    responseMessage.serverErrorFunction(res, err, "deleteGroupMethod");
                }  
                else if(updated){                    
                    responseMessage.successsFunction(res, messages.groupDeleteSuccess, {});                            
                }
                else{
                    responseMessage.badRequestFunction(res, messages.groupDeleteError, "deleteGroupMethod");
                }
            });
        });       
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "deleteGroupMethod"); 
    } 
 };



/**
 * Method used for add interpretation 
 * @type : post 
 * @returns : custom message
 */
exports.addInterpretationsMethod = function(req, res){
    try{   
        var interpretationArray = [], count=0;
        for (var i = 0; i < req.body.interpretationsList.length; i++) {
            interpretationArray.push(
                {_id: mongoose.Types.ObjectId(), interpretation: req.body.interpretationsList[i]}
            );  
            count++;
        };  
        if(count == req.body.interpretationsList.length){
            Interpretations.updateInterpretation({_id: req.body.groupId}, 
                { $push: { interpretations: { $each: interpretationArray }}}, 
                {multi: false}, function(err, groups){
                if (err) {
                    responseMessage.serverErrorFunction(res, err, "addInterpretationsMethod");
                }else if(!groups){
                    responseMessage.badRequestFunction(res, messages.addInterpretationError, "addInterpretationsMethod");
                } 
                else{
                    responseMessage.successsFunction(res, messages.addInterpretationSuccess, groups);
                }
            });
        }      
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "addInterpretationsMethod"); 
    } 
};

/**
 * Method used for edit interpretation 
 * @type : post 
 * @returns : custom message
 */
 exports.EditInterpretationsMethod = function(req, res){
    try{
        Interpretations.updateGroup({'interpretations._id':req.body.condition._id},
            { $set: {'interpretations.$.interpretation': req.body.data.interpretation}}, 
            function(err, groupInterpretation){
            var i=0;
            if (err) {
                responseMessage.serverErrorFunction(res, err, "EditInterpretationsMethod");
            }  
            else if(!groupInterpretation){
                responseMessage.badRequestFunction(res, messages.updateInterpretationError, "EditInterpretationsMethod");                
            }
            else{                
                responseMessage.successsFunction(res, messages.updateInterpretationSuccess, {});                        
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "EditInterpretationsMethod"); 
    } 
}; 

/**
 * Method used for delete interpretation 
 * @type : get 
 * @returns : custom message
 */
 exports.deleteInterpretationsMethod = function(req, res){
    try{   
        Interpretations.updateInterpretation({}, 
            { $pull: { 'interpretations': { '_id': ObjectId(req.params.interpretationId) }}}, 
            {multi: true}, 
            function(err, updated){
            if (err) {
                responseMessage.serverErrorFunction(res, err, "deleteInterpretationsMethod");
            }
            else if(!updated){
                responseMessage.badRequestFunction(res, messages.removeInterpretationError, "deleteInterpretationsMethod");
            }  
            else{
                EKGS.updateInterpretationInEkg(ObjectId(req.params.interpretationId), 
                    {},
                    {multi: true},
                    function(err, updated){
                    if (err) {                
                        responseMessage.serverErrorFunction(res, err, "deleteInterpretationsMethod");
                    }  
                    else{
                        responseMessage.successsFunction(res, messages.removeInterpretationSuccess, {});
                    }
                });
            }
        });          
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "deleteInterpretationsMethod"); 
    } 
 };

/**
* copy image from temp to respective folder
*/
var copyImage = function(readLocation, WriteLocation, callback){ 
    var is = fs.createReadStream(readLocation); 
    var os = fs.createWriteStream(WriteLocation);  
    is.pipe(os);
    is.on('end',function(err, value) { 
        fs.unlinkSync(readLocation);
         callback(true);
    });   
};