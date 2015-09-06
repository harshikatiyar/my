var LOGS = require('../models/loggermodel.js');
 exports.serverErrorFunction = function(res, err, methodName){
    try{
        LOGS.createLog({methodName: methodName, response: err ,message: messages.serverError, date: new Date()});
        res.statusCode = responseCode.SERVERERROR;
        return res.json({
            message: messages.serverError,
            error: {
                reason: err,
                message: messages.serverError
            }
        }); 
    }catch (err){
        res.statusCode = responseCode.SERVERERROR;
        return res.json({
            message: messages.serverError,
            error: {
                reason: err,
                message: messages.serverError
            }
        }); 
    }
};

exports.badRequestFunction = function(res, message, methodName){
    LOGS.createLog({methodName: methodName, response: messages.badRequest ,message: message, date: new Date()});
    res.statusCode = responseCode.BADREQUEST;
    return res.json({
        message: message,
        error:{
            reason:messages.badRequest,
            message:message
        }
    });

};

exports.notFoundFunction = function(res, message, methodName){
    LOGS.createLog({methodName: methodName, response: messages.notFound ,message: message, date: new Date()});
    res.statusCode = responseCode.NOTFOUND;
    return res.json({
        message: message,
        error:{
            reason:messages.notFound,
            message:message
        }
    });
};

exports.successsFunction = function(res, message, data){
    
    return res.json({
        message: message,
        data: data           
    });
};

exports.conflictFunction = function(res, message, methodName){
    LOGS.createLog({methodName: methodName, response: messages.conflict ,message: message, date: new Date()});
    res.statusCode = responseCode.CONFLICT;
    return res.json({
        message: message,
        error:{
            reason:messages.conflict,
            message:message
        }
    }); 
};