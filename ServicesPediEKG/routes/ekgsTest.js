var EKGS = require('../models/ekgsmodel.js'),
    TopicModel = require('../models/topicsmodel.js'),
    AnswerModel = require('../models/ekgsanswermodel.js'),
    responseMessage = require('./responseMessage.js'),
    Users = require('../models/usersmodel.js'),
    InterpretationModel = require('../models/ekginterpretationsmodel.js'),
    ObjectId = require('mongoose').Types.ObjectId,
    notification = require('../routes/notification.js');
    


/**
 * Method used for submit ekgs diagnosis answer
 * @type : post 
 * @returns : report with score and correct answer
 */
exports.submitEkgDiagnosisMethod = function (req, res) {
    try{
        EKGS.getEKGAnswer(req.body,{diagnosis:1,explanation:1,answerImageURL:1,'tags.tagName':1,interpretationList:1, title: 1},function(err, correct){
             if (err) {              
                 responseMessage.serverErrorFunction(res, err, "submitEkgDiagnosisMethod");
            } 
            else {
                if(correct){
                    responseMessage.successsFunction(res, messages.submitAnswerSuccess, 
                        {
                            answer: 1
                        }
                    );                    
                }
                else{
                    responseMessage.successsFunction(res, messages.submitAnswerSuccess,
                        {
                            answer: 0
                        }
                    ); 
                } 
                EKGS.getEKG({_id: ObjectId(req.body.ekgId)},{diagnosis:1,explanation:1,answerImageURL:1,'tags.tagName':1,interpretationList:1, title: 1},function(err, ekgObject){
                    if(ekgObject){
                        var tagNames = [];
                        for(var index =0; index < ekgObject.tags.length; index++){
                            tagNames.push(ekgObject.tags[index].tagName);
                        }
                        getInterpretaionNames(ekgObject.interpretationList, res, function(err, correctAnswers){                    
                            var sessionId = req.headers.authorization.split(" ")[1];
                            Users.getUser({sessionId: sessionId},{_id:1}, function(err, user){                  
                                if(correctAnswers){
                                    InterpretationModel.getInterpretations(
                                        {'interpretations._id':{ $in: req.body.diagnosis}},
                                        {'_id':0,'interpretations':1}, 
                                        function(err, userInterpretations){
											var tempSubmitAnswervalue = [];                                    
											for(var i=0; i<userInterpretations.length; i++){
												for(var j=0;j<userInterpretations[i].interpretations.length;j++){
													for(var k=0;k<req.body.diagnosis.length;k++){
														if(userInterpretations[i].interpretations[j]._id == req.body.diagnosis[k]){
															tempSubmitAnswervalue.push(userInterpretations[i].interpretations[j].interpretation); 
														}
													}
											    }
										    }
                                            var answerObject = {
                                                ekgId: req.body.ekgId,
                                                topicId: req.body.topicId,
                                                userId: user._id,
                                                answerSubmitted: correct ? "1": "0",
                                                submitAnswerValue: tempSubmitAnswervalue,
                                                ekgType: req.body.ekgType == 1 ? 'Topic' : 'Category',
                                                dateAttempted: Date.now(),
                                                history: req.body.history,
                                                title: req.body.title,
                                                correctAnswer: correctAnswers,
                                                tags: tagNames,
                                                ekgTitle: ekgObject.title,
                                                submissionSessionId: req.body.submissionSessionId
                                            };
                                            AnswerModel.updateAnswer({userId:user._id, ekgId: req.body.ekgId, topicId: req.body.topicId, submissionSessionId: req.body.submissionSessionId},
                                                answerObject, 
                                                {upsert: true},
                                                function(err, saved){                            
                                            });
                                    });
                                }
                            });
                        }); 
                     
                    }
                });   
            }
        });        
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "submitEkgDiagnosisMethod");     
    } 
 };

