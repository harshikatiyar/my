var EKGS = require('../models/ekgsmodel.js'),
    TopicModel = require('../models/topicsmodel.js'),
    AnswerModel = require('../models/ekgsanswermodel.js'),
    responseMessage = require('./responseMessage.js'),
    initialSetup = require('./initialSetup.js'),
    Users = require('../models/usersmodel.js'),
    ObjectId = require('mongoose').Types.ObjectId,
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    formidable=require("formidable"),
    Interpretations = require('../models/ekginterpretationsmodel.js'),
    Notification = require('../routes/notification.js');

/**
 * Method used for get ekgs of a randomly selected topic
 * @type : get 
 * @returns : all ekgs of a random topic
 */
exports.randomEkgsMethod = function( req, res){
try{
    var sessionId = req.headers.authorization.split(" ")[1],
        randomEkgsByTopic = [];
    Users.getUser({sessionId: sessionId},{_id:1}, function(err, user){
        if(err){
            responseMessage.serverErrorFunctstartDateion(res, err, "randomEkgsMethod");
        }                    
        else{    
            if(req.params.personalize == 'false' || req.params.personalize == 0){     
                EKGS.getTotalEkgCount({isActive: true},function(err,count){
                    if(err){
                        responseMessage.serverErrorFunction(res, err, "randomEkgsMethod");
                    }
                    else{
                        var skip = 0;
                        if(count >= config.readNoOfRecords){
                            skip = Math.floor(Math.random() * (count - config.readNoOfRecords - 1)) + 0;
                        }
                        EKGS.getRandomEkgs({isActive: true},{_id:1,history:1,imageURL:1},skip, config.readNoOfRecords, function(err, randomEkgs){
                            if(err){
                                responseMessage.serverErrorFunction(res, err, "randomEkgsMethod");
                            }
                            else{
                                var count=0;                      
                                for(index in randomEkgs){
                                    randomTopics(randomEkgs[index]._id, function(err, randomEkg){
                                        if(randomEkg){
                                            randomEkgsByTopic.push(randomEkg); 
                                        }                                         
                                        count ++;
                                        if(count == randomEkgs.length){
                                            responseMessage.successsFunction(res, messages.ekgsSuccess, randomEkgsByTopic);
                                        }
                                    }); 
                                }
                            }
                        });
                    }
                });
            }
            else{
                var count=0,attemptedEKGS = [];
                AnswerModel.fetchRecordsByGrpAndProjection(
                {
                   userId: user._id
                },{ 
                    ekgId:1,
                    answerSubmitted: 1
                },{
                    _id:{
                            "ekgId" : "$ekgId"
                        },
                        score: { $sum : "$answerSubmitted"},
                        count: { $sum :1},
                },function(err, scores){
                    if(err){
                        responseMessage.serverErrorFunction(res, err, "randomEkgsMethod");
                    }
                    else{
                        var count = 0, blkTrueCount=0, blkFalseCount=0;
                        for(index in scores){
                            attemptedEKGS.push(scores[index]._id.ekgId);
                            if( (scores[index].score/scores[index].count) < config.cutOffValueForRandomEkg){
                                randomTopics(scores[index]._id.ekgId, function(err, result){
                                    if(result){                        
                                        randomEkgsByTopic.push(result);      
                                    }
                                    if(err){
                                        responseMessage.serverErrorFunction(res, err, "randomEkgsMethod");
                                    }
                                    count++;
                                    blkTrueCount++;
                                    if((count == scores.length) && (count == blkFalseCount + blkTrueCount) ){ 
                                        responseMessage.successsFunction(res, messages.ekgsSuccess, randomEkgsByTopic);
                                    }                                   
                                });                                
                            }
                            else{
                                count++;
                                blkFalseCount++;
                            }
                        }
                        if((randomEkgsByTopic.length == 0) && (count == scores.length)){
                            EKGS.getAllEKGS({_id: { $nin: attemptedEKGS}},{_id:1,history:1,imageURL:1},function(err, randomEkgs){
                                if(err){
                                    responseMessage.serverErrorFunction(res, err, "randomEkgsMethod");
                                }
                                else{
                                    var count=0;                      
                                    for(index in randomEkgs){ 
                                        randomTopics(randomEkgs[index]._id, function(err, randomEkg){
                                            if(randomEkg){
                                                randomEkgsByTopic.push(randomEkg);
                                            } 
                                            count ++;
                                            if(count == randomEkgs.length){
                                                responseMessage.successsFunction(res, messages.ekgsSuccess, randomEkgsByTopic);
                                            }
                                        }); 
                                    } 
                                }
                            });
                        }
                    }
                });
            }
        }
    });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "ekgByTopicIdMethod");
    } 
}; 

/**
 * Method used for get topic by ekgId 
 */
randomTopics = function(ekgId, callback){
    TopicModel.getTopic({'ekgs._id': ekgId},
        {title:1,_id:1, ekgs:{$elemMatch:{ _id: ekgId}}},
        function(err, topicObject){
        if(err){
             responseMessage.serverErrorFunction(res, err, "randomEkgsMethod-randomTopics");
        }
        else if(!topicObject){
             callback(null,null);
        }
        else{         
            callback(null, {
                topicId : topicObject._id,
                title: topicObject.title,
                ekgs: [
                    {
                        _id: topicObject.ekgs[0]._id,
                        history: topicObject.ekgs[0].history,
                        imageURL: topicObject.ekgs[0].imageURL,
                    }
                ]
            });                      
        }
    });
};

/**
 * Method used for get ekgs of a topic by id
 * @type : get 
 * @returns : all ekgs of a topic
 */
exports.ekgByTopicIdMethod = function (req, res) {
    try{
    TopicModel.getTopic({_id: req.params.topicId},{"ekgs._id":1,"ekgs.history": 1,"ekgs.imageURL":1, "ekgs.title":1},function(err, topic){ 
        if (err) {
            responseMessage.serverErrorFunction(res, err, "ekgByTopicIdMethod");
        }
        else if(!topic){
            responseMessage.notFoundFunction(res, messages.topicError, "ekgByTopicIdMethod");
        }       
        else{
            responseMessage.successsFunction(res, messages.ekgsSuccess,
                topic.ekgs
            );           
        }
    });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "ekgByTopicIdMethod");
    } 
};

/**
 * Method used for get ekgs of a topic by id
 * @type : get 
 * @returns : all ekgs of a topic
 */