/*
* Method used for get correct answer text
*/
getInterpretaionNames = function(interpretationList, res, callback){
    var interpretationId =[], interpretationNames = [], correctAnswers = [];
    for(outerIndex in interpretationList){
        var totallen = interpretationList[outerIndex].interpretations? interpretationList[outerIndex].interpretations.length: 0;
        var innerIndex=0;
        for(innerIndex;innerIndex<totallen;innerIndex++){   
       interpretationId.push(ObjectId(interpretationList[outerIndex].interpretations[innerIndex]));
        }
    }   
  InterpretationModel.getInterpretations({'interpretations._id':{ $in: interpretationId}},
        {'_id':0,'interpretations.$.name':1}, 
        function(err, interpretations){
        if(err){
            responseMessage.serverErrorFunction(res, err, "submitEkgDiagnosisMethod");
        }
        else{
           var outerIndex =0;                      
            for(outerIndex in interpretations){
                var totallen =  interpretations ? interpretations.length : 0;
                for(innerIndex=0; innerIndex < totallen; innerIndex++){                    
                    if(interpretations[outerIndex].interpretations[innerIndex]){
                        interpretationNames[interpretations[outerIndex].interpretations[innerIndex]._id] = interpretations[outerIndex].interpretations[innerIndex].interpretation;
                    }
                   
                }
            }
            for(outerIndex=0; outerIndex < interpretationList.length; outerIndex++){
                var interpretationObjects = [];                    
                    var totallen = interpretationList[outerIndex].interpretations? interpretationList[outerIndex].interpretations.length: 0;
                    var innerIndex=0;
                    for(innerIndex;innerIndex<totallen;innerIndex++){
                        if(interpretationNames[interpretationList[outerIndex].interpretations[innerIndex]]!= null){
                            interpretationObjects.push(interpretationNames[interpretationList[outerIndex].interpretations[innerIndex]]); 
                        }              
                        
                    }
                correctAnswers.push(interpretationObjects);  
            }
            callback(null, correctAnswers);
        }
    });
};
 /**
 * Method used for get test result of a topic
 * @type : get 
 * @returns : report with score and correct answer
 */
 exports.testResultMethod = function (req, res) {
    try{
        var sessionId = req.headers.authorization.split(" ")[1];
        Users.getUser({sessionId: sessionId},{_id:1}, function(err, user){                  
            if(err){
                responseMessage.serverErrorFunction(res, err, "testResultMethod");
            }
            else{
                AnswerModel.getDataByGroup(
                    {topicId : ObjectId(req.params.topicId),submissionSessionId:req.params.submissionsessionId,userId: ObjectId(user._id)},
                    {_id: { _id:"$ekgId",history:"$history"}, count : { $sum: 1}, answer: { $sum : "$answerSubmitted"}},
                    function(err, testResult){
                        if (err) {
                             responseMessage.serverErrorFunction(res, err, "testResultMethod");
                        } 
                        else if(testResult.length == 0 || !testResult){
                            responseMessage.badRequestFunction(res, messages.testError, "testResultMethod");
                        }
                        else{
                            var avgScore =0,count=0,score=0,total=0,ekgResult=[];
                            for(index in testResult){
                            score += testResult[index].answer;
                            total += testResult[index].count;
                            count ++;
                            ekgResult.push({
                                history : testResult[index]._id.history,
                                answer : testResult[index].answer
                            });                           
                        }
                        avgScore = (score/total)*100;                          
                        if(count == testResult.length) {              
                            responseMessage.successsFunction(res, messages.testResultSuccess,
                                {
                                     score: avgScore, detailScore: ekgResult
                                }
                            );
                        }
                    }
                });
            }
        });
    } catch (err) {
        responseMessage.serverErrorFunction(res, err, "testResultMethod");
    }
 };

 /**
 * Method used for get score report topic wise by admin
 * @type : get 
 * @returns : report with score and correct answer
 */
exports.scoreReportTopicBasis = function(req, res) {
    try{
        var startDate = new Date(parseInt(req.params.startDate)),
            endDate = new Date(parseInt(req.params.endDate));
        if(req.params.ekgId){
            var condition = { 
                topicId: ObjectId(req.params.topicId), 
                ekgId: ObjectId(req.params.ekgId), 
                dateAttempted: { 
                    $gte: startDate,
                    $lte: endDate
                }
            };
            scoreReportMethodCallForTopic(startDate, endDate, condition, {_id: ObjectId(req.params.userId) }, req.params.intervalType, res );
        }
        else{
            var condition = { 
                topicId: ObjectId(req.params.topicId),
                dateAttempted: { 
                    $gte: startDate,
                    $lte: endDate
                }
            };
            scoreReportMethodCallForTopic(startDate, endDate, condition, {_id: ObjectId(req.params.userId) }, req.params.intervalType, res );
        }       
    } catch (err) {
       responseMessage.serverErrorFunction(res, err, "scoreReportTopicBasis");
    }
};

 /**
 * Method used for set query parameter for get score report for topic
 */ 
scoreReportMethodCallForTopic = function (startDate, endDate, condition, user, intervalType, res) {
    try{        
        var projection = {
                dateAttempted:1,
                userId:1,
                answerSubmitted: 1,
            },
            groupingLevelFisrt,
            groupingLevelSecond = {
                _id: { userId: "$_id.userId" },
                userId: {$first: "$_id.userId"}, 
                avg: { $sum: "$_id.score" },
                totalCount: { $sum: "$_id.count"},
                scores: {
                    $addToSet: {
                        key: "$_id.key", 
                        value:"$_id.value"
                    }
                }
            };
        switch(intervalType){
            case '1':
                groupingLevelFisrt = {
                    _id: {  userId: "$userId", key: { $dayOfMonth:  "$dateAttempted" }, month: { $month: "$dateAttempted"}, year: { $year: "$dateAttempted"}},
                    score: { $sum : "$answerSubmitted"},
                    count: { $sum :1},
                }; 
                groupingLevelIntermediate = {
                    _id: { 
                        userId: "$_id.userId", 
                        key:"$_id.key" , 
                        month: "$_id.month",
                        score:"$score",
                        count: "$count",
                        value: { $multiply: [{$divide: ["$score","$count"]}, 100]}
                    }
                };
                getDailyScore_reportForTopic( res, condition, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate);
                break;
            case '2': 
                groupingLevelFisrt = {
                    "_id":{
                        "userId":"$userId",
                        "key": {$week : "$dateAttempted"}
                    },
                    score: { $sum : "$answerSubmitted"},
                    count: { $sum :1},
                };
                groupingLevelIntermediate = {
                    _id: { 
                        userId: "$_id.userId", 
                        key:"$_id.key",
                        score:"$score",
                        count: "$count",
                        value: { $multiply: [{$divide: ["$score","$count"]}, 100]}
                    }
                };
                getScore_reportForTopic( res, 2, condition, projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate);
                break;
            case '3':    
                groupingLevelFisrt = {
                    "_id":{
                        "userId":"$userId",
                        "key": {$month: "$dateAttempted"}
                    },
                    score: { $sum : "$answerSubmitted"},
                    count: { $sum :1},
                };
                groupingLevelIntermediate = {
                    _id: { 
                        userId: "$_id.userId",
                        key:"$_id.key",
                        score:"$score",
                        count: "$count",
                        value: { $multiply: [{$divide: ["$score","$count"]}, 100]}
                    }
                };
                getScore_reportForTopic( res, 3, condition, projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate);
                break;
            case '4':
                projection = {
                    dateAttempted:1,
                    userId:1,
                    answerSubmitted: 1,
                    quarter:{$cond:[{$lte:[{$month:"$dateAttempted"},3]},
                    "1",
                        {$cond:[{$lte:[{$month:"$dateAttempted"},6]},
                        "2",
                            {$cond:[{$lte:[{$month:"$dateAttempted"},9]},
                                "3",
                                "4"
                            ]}
                        ]}
                    ]}
                };
                groupingLevelFisrt = {
                    "_id":{
                        "userId":"$userId",
                        "key":"$quarter"
                    },
                    score: { $sum : "$answerSubmitted"},
                    count: { $sum :1},
                };
                groupingLevelIntermediate = {
                    _id: { 
                        userId: "$_id.userId", 
                        key:"$_id.key",
                        score:"$score",
                        count: "$count",
                        value: { $multiply: [{$divide: ["$score","$count"]}, 100]}
                    }
                };                 
                getScore_reportForTopic( res, 4, condition, projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate);
                break;
        }        
    } catch (err) {
       responseMessage.serverErrorFunction(res, err, "scoreReportMethodCallForTopic");
    } 
};

/**
* Method used for calculate scores and call method to set response object
*/ 
getDailyScore_reportForTopic = function( res, condition, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate){
    var testAttemptedUser = [], usersName = [], count=0;
    AnswerModel.getScoreWeeklyBasis( condition, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, function(err, resultReport){
        if (err) {
            responseMessage.serverErrorFunction(res, err, "getDailyScore_reportForTopic");
        } 
        else if(resultReport.length == 0 || !resultReport){
            responseMessage.notFoundFunction(res, messages.scoreReportError, "getDailyScore_reportForTopic");
        }
        else{
            for(var index in resultReport){
                testAttemptedUser.push(resultReport[index].userId);
                count++;            
                if(count == resultReport.length){
                    Users.getUsers({_id: { $in: testAttemptedUser}},{_id:1,firstName:1,lastName:1},function(err, usersObject){
                        if(err){
                            responseMessage.serverErrorFunction(res, err, "getDailyScore_reportForTopic");
                        }
                        else{
                            var traker =0;
                            for(var j in usersObject){
                                usersName[usersObject[j]._id] = usersObject[j].firstName+ ' ' + usersObject[j].lastName;
                                traker++;
                                if(traker == usersObject.length){
                                    getEkgUserWiseForScoreReport(res, condition, function(ekgScore){
                                        groupEkgUserWise(ekgScore, function(ekgTopicWise){
                                            setResponseOfWeekForTopic(res, startDate, resultReport, usersName, ekgTopicWise);
                                        });
                                    });
                                }
                            }
                        }
                    });
                }
            }
        }
    });
};

/**
* Method used for calculate scores and call method to set response object 
*/ 
getScore_reportForTopic = function(res, interval, condition, projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate){
    var testAttemptedUser = [], usersName = [], count=0;
    AnswerModel.getScoreReport( condition, projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, function(err, resultReport){
        if (err) {
            responseMessage.serverErrorFunction(res, err, "scoreReportMethod-getScore");
        } 
        else if(resultReport.length == 0 || !resultReport){
            responseMessage.notFoundFunction(res, messages.scoreReportError, "scoreReportMethod-getScore");
        }
        else{
            for(var index in resultReport){
                testAttemptedUser.push(resultReport[index].userId);
                count++;            
                if(count == resultReport.length){
                    Users.getUsers({_id: { $in: testAttemptedUser}},{_id:1,firstName:1,lastName:1},function(err, usersObject){
                        if(err){
                            responseMessage.serverErrorFunction(res, err, "testResultMethod");
                        }
                        else{
                            var traker =0;
                            for(var j in usersObject){
                                usersName[usersObject[j]._id] = usersObject[j].firstName+ ' ' + usersObject[j].lastName;
                                traker++;
                                if(traker == usersObject.length){
                                    getEkgUserWiseForScoreReport(res, condition, function(ekgScore){
                                        groupEkgUserWise(ekgScore, function(ekgTopicWise){
                                            switch(interval){
                                                case 2:
                                                    setResponseOfMonthForTopic(res, startDate, resultReport, usersName, ekgTopicWise);
                                                    break;
                                                case 3:
                                                    setResponseOfQuarterForTopic(res, startDate.getMonth(), resultReport, usersName, ekgTopicWise);
                                                    break;
                                                case 4:
                                                    setResponseOfYearForTopic(res, resultReport, usersName, ekgTopicWise);
                                                    break;
                                            } 
                                        });
                                    });                                   
                                }
                            }
                        }
                    });
                }
            }            
        }
    });
};