exports.ekgDetailsMethod = function (req, res){
    try{
        EKGS.getEKG({_id: req.params.ekgId},{history:1, answerImageURL:1, explanation:1, diagnosis:1, _id:0,"segment.explanation":1,"segment.level":1,"segment.imageURL":1,therapy:1,urgency:1,differentialDiagnosis:1},function(err, ekg){
            if (err) {
                responseMessage.serverErrorFunction(res, err, "ekgDetailsMethod");
            } 
            else if(!ekg){
                responseMessage.notFoundFunction(res, messages.ekgError, "ekgDetailsMethod");
            }     
            else{
                responseMessage.successsFunction(res, messages.ekgDetailSuccess, ekg);
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "ekgDetailsMethod"); 
    } 
};

/**
 * Method used for get ekgs for admin
 * @type : get 
 * @returns : all ekgs of a topic
 */
exports.ekgsListMethod = function (req, res){
    try{
        EKGS.ekgsList({}, {}, function(err, ekgs){
            if (err) {
                responseMessage.serverErrorFunction(res, err, "ekgsListMethod");
            } 
            else if(!ekgs){
                responseMessage.notFoundFunction(res, messages.ekgError, "ekgsListMethod");
            }     
            else{
                responseMessage.successsFunction(res, messages.ekgsSuccess, ekgs);
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "ekgsListMethod"); 
    } 
 };

 /**
 * Method used for add new ekg 
 * @type : post 
 * @returns : ekg object
 */
exports.addEkgMethod = function (req, res){
    try{
        var sessionId = req.headers.authorization.split(" ")[1];
        Users.getUser({sessionId: sessionId},{}, function(err, user){
            if(err){
                responseMessage.serverErrorFunction(res, err, "addEkgMethod");  
            }
            else if(!user){
                responseMessage.notFoundFunction(res, messages.userError, "uploadEkgImages");               
            }
            else{
                EKGS.createEkg(req.body,function(err, ekg){
                    if (err) {
                        responseMessage.serverErrorFunction(res, err, "addEkgMethod");
                    }             
                    else{
                        fs.exists(config.TempFolder + user._id, function(exists) {
                            if(exists){
                                var count =0;
                                fs.exists( config.ekgImageRoute + ekg._id , function(exists) {
                                    if(!exists){                                        
                                        mkdirp( config.ekgImageRoute + ekg._id ,function(err){
                                            if(ekg.fileName){                                    
                                                var extension = ekg.fileName.split('.')[1];  
                                                ekg.imageURL = config.ekgImageUrl+ekg._id+'/'+ekg._id+ ekg.fileName;
                                                saveAndUpdate('', config.TempFolder+user._id +'/'+ ekg.fileName,  config.ekgImageRoute+ekg._id+'/'+ekg._id+ ekg.fileName); 
                                            }
                                            if(ekg.answerFileName){ 
                                                ekg.answerImageURL = config.ekgImageUrl+ekg._id+'/'+ekg.answerFileName;
                                                saveAndUpdate('', config.TempFolder+user._id +'/'+ ekg.answerFileName,  config.ekgImageRoute+ekg._id+'/'+ekg.answerFileName); 
                                            }
                                            for(index=0;index<ekg.segment.length;index++){
                                                if(ekg.segment[index].fileName){
                                                    ekg.segment[index].imageURL = config.ekgImageUrl+ekg._id+'/'+ekg.segment[index].fileName;
                                                    saveAndUpdate('', config.TempFolder+user._id +'/'+ ekg.segment[index].fileName, config.ekgImageRoute+ekg._id+'/'+ekg.segment[index].fileName); 
                                                    count++;   
                                                }
                                                if(count == ekg.segment.length){
                                                    var answerImageURL = ekg.answerImageURL ? ekg.answerImageURL : " ";
                                                    EKGS.updateInterpretation({_id: ekg._id},{imageURL:ekg.imageURL,answerImageURL:answerImageURL,segment:ekg.segment},{multi:false}, function( err, updated){
                                                        if(err){
                                                            responseMessage.serverErrorFunction(res, err, "addEkgMethod");
                                                        }
                                                        else{
                                                            responseMessage.successsFunction(res, messages.addEkgSuccess, ekg);
                                                        }
                                                    });   
                                                }
                                            }
                                            if(ekg.segment.length==0){
                                                var answerImageURL = ekg.answerImageURL ? ekg.answerImageURL : " ";
                                                EKGS.updateInterpretation({_id: ekg._id}, {imageURL:ekg.imageURL,answerImageURL:answerImageURL,segment:ekg.segment}, {multi:false}, function( err, updated){
                                                    if(err){
                                                        responseMessage.serverErrorFunction(res, err, "addEkgMethod");
                                                    }
                                                    else{
                                                        responseMessage.successsFunction(res, messages.addEkgSuccess, ekg);
                                                    }
                                                });                                                
                                            }               
                                        });
                                    }
                                    else{
                                        responseMessage.successsFunction(res, messages.addEkgSuccess, ekg);  
                                    }                                    
                                });                     
                            }
                            else{
                                responseMessage.successsFunction(res, messages.addEkgSuccess, ekg);  
                            } 
                        });
                    }
                });
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "addEkgMethod"); 
    } 
 };
 
/**
 * Method used for update ekg 
 * @type : post 
 * @returns : custom object
 */
exports.updateEkgMethod = function (req, res){
    try{
        var sessionId = req.headers.authorization.split(" ")[1];
        Users.getUser({sessionId: sessionId},{}, function(err, user){
            if(err){
                responseMessage.serverErrorFunction(res, err, "updateEkgMethod");  
            }           
            else{
                EKGS.updateEkg(req.body.condition, req.body.data, function(err, ekg){
                    if (err) {
                        responseMessage.serverErrorFunction(res, err, "updateEkgMethod");
                    } 
                    else if(!ekg){
                        responseMessage.notFoundFunction(res, messages.ekgError, "updateEkgMethod");
                    }     
                    else{
                        var count=0; 
                        if(ekg.fileName){
                            removeImage("public"+ ekg.imageURL); 
                            ekg.imageURL = config.ekgImageUrl+ekg._id+'/'+ekg._id+ ekg.fileName;
                            saveAndUpdate('', config.TempFolder+user._id +'/'+ ekg.fileName,  config.ekgImageRoute+ekg._id+'/'+ekg._id+ ekg.fileName); 
                        }
                        if(ekg.answerFileName){  
                            var oldURL = "public"+ekg.answerImageURL;                               
                            var extension = ekg.answerFileName.split('.')[1];  
                            ekg.answerImageURL = config.ekgImageUrl+ekg._id+'/'+ekg.answerFileName;
                            saveAndUpdate(oldURL, config.TempFolder+user._id +'/'+ ekg.answerFileName,  config.ekgImageRoute+ekg._id+'/'+ekg.answerFileName); 
                        }
                        for(index=0;index<ekg.segment.length;index++){
                            if(ekg.segment[index].fileName){
                                var oldURL = "public"+ekg.segment[index].imageURL; 
                                ekg.segment[index].imageURL = config.ekgImageUrl+ekg._id+'/'+ekg.segment[index].fileName;
                                saveAndUpdate(oldURL, config.TempFolder+user._id +'/'+ ekg.segment[index].fileName,  config.ekgImageRoute+ekg._id+'/'+ekg.segment[index].fileName);
                                count++;   
                            }
                            else{
                                count++;
                            }
                            if(count == ekg.segment.length){                                
                                var answerImageURL = ekg.answerImageURL ? ekg.answerImageURL : " ";
                                updateEkgAndTopic(ekg, answerImageURL, req, res);                               
                            }
                        }                   
                    }
                    if(ekg.segment == undefined || ekg.segment.length==0){					
					    var answerImageURL = ekg.answerImageURL ? ekg.answerImageURL : " ";
                        updateEkgAndTopic(ekg, answerImageURL, req, res);                                            
                    } 
                });
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "updateEkgMethod"); 
    } 
  };

/**
* Method used to update ekg and topic
*/
updateEkgAndTopic = function(ekg, answerImageURL, req, res){
    try{
     EKGS.updateInterpretation({_id: ekg._id},{imageURL:ekg.imageURL,answerImageURL:answerImageURL,segment:ekg.segment},{multi:false}, function( err, updated){
        if(err){
            responseMessage.serverErrorFunction(res, err, "updateEkgAndTopic");
        }
        else{
            var ekgObject = {
                fileName:ekg.fileName,
                imageURL:ekg.imageURL,
                title:ekg.title,
                _id:ekg._id,
                history:ekg.history
            };
            if(req.body.topics.removedTopicIds.length != 0){
                removeEkgInTopic(ekg._id, req.body.topics.removedTopicIds, function(err, removed){
                    if(err){
                        responseMessage.serverErrorFunction(res, err, "removeEkgInTopic");  
                    }
                    else if(!removed){
                        responseMessage.badRequestFunction(res, messages.topicNotRemovedForEkg, "removeEkgInTopic");
                    }
                    else{                        
                        if(req.body.topics.addTopicIds.length != 0){
                            addEkgInTopic(ekgObject, req.body.topics.addTopicIds, function(err, added){
                                if(err){
                                    responseMessage.serverErrorFunction(res, err, "addEkgInTopic");    
                                }
                                else if(!added){
                                    responseMessage.badRequestFunction(res, messages.topicNotUpdatedForEkg, "addEkgInTopic");
                                }
                                else{
                                    updateEkgInTopic(res, ekg);
                                }
                            });
                        }
                        else{
                            updateEkgInTopic(res, ekg);
                        }
                    }
                });
            }
            else{
                if(req.body.topics.addTopicIds.length != 0){
                    addEkgInTopic(ekgObject, req.body.topics.addTopicIds, function(err, added){
                        if(err){
                            responseMessage.serverErrorFunction(res, err, "addEkgInTopic");    
                        }
                        else if(!added){
                            responseMessage.badRequestFunction(res, messages.topicNotUpdatedForEkg, "addEkgInTopic");
                        }
                        else{
                            updateEkgInTopic(res, ekg);
                        }
                    });
                }
                else{
                    updateEkgInTopic(res, ekg);
                }                
            }
        }
    });    
    }catch(err){
        responseMessage.serverErrorFunction(res, err, "updateEkgAndTopic"); 
    } 
};

/**
 * Method used for remove image from specified location
 */
removeImage = function(imagePath){
    fs.unlinkSync(imagePath);
};

/**
* Method used for update ekg in topic
*/
updateEkgInTopic = function(res, ekg){
    try{
        TopicModel.updateEkgInTopic( {'ekgs._id': ekg._id}, 
        {'ekgs.$.title':ekg.title,'ekgs.$.imageURL':ekg.imageURL, 'ekgs.$.fileName':ekg.fileName, 'ekgs.$.history' : ekg.history},
        function(err, updated){
        if (err) {
            responseMessage.serverErrorFunction(res, err, "updateEkgMethod");
        } 
        else if(updated){
            responseMessage.successsFunction(res, messages.updateEkgSuccess, {});
        }
        else{
            responseMessage.badRequestFunction(res, messages.updateEkgError, "updateEkgMethod");
        }
    });

    }catch(err){
        responseMessage.serverErrorFunction(res, err, "updateEkgInTopic"); 
    }
      
};

 /**
 * Method used for delete ekg 
 * @type : get 
 * @returns : custom object
 */
exports.deleteEkgMethod = function (req, res){
    try{
        EKGS.removeEkg({_id:req.params.ekgId}, function(err, ekgs){
            if (err) {
                responseMessage.serverErrorFunction(res, err, "deleteEkgMethod");
            } 
            else if(!ekgs){
                responseMessage.notFoundFunction(res, messages.ekgError, "deleteEkgMethod");
            }     
            else{
                TopicModel.updateTopic({'ekgs._id':  ObjectId(req.params.ekgId)},
                    { $pull: { 'ekgs': { '_id': ObjectId(req.params.ekgId) }}},
                    { multi: true },
                    function(err, updated){
                    if (err) {
                        responseMessage.serverErrorFunction(res, err, "deleteEkgMethod");
                    }
                    else{
                        responseMessage.successsFunction(res, messages.deleteEkgSuccess, {});
                    }
                });               
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "deleteEkgMethod"); 
    } 
};

/**
 * Method used for upload ekg image 
 */
exports.uploadEkgImages = function(req, res){
    try{
        var sessionId = req.headers.authorization.split(" ")[1];
        var randomNumber = Math.floor((Math.random() * 100) + 1);
        Users.getUser({sessionId: sessionId},{}, function(err, user){
            if(err){
                responseMessage.serverErrorFunction(res, err, "uploadEkgImages");   
            }
            else if(!user){
                responseMessage.notFoundFunction(res, messages.userError, "uploadEkgImages");               
            }
            else{ 
                initialSetup.createDirectoryStructure(config.TempFolder + user._id); 
                var form = new formidable.IncomingForm();                
                form.parse(req, function(err, fields, files) {                    
                    if(files.image){
                        copyImage(files.image.path, config.TempFolder + user._id +'/'+randomNumber+files.image.name, function(success){
                           
                            responseMessage.successsFunction(res, messages.imageSuccess, { fileName: randomNumber+files.image.name });
                        });                        
                    }
                    else{
                        responseMessage.badRequestFunction(res, messages.imageError, "uploadEkgImages");                        
                    }
                });             
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "uploadEkgImages"); 
    }
};

/**
* Method used for check image path if exist then copy it to specified location
*/
var saveAndUpdate = function(ekgPath, pathTo, pathFrom){
    fs.exists(pathTo, function(exists) {
        if(exists){
            if(ekgPath){
                removeImage(ekgPath);
            }
            copyImage(pathTo, pathFrom, function(success){});
        }
    });
};

/**
 * Method used for copy image 
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

/**
* Method used for retrieve interpretation
*/
getInterpretations = function(interpretationArray, total, callback){
    var j=0, interpretations =[], count=0;
    for(j;j<total;j++){
        Interpretations.getInterpretation({'interpretations._id':interpretationArray[j]},
        {'interpretations.$':1},
        function(err, result){
            if(err){
                callback(null);
            }
            else{
                interpretations.push(result.interpretations[0]); 
                count++;
                if(count == total){
                    callback(null, interpretations);
                }
            }            
        });              
    }
};

 /**
 * Method used for send notification for all user
 * @type : post 
 * @returns : custom message
 */
exports.sendTestNotification = function(req, res){
  var message = JSON.parse(JSON.stringify(req.body.message));
    try{
        var count=0;
        Users.getUsers({},{deviceId:1, deviceType:1, isPushNotificationDisabled:1, _id:0, sessionId:1}, function(err, users){                 
            if(err){
                responseMessage.serverErrorFunction(res, err, "sendTestNotification"); 
            }
            else{
                for(var index in users){ 
                
                    if((!users[index].isPushNotificationDisabled) && (users[index].sessionId)){
                        Notification.sendPushNotification(users[index], message);
                        count++;                        
                    }
                    else{
                        count++;
                    }
                    if(count == users.length){
                        responseMessage.successsFunction(res, messages.notificationSuccess, {});  
                    }
                }
            }
        });
    }catch(err){
        responseMessage.serverErrorFunction(res, err, "sendTestNotification"); 
    }

};

exports.retrieveTopicOnUpdateEkgMethod =  function(req,res){
    try{
        TopicModel.getAllTopics({"ekgs._id":ObjectId(req.body.ekgId)},{title:1},function(err, relativeTopics){
            if(err){
                responseMessage.serverErrorFunction(res, err, "retrieveTopicOnUpdateEkgMethod"); 
            }
            else if(relativeTopics.length<1){
                responseMessage.notFoundFunction(res, messages.noTopicFoundForEkg, "retrieveTopicOnUpdateEkgMethod");               

            }
            else{
                responseMessage.successsFunction(res, messages.topicForRelativeEkgSuccess, relativeTopics)
            }

        });

    }catch(err){
        responseMessage.serverErrorFunction(res, err, "retrieveTopicOnUpdateEkgMethod"); 
    }
}

/**
* Used to associate ekg under a topic(s).
*/
exports.addEkgInTopicMethod = function(req,res){
    try{
        EKGS.getEKG({_id: ObjectId(req.body.ekgId)},
            {fileName:1, title:1, _id:1, imageURL:1, history:1},
            function(err, ekg){
                if (err) {
                    responseMessage.serverErrorFunction(res, err, "addEkgInTopicMethod");
                } 
                else if(!ekg){                   
                    responseMessage.notFoundFunction(res, messages.ekgError, "addEkgInTopicMethod");
                }     
                else{    
                    addEkgInTopic(ekg, req.body.topics.topicIds, function(err, resultUpdateTopic){
                        if(err){
                            responseMessage.serverErrorFunction(res, err, "addEkgInTopicMethod");
                        }
                        else if(!resultUpdateTopic){
                            responseMessage.badRequestFunction(res, messages.topicsNotAddedForEkg, "addEkgInTopicMethod");
                        }
                        else{
                            responseMessage.successsFunction(res, messages.addEkgInTopicSuccess, resultUpdateTopic);
                        }
                    });
                }
        }); 
    }catch (err) {
        responseMessage.serverErrorFunction(res, err, "addEkgInTopicMethod");
    }
};

/**
 * Internal Method used for removing an ekg from the given array of topicIds
 */
var removeEkgInTopic = function(ekgId,removedTopicIds,callback){
    try{
        if(removedTopicIds != undefined || removedTopicIds.length!=null || removedTopicIds.length>0){
            var topicIdArray = [];
            for(var i=0;i<removedTopicIds.length;i++){
                topicIdArray.push(ObjectId(removedTopicIds[i]));
            }
            TopicModel.updateTopic({ _id: { $in: topicIdArray } },
                { $pull: { 'ekgs': { '_id': ObjectId(ekgId) } } },
                {upsert : true,multi : true}, 
                function(err, resultUpdateTopic){
                   callback(err,resultUpdateTopic);
            });
        }
        else{
            callback(config.fieldMissing);
        }
    }catch(err){
        responseMessage.serverErrorFunction(res, err, "removeEkgInTopic");
    }            
};
/**
 * Internal Method used for adding an ekg in the given array of topicIds
 */
var addEkgInTopic = function(ekg,topicIds,callback){
    try{
        if(topicIds != undefined && topicIds.length!=null && topicIds.length>0){
            var topicIdArray = [];
            for(var i=0;i<topicIds.length;i++){
                topicIdArray.push(ObjectId(topicIds[i]));
            }
            TopicModel.updateTopic({ _id: { $in: topicIdArray } },
                { $addToSet : {"ekgs" : ekg} }, 
                {multi : true}, 
                function(err, resultUpdateTopic){
                    callback(err, resultUpdateTopic);           
            });
        }
        else{
            callback(config.fieldMissing);
        }
    }catch(err){
        responseMessage.serverErrorFunction(res, err, "addEkgInTopic");
    }    
};