getEkgUserWiseForScoreReport = function(res, condition, callback){
    AnswerModel.groupingTwoLevel( condition, 
        {
             dateAttempted:1,
             ekgId:1,
             userId:1,
             correctAnswer:1,
             tags:1,
             ekgTitle: 1,
             submitAnswerValue: 1,
             ekgType: 1,
             answerSubmitted: 1
        }, {
            "_id":{
            "ekgId":"$ekgId",
            "userId":"$userId",
            "dateAttempted": "$dateAttempted",
            "tags":"$tags",
            "correctAnswer":"$correctAnswer",
            "ekgTitle":"$ekgTitle",
            "submitAnswerValue": "$submitAnswerValue",
            "ekgType":"$ekgType"
            },
        score: { $sum : "$answerSubmitted"},
        count: { $sum :1},
        }, {
            _id: { userId: "$_id.userId" },
            userId: {$first: "$_id.userId"}, 
            avg: { $sum: "$score" },
            totalCount: { $sum: "$count"},
            ekgs: {
               $addToSet: {
                    ekgId: "$_id.ekgId", 
                    tags:"$_id.tags",
                    correctAnswer:"$_id.correctAnswer",
                    ekgTitle:"$_id.ekgTitle",
                    answerSubmitted:"$score",                           
                    dateAttempted: "$_id.dateAttempted",
                    submitAnswerValue:"$_id.submitAnswerValue",
                    ekgType:"$_id.ekgType",
                    count: "$count"
               }
           }
        }, function(err, ekgScore){
            if(err){
                responseMessage.serverErrorFunction(res, err, "scoreReportMethod-getScore");
            }
            else{
                callback(ekgScore);
            }
    });
};

/**
*Method used to get extra information for admin
*/
groupEkgUserWise = function(ekgTopicWise, callback){
    var userWiseEkg = [];
    for(var index=0; index < ekgTopicWise.length; index++){
        var Ekgs= [];
        for(var innerIndex=0; innerIndex < ekgTopicWise[index].ekgs.length; innerIndex++){
            var dateObject = new Date(ekgTopicWise[index].ekgs[innerIndex].dateAttempted);
            Ekgs.push({
                ekgTitle: ekgTopicWise[index].ekgs[innerIndex].ekgTitle,
                tags: ekgTopicWise[index].ekgs[innerIndex].tags,
                correctAnswer: ekgTopicWise[index].ekgs[innerIndex].correctAnswer,
                dateOfAttempted: dateObject.getDate()+'/'+(dateObject.getMonth()+ 1)+'/'+dateObject.getFullYear(),
                timeOfAttempted: dateObject.getHours()+':'+dateObject.getMinutes()+':'+dateObject.getSeconds(),
                submitAnswerValue: ekgTopicWise[index].ekgs[innerIndex].submitAnswerValue,
                ekgType: ekgTopicWise[index].ekgs[innerIndex].ekgType
            });
        }  
        userWiseEkg[ekgTopicWise[index].userId] = Ekgs;
    }
    callback(userWiseEkg);
};

/**
* Method used for set response object of a quarter for topic
*/ 
setResponseOfQuarterForTopic = function( res, startMonth, resultReport, userNames, ekgsObject){
    var count=0,scoreBoard = [], quarterObject;
    if(startMonth < 3){
        quarterObject =[
        {key: "January", index: 1, value: 0},
        {key: "February", index: 2, value: 0},
        {key: "March", index: 3, value: 0}
       ];
    }
    else if(startMonth < 6){
        quarterObject =[
        {key: "April", index: 1, value: 0},
        {key: "May", index: 2, value: 0},
        {key: "June", index: 3, value: 0}
        ];        
    }
    else if( startMonth < 9){       
        quarterObject =[
        {key: "Jul", index: 1, value: 0},
        {key: "August", index: 2, value: 0},
        {key: "September", index: 3, value: 0}
        ];
    }
    else{
        quarterObject =[
        {key: "October", index: 1, value: 0},
        {key: "November", index: 2, value: 0},
        {key: "December", index: 3, value: 0}
        ];
    }
    for(var index in resultReport){
        scoreBoard.push({ 
            userName: userNames[resultReport[index]._id.userId],
            correctEkgCount: resultReport[index].avg,
            averageScore: parseFloat(((resultReport[index].avg/resultReport[index].totalCount)*100).toFixed(2)),
            ekgs: ekgsObject[resultReport[index]._id.userId],
            scores: JSON.parse(JSON.stringify(quarterObject))
        });
        for(innerIndex in resultReport[index].scores){
            var putIndex = (resultReport[index].scores[innerIndex].key - 1) % 3; 
            scoreBoard[index].scores[putIndex].value = parseFloat(resultReport[index].scores[innerIndex].value.toFixed(2));
        }
        count ++;    
    }
    if(count == resultReport.length) {  
        responseMessage.successsFunction(res, messages.scoreReportSuccess,scoreBoard);
    } 
};

/**
* Method used for set response object of a week for topic
*/ 
setResponseOfWeekForTopic = function(res, startDate, resultReport, userNames, ekgsObject){
    var count=0,scoreBoard = [];
    var completeDate =  new Date(startDate.getFullYear(),startDate.getMonth()+1,0),
        endLimitOfStartDate = completeDate.getDate();
    var startingDate = startDate.getDate();
    for(var index in resultReport){
        scoreBoard[index] = { 
            userName: userNames[resultReport[index]._id.userId],
            correctEkgCount: resultReport[index].avg,
            averageScore: parseFloat(((resultReport[index].avg/resultReport[index].totalCount)*100).toFixed(2)),
            ekgs: ekgsObject[resultReport[index]._id.userId],
            scores: [
                {key: ((startingDate-endLimitOfStartDate) > 0 ? (startingDate - endLimitOfStartDate) : startingDate)  , index: 1, value: 0},
                {key: ((startingDate+1- endLimitOfStartDate) > 0 ? (startingDate + 1 - endLimitOfStartDate) : startingDate+1) , index: 2, value: 0},
                {key: ((startingDate+2- endLimitOfStartDate) > 0 ? (startingDate+2- endLimitOfStartDate): startingDate+2), index: 3, value: 0},
                {key: ((startingDate+3-endLimitOfStartDate) > 0 ? (startingDate+3-endLimitOfStartDate) : startingDate+3), index: 4, value: 0},
                {key: ((startingDate+4-endLimitOfStartDate) > 0 ? (startingDate+4-endLimitOfStartDate) : startingDate+4), index: 5, value: 0},
                {key: ((startingDate+5-endLimitOfStartDate) > 0 ? (startingDate+5-endLimitOfStartDate) : startingDate+5), index: 6, value: 0},
                {key: ((startingDate+6-endLimitOfStartDate) > 0 ? (startingDate+6-endLimitOfStartDate) : startingDate+6), index: 7, value: 0},
            ]
        };        
        for(innerIndex in resultReport[index].scores){
            var putIndex = resultReport[index].scores[innerIndex].key - startingDate;
            scoreBoard[index].scores[putIndex].value = parseFloat(resultReport[index].scores[innerIndex].value.toFixed(2));                       
        }
        count ++;       
    }
    if(count == resultReport.length) { 
        responseMessage.successsFunction(res, messages.scoreReportSuccess,scoreBoard);
    } 
};

/**
* Method used for set response object of a month for topic
*/ 
setResponseOfMonthForTopic = function(res, startDate, resultReport, userNames, ekgsObject){ 
    var weeknumber = new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate()).getWeek()-1;
    var count=0,scoreBoard = [];       
    for(var index in resultReport){
        scoreBoard[index] = { 
            userName: userNames[resultReport[index]._id.userId],
            correctEkgCount: resultReport[index].avg,
            averageScore: parseFloat(((resultReport[index].avg/resultReport[index].totalCount)*100).toFixed(2)),
            ekgs: ekgsObject[resultReport[index]._id.userId],
            scores: [
                {key: "Week 1", index: 1, value: 0},
                {key: "Week 2", index: 2, value: 0},
                {key: "Week 3", index: 3, value: 0},
                {key: "Week 4", index: 4, value: 0},
                {key: "Week 5", index: 5, value: 0},
                {key: "Week 6", index: 6, value: 0},
            ]
        };
        for(innerIndex in resultReport[index].scores){
            var putIndex = resultReport[index].scores[innerIndex].key - weeknumber +1;
            scoreBoard[index].scores[putIndex].value = parseFloat(resultReport[index].scores[innerIndex].value.toFixed(2));                        
        }
        count ++;          
    }
    if(count == resultReport.length) { 
        responseMessage.successsFunction(res, messages.scoreReportSuccess,scoreBoard);
    } 
};

/**
* Method used for set response object of a year for topic
*/ 
setResponseOfYearForTopic = function(res, resultReport, userNames, ekgsObject){
    var count=0,index=0,scoreBoard = [];     
    for(var index in resultReport){           
        var yearObject = {
            userName: userNames[resultReport[index]._id.userId],
            correctEkgCount: resultReport[index].avg,
            averageScore: parseFloat(((resultReport[index].avg/resultReport[index].totalCount)*100).toFixed(2)),
            ekgs: ekgsObject[resultReport[index]._id.userId],
            scores: [
                {key: "Jan-Mar", index: 1, value: 0},
                {key: "Apr-Jun", index: 2, value: 0},
                {key: "Jul-Sept", index: 3, value: 0},
                {key: "Oct-Dec", index: 4, value: 0}
            ]
        };         
        scoreBoard.push(yearObject);
        count++;
        for(innerIndex in resultReport[index].scores){
            var putIndex = resultReport[index].scores[innerIndex].key;
            scoreBoard[index].scores[putIndex-1].value = parseFloat(resultReport[index].scores[innerIndex].value.toFixed(2));                        
        } 
        if(count == resultReport.length) { 
            responseMessage.successsFunction(res, messages.scoreReportSuccess,scoreBoard);
        }                                       
    }    
};

/**
 * Method used for get score report user wise
 * @type : get 
 * @returns : report with score and correct answer
 */
exports.scoreReportUserBasis = function (req, res) {
    try{
        var startDate = new Date(parseInt(req.params.startDate)),
            endDate = new Date(parseInt(req.params.endDate)),
            user = {_id: req.params.userId },
            condition = { 
                userId: ObjectId(user._id), 
                dateAttempted: { 
                    $gte: startDate,
                    $lte: endDate
                }
            };      
        scoreReportMethodCall(startDate, endDate, condition, {_id: ObjectId(req.params.userId) }, req.params.intervalType, res, 0);
    } catch (err) {
       responseMessage.serverErrorFunction(res, err, "scoreReportUserBasis");
    }    
};

 /**
 * Method used for get score report for mobile
 * @type : get 
 * @returns : report with score and correct answer
 */
exports.scoreReportMethod = function (req, res) {
    try{
        var sessionId = req.headers.authorization.split(" ")[1],
            startDate = new Date(parseInt(req.params.startDate)),
            endDate = new Date(parseInt(req.params.endDate));
        Users.getUser({sessionId: sessionId},{_id:1}, function(err, user){
            if(err){
                responseMessage.serverErrorFunctstartDateion(res, err, "scoreReportMethod");
            }                    
            else{
                scoreReportMethodCall(startDate, endDate, { 
                    userId: ObjectId(user._id), 
                        dateAttempted: { 
                            $gte: startDate,
                            $lte: endDate
                        }
                    }, user, req.params.intervalType, res, 1);
            }
        });
    } catch (err) {
       responseMessage.serverErrorFunction(res, err, "scoreReportMethod");
    }    
};

 /**
 * Method used for set query parameter for get score report of a user
 */ 
 scoreReportMethodCall = function (startDate, endDate, condition, user, intervalType, res, mobileUserCall) {
    try{       
        var projection = {
            dateAttempted:1,
            topicId:1,
            title:1,
            answerSubmitted: 1,
        },
        groupingLevelFisrt,
        groupingLevelSecond = {
            _id: { topic: "$_id.topicId", topicName : "$_id.topicName" },
            avg: { $sum: "$_id.score" },
            totalCount: { $sum: "$_id.count"},
            scores: {
                $addToSet: {
                    key: "$_id.key", 
                    value:"$_id.value"
                }
            }
        };
        switch(intervalType){
            case '1':
                groupingLevelFisrt = {
                    _id: {  topicId: "$topicId", topicName : "$title", key: { $dayOfMonth:  "$dateAttempted" }, month: { $month: "$dateAttempted"}, year: { $year: "$dateAttempted"}},
                    score: { $sum : "$answerSubmitted"},
                    count: { $sum :1},
                }; 
                groupingLevelIntermediate = {
                    _id: { 
                        topicId: "$_id.topicId", 
                        topicName : "$_id.topicName", 
                        key:"$_id.key" , 
                        month: "$_id.month",
                        score:"$score",
                        count: "$count",
                        value: { $multiply: [{$divide: ["$score","$count"]}, 100]}
                    }
                };
                getDailyScore_report( res, condition, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate, mobileUserCall);
                break;
            case '2': 
                groupingLevelFisrt = {
                    "_id":{
                        "topicId":"$topicId",
                        "topicName" : "$title",
                        "key": {$week : "$dateAttempted"}
                    },
                    score: { $sum : "$answerSubmitted"},
                    count: { $sum :1},
                };
                groupingLevelIntermediate = {
                    _id: { 
                        topicId: "$_id.topicId", 
                        topicName : "$_id.topicName", 
                        key:"$_id.key",
                        score:"$score",
                        count: "$count",
                        value: { $multiply: [{$divide: ["$score","$count"]}, 100]}
                    }
                };
                getScore_report( res, 2, condition, projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate, mobileUserCall);
                break;
            case '3':   
                groupingLevelFisrt = {
                    "_id":{
                        "topicId":"$topicId",
                        "topicName" : "$title",
                        "key": {$month: "$dateAttempted"}
                    },
                    score: { $sum : "$answerSubmitted"},
                    count: { $sum :1},
                };
                groupingLevelIntermediate = {
                    _id: { 
                        topicId: "$_id.topicId", 
                        topicName : "$_id.topicName", 
                        key:"$_id.key",
                        score:"$score",
                        count: "$count",
                        value: { $multiply: [{$divide: ["$score","$count"]}, 100]}
                    }
                };
                getScore_report( res, 3, condition, projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate, mobileUserCall);
                break;
            case '4':
           
                projection = {
                    dateAttempted:1,
                    topicId:1,
                    title:1,
                    answerSubmitted: 1,
                    quarter:{$cond:[{$lte:[{$month:"$dateAttempted"},3]},
                    "1",
                        {$cond:[{$lte:[{$month:"$dateAttempted"},6]},
                        "2",
                            {$cond:[{$lte:[{$month:"$dateAttempted"},9]},
                                "3",
                                "4"
                            ]}
                        ]}
                    ]}
                };
                groupingLevelFisrt = {
                    "_id":{
                        "topicId":"$topicId",
                        "topicName" : "$title",
                        "key":"$quarter",                         
                    },                                    
                    score: { $sum : "$answerSubmitted"},
                    count: { $sum :1},
                };
                groupingLevelIntermediate = {
                    _id: { 
                        topicId: "$_id.topicId", 
                        topicName : "$_id.topicName", 
                        key:"$_id.key",
                        score:"$score",
                        count: "$count",
                        value: { $multiply: [{$divide: ["$score","$count"]}, 100]}
                    }
                };                                 
                getScore_report( res, 4, condition, projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate, mobileUserCall);
                break;
        }
    } catch (err) {
       responseMessage.serverErrorFunction(res, err, "scoreReportMethod");
    } 
};

/**
* Method used for calculate week of a date
*/ 
Date.prototype.getWeek = function() {
        var onejan = new Date(this.getFullYear(), 0, 1);
        return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
};

/**
* Method used for retrieve scores of a week
*/ 
getDailyScore_report = function( res, condition, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate, mobileUserCall){
    AnswerModel.getScoreWeeklyBasis( condition, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, function(err, resultReport){
        if (err) {
            responseMessage.serverErrorFunction(res, err, "scoreReportMethod-getScore");
        } 
        else if(resultReport.length == 0 || !resultReport){
            responseMessage.notFoundFunction(res, messages.scoreReportError, "scoreReportMethod-getScore");
        }
        else{
            if(mobileUserCall == 0){                
                getEkgTopicWiseForScoreReport(res, condition, function(ekgScore){
                    groupEkgTopicWise(ekgScore, function(ekgTopicWise){
                        setResponseForWeek(res, startDate, resultReport, ekgTopicWise, mobileUserCall);
                    });
                });
            }
            else{
                setResponseForWeek(res, startDate, resultReport, {}, mobileUserCall);
            } 
             
        }
    });
};

/**
* Method used for calculate scores 
*/ 
getScore_report = function(res, interval, condition, projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, startDate, mobileUserCall){
    AnswerModel.getScoreReport( condition,projection, groupingLevelFisrt, groupingLevelIntermediate, groupingLevelSecond, function(err, resultReport){
        if (err) {
            responseMessage.serverErrorFunction(res, err, "scoreReportMethod-getScore");
        } 
        else if(resultReport.length == 0 || !resultReport){
            responseMessage.notFoundFunction(res, messages.scoreReportError, "scoreReportMethod-getScore");
        }
        else{            
            if(mobileUserCall == 0){                             
                getEkgTopicWiseForScoreReport(res, condition, function(ekgScore){
                    groupEkgTopicWise(ekgScore, function(ekgTopicWise){
                        setResponse(interval, res, startDate, resultReport, ekgTopicWise, mobileUserCall);
                    });
                });
            }
            else{
               
                setResponse(interval, res, startDate, resultReport, {}, mobileUserCall);
            }
        }     
    });
};

setResponse = function(interval, res, startDate, resultReport, ekgTopicWise, mobileUserCall){
    switch(interval){
        case 2:
            setResponseForMonth(res, startDate, resultReport, ekgTopicWise, mobileUserCall);
            break;
        case 3:
            setResponseForQuarter(res, startDate.getMonth(), resultReport, ekgTopicWise, mobileUserCall);
            break;
        case 4:
            setResponseForYear(res, resultReport, ekgTopicWise, mobileUserCall);
            break;
    }  
};

getEkgTopicWiseForScoreReport = function(res, condition, callback){
    AnswerModel.groupingTwoLevel( condition, 
        {
             dateAttempted:1,
             ekgId:1,
             topicId:1,
             correctAnswer:1,
             tags:1,
             ekgTitle: 1,
             submitAnswerValue: 1,
             ekgType: 1,
             answerSubmitted: 1
        }, {
            "_id":{
            "ekgId":"$ekgId",
            "topicId":"$topicId",
            "dateAttempted": "$dateAttempted",
            "tags":"$tags",
            "correctAnswer":"$correctAnswer",
            "submitAnswerValue":"$submitAnswerValue",
            "ekgType":"$ekgType",
            "ekgTitle":"$ekgTitle"
            },
        score: { $sum : "$answerSubmitted"},
        count: { $sum :1},
        }, {
            _id: { topicId: "$_id.topicId" },
            topicId: {$first: "$_id.topicId"}, 
            avg: { $sum: "$score" },
            totalCount: { $sum: "$count"},
            ekgs: {
               $addToSet: {
                    ekgId: "$_id.ekgId", 
                    tags:"$_id.tags",
                    correctAnswer:"$_id.correctAnswer",
                    ekgTitle:"$_id.ekgTitle",
                    answerSubmitted:"$score",                           
                    dateAttempted: "$_id.dateAttempted",
                    submitAnswerValue: "$_id.submitAnswerValue",
                    ekgType: "$_id.ekgType",
                    count: "$count"
               }
           }
        }, function(err, ekgScore){
            if(err){
                responseMessage.serverErrorFunction(res, err, "scoreReportMethod-getScore");
            }
            else{
                callback(ekgScore);
            }
    });
};

/**
*Method used to get extra information for admin
*/
groupEkgTopicWise = function(ekgTopicWise, callback){
    var topicWiseEkg = [];
    for(var index=0; index < ekgTopicWise.length; index++){
        var Ekgs= [];
        for(var innerIndex=0; innerIndex < ekgTopicWise[index].ekgs.length; innerIndex++){
            var dateObject = new Date(ekgTopicWise[index].ekgs[innerIndex].dateAttempted);
            Ekgs.push({
                ekgTitle: ekgTopicWise[index].ekgs[innerIndex].ekgTitle,
                tags: ekgTopicWise[index].ekgs[innerIndex].tags,
                correctAnswer: ekgTopicWise[index].ekgs[innerIndex].correctAnswer,
                dateOfAttempted: dateObject.getDate()+'/'+(dateObject.getMonth()+ 1)+'/'+dateObject.getFullYear(),
                timeOfAttempted: dateObject.getHours()+':'+dateObject.getMinutes()+':'+dateObject.getSeconds(),
                submitAnswerValue: ekgTopicWise[index].ekgs[innerIndex].submitAnswerValue,
                ekgType: ekgTopicWise[index].ekgs[innerIndex].ekgType
            });
        }  
        topicWiseEkg[ekgTopicWise[index].topicId] = Ekgs;
    }
    callback(topicWiseEkg);
};

/**
* Method used for set response object of a quarter 
*/ 
setResponseForQuarter = function( res, startMonth, resultReport, ekgsObject, isMobileCall){
    var count=0,scoreBoard = [], quarterObject;
    if(startMonth < 3){
        quarterObject =[
        {key: "January", index: 1, value: 0},
        {key: "February", index: 2, value: 0},
        {key: "March", index: 3, value: 0}
       ];
    }
    else if(startMonth < 6){
        quarterObject =[
        {key: "April", index: 1, value: 0},
        {key: "May", index: 2, value: 0},
        {key: "June", index: 3, value: 0}
        ];        
    }
    else if( startMonth < 9){       
        quarterObject =[
        {key: "Jul", index: 1, value: 0},
        {key: "August", index: 2, value: 0},
        {key: "September", index: 3, value: 0}
        ];
    }
    else{
        quarterObject =[
        {key: "October", index: 1, value: 0},
        {key: "November", index: 2, value: 0},
        {key: "December", index: 3, value: 0}
        ];
    }
    for(var index in resultReport) { 
        scoreBoard.push({ 
            title: resultReport[index]._id.topicName, 
            correctEkgCount: resultReport[index].avg,
            averageScore: parseFloat(((resultReport[index].avg/resultReport[index].totalCount)*100).toFixed(2)),
            scores: JSON.parse(JSON.stringify(quarterObject))
        });
        if(!isMobileCall){
            scoreBoard[index].ekgs = ekgsObject[resultReport[index]._id.topic];
        };
        for(innerIndex in resultReport[index].scores){
            var putIndex = (resultReport[index].scores[innerIndex].key - 1) % 3; 
            scoreBoard[index].scores[putIndex].value = parseFloat(resultReport[index].scores[innerIndex].value.toFixed(2));
        }
        count ++;                  
    }
    if(count == resultReport.length) { 
        responseMessage.successsFunction(res, messages.scoreReportSuccess,scoreBoard);
    } 
};

/**
* Method used for set response object of a week 
*/ 
setResponseForWeek = function(res, startDate, resultReport, ekgsObject, isMobileCall){
    var count=0,scoreBoard = [],
        completeDate =  new Date(startDate.getFullYear(),startDate.getMonth()+1,0),
        endLimitOfStartDate = completeDate.getDate(),
        startingDate = startDate.getDate();
    for(var index in resultReport){                
        scoreBoard[index] = { 
            title: resultReport[index]._id.topicName,             
            correctEkgCount: resultReport[index].avg, 
            averageScore: parseFloat(((resultReport[index].avg/resultReport[index].totalCount)*100).toFixed(2)),
            scores: [
                {key: ((startingDate-endLimitOfStartDate) > 0 ? (startingDate - endLimitOfStartDate) : startingDate)  , index: 1, value: 0},
                {key: ((startingDate+1- endLimitOfStartDate) > 0 ? (startingDate + 1 - endLimitOfStartDate) : startingDate+1) , index: 2, value: 0},
                {key: ((startingDate+2- endLimitOfStartDate) > 0 ? (startingDate+2- endLimitOfStartDate): startingDate+2), index: 3, value: 0},
                {key: ((startingDate+3-endLimitOfStartDate) > 0 ? (startingDate+3-endLimitOfStartDate) : startingDate+3), index: 4, value: 0},
                {key: ((startingDate+4-endLimitOfStartDate) > 0 ? (startingDate+4-endLimitOfStartDate) : startingDate+4), index: 5, value: 0},
                {key: ((startingDate+5-endLimitOfStartDate) > 0 ? (startingDate+5-endLimitOfStartDate) : startingDate+5), index: 6, value: 0},
                {key: ((startingDate+6-endLimitOfStartDate) > 0 ? (startingDate+6-endLimitOfStartDate) : startingDate+6), index: 7, value: 0},
            ]
        };
        if(!isMobileCall){
            scoreBoard[index].ekgs = ekgsObject[resultReport[index]._id.topic];
        };
        for(innerIndex in resultReport[index].scores){
            var putIndex = resultReport[index].scores[innerIndex].key - startingDate;
            scoreBoard[index].scores[putIndex].value = parseFloat(resultReport[index].scores[innerIndex].value.toFixed(2));                       
        }
        count ++;                       
    }
    if(count == resultReport.length) { 
        responseMessage.successsFunction(res, messages.scoreReportSuccess,scoreBoard);
    } 
};

/**
* Method used for set response object of a month 
*/ 
setResponseForMonth = function(res, startDate, resultReport, ekgsObject, isMobileCall){ 
    var weeknumber = new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate()).getWeek()-1;
    var count=0,scoreBoard = []; 
    for(var index in resultReport){                
        scoreBoard[index] = { 
            title: resultReport[index]._id.topicName, 
            correctEkgCount: resultReport[index].avg, 
            averageScore: parseFloat(((resultReport[index].avg/resultReport[index].totalCount)*100).toFixed(2)),
            scores: [
                {key: "Week 1", index: 1, value: 0},
                {key: "Week 2", index: 2, value: 0},
                {key: "Week 3", index: 3, value: 0},
                {key: "Week 4", index: 4, value: 0},
                {key: "Week 5", index: 5, value: 0},
                {key: "Week 6", index: 6, value: 0},
            ]
        };
        if(!isMobileCall){
            scoreBoard[index].ekgs = ekgsObject[resultReport[index]._id.topic];
        }
        for(innerIndex in resultReport[index].scores){
            var putIndex = resultReport[index].scores[innerIndex].key - weeknumber +1;
            scoreBoard[index].scores[putIndex].value = parseFloat(resultReport[index].scores[innerIndex].value.toFixed(2));                        
        }
        count ++;                       
    }
    if(count == resultReport.length) { 
        responseMessage.successsFunction(res, messages.scoreReportSuccess,scoreBoard);
    } 
};

/**
* Method used for set response object of a year 
*/ 
setResponseForYear = function(res, resultReport, ekgsObject, isMobileCall){
    var count=0,scoreBoard = []; 
    for(var index in resultReport){                
        scoreBoard[index] = { 
            title: resultReport[index]._id.topicName,
            correctEkgCount: resultReport[index].avg,
            averageScore: parseFloat(((resultReport[index].avg/resultReport[index].totalCount)*100).toFixed(2)),
            scores: [
                {key: "Jan-Mar", index: 1, value: 0},
                {key: "Apr-Jun", index: 2, value: 0},
                {key: "Jul-Sept", index: 3, value: 0},
                {key: "Oct-Dec", index: 4, value: 0}
            ]
        };
        if(!isMobileCall){
            scoreBoard[index].ekgs = ekgsObject[resultReport[index]._id.topic];
        }
        for(innerIndex in resultReport[index].scores){
            var putIndex = resultReport[index].scores[innerIndex].key;
            scoreBoard[index].scores[putIndex-1].value = parseFloat(resultReport[index].scores[innerIndex].value.toFixed(2));                    
        }
        count ++;                       
    }
    if(count == resultReport.length) { 
        responseMessage.successsFunction(res, messages.scoreReportSuccess,scoreBoard);
    } 
};