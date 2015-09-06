//Importing node modules
var mongoose = require('mongoose');
var Content = require('../models/contentsmodel');
var Setting = require('../models/settingsmodel');
var Interpretation = require('../models/ekginterpretationsmodel');
var responseMessage = require('./responseMessage.js');
var ObjectId = require('mongoose').Types.ObjectId;
var Users = require('../models/usersmodel.js');
var fs = require('fs');

 /**
 * Method used for get master data of system
 * @type : get 
 * @returns : ekg details with all interpretation 
 */
exports.getMasterData = function (req, res){
	try{
	var masterDataObject = {};
		Content.getContents({},{_id:0},function(err, contents){
			if(err){
				responseMessage.serverErrorFunction(res, err, "getMasterData");
			}
			else{
				masterDataObject.contents = contents;
				Interpretation.getInterpretations({},{_id:0},function(err, interpretations){
					if(err){
						responseMessage.serverErrorFunction(res, err, "getMasterData");
					}
					else{
						masterDataObject.interpretationList = interpretations;
						responseMessage.successsFunction(res, messages.masterDataSuccess, masterDataObject); 
					}
				});
			}
		});	
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "getMasterData");
	}
};

 /**
 * Method used for get content data of system
 * @type : get 
 * @returns : ekg details with all interpretation 
 */
exports.getContents = function (req, res){
	try{	
		Content.getContents({},{},function(err, contents){
			if(err){
				responseMessage.serverErrorFunction(res, err, "getContents");
			}
			else if(contents){
				responseMessage.successsFunction(res, messages.contentSuccess, contents); 
			}
			else{
				responseMessage.notFoundFunction(res, messages.contentNotFound, "getContents");
			}
		});	
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "getContents");
	}
}; 

/**
 * Method used for update tutorial
 * @type : post 
 * @returns : custom message
 */
exports.updateTutorialMethod = function (req, res){
	try{
		Content.updateContent(req.body.condition, req.body.data,function(err, updated){
			if(err){
				responseMessage.serverErrorFunction(res, err, "updateTutorialMethod");
			}
			else if(updated){
				responseMessage.successsFunction(res, messages.updateTutorialSuccess, {}); 
			}
			else{
				responseMessage.badRequestFunction(res, messages.updateTutorialError, "updateTutorialMethod");				
			}
		});	
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "updateTutorialMethod");
	}
};

/**
 * Method used for update references
 * @type : post 
 * @returns : custom message
 */
exports.updateAboutUsMethod = function (req, res){
	try{	
		Content.updateContent(req.body.condition, req.body.data, function(err, updated){			
			if(err){
				responseMessage.serverErrorFunction(res, err, "updateAboutUsMethod");
			}
			else if(updated){
				responseMessage.successsFunction(res, messages.updateAboutUsSuccess, {}); 
			}
			else{
				responseMessage.badRequestFunction(res, messages.updateAboutUsError, "updateAboutUsMethod");				
			}
		});	
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "updateAboutUsMethod");
	}
};

/**
 * Method used for update references
 * @type : post 
 * @returns : custom message
 */
exports.updateReferenceMethod = function (req, res){
	try{	
		Content.updateContent(req.body.condition, req.body.data, function(err, references){
			if(err){
				responseMessage.serverErrorFunction(res, err, "updateReferenceMethod");
			}
			else if(references){
				responseMessage.successsFunction(res, messages.updateReferenceSuccess, {});
			}
			else{
				responseMessage.badRequestFunction(res, messages.updateReferenceError, "updateReferenceMethod");			
			}
		});	
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "updateReferenceMethod");
	}
};

/**
 * Method used for add ekg algorithm
 * @type : post 
 * @returns : custom message
 */
exports.addEkgAlgorithmMethod = function(req, res){
	try{
		var ekgAlgo = {
			step : req.body.step,
			index : req.body.index, 
			url : ''		
		},
		sessionId = req.headers.authorization.split(" ")[1];
		var name = req.body.index+req.body.fileName;
		Users.getUser({sessionId: sessionId},{_id:1}, function(err, user){
            if(err){
                responseMessage.serverErrorFunctstartDateion(res, err, "addEkgAlgorithmMethod");
            }                    
            else{            	
				if(req.body.fileName){
					fs.exists( config.TempFolder+user._id +'/'+ req.body.fileName , function(exists) {
                    	if(exists){
							ekgAlgo.url= config.algorithmImageUrl+req.body.index+req.body.fileName;		                                                        
				            copyImage( config.TempFolder+user._id +'/'+ req.body.fileName ,
				                config.algorithmImageRoute+req.body.index+req.body.fileName, 
				            function(success){				         
				            });
				        }
				        addEkgAlgo(res,  req.body._id, ekgAlgo);
				    });
		        }
		        else{
		        	 addEkgAlgo(res,  req.body._id, ekgAlgo);
		        }
			}
		});  
    }catch(err){
		responseMessage.serverErrorFunction(res, err, "addEkgAlgorithmMethod");
	}
};

/**
* update image name for algorithm
*/
addEkgAlgo = function(res, id, ekgAlgo){
	try{
		Content.updateContent({_id: id},
        	{$push: { ekgAlgorithm: ekgAlgo}},
        	function(err, updated){
			if(err){
				responseMessage.serverErrorFunction(res, err, "addEkgAlgorithmMethod");
			}
			else if(!updated){
				responseMessage.badRequestFunction(res, messages.addEkgAlgorithmError, "addEkgAlgorithmMethod");
			}
			else{
				responseMessage.successsFunction(res, messages.addEkgAlgorithmSuccess, ekgAlgo); 		
			}
		});
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "addEkgAlgorithmMethod");
	}
};

/**
 * Method used for delete ekg algorithm
 * @type : post 
 * @returns : custom message
 */
exports.deleteEkgAlgorithmMethod = function(req, res){
	try{
		Content.updateContent({_id: req.params.algoId},{$pull: { ekgAlgorithm: { index: req.params.index}}}, function(err, updated){
			if(err){
				responseMessage.serverErrorFunction(res, err, "deleteEkgAlgorithmMethod");
			}
			else if(!updated){
				responseMessage.badRequestFunction(res, messages.deleteEkgAlgorithmError, "deleteEkgAlgorithmMethod");
			}
			else{
				responseMessage.successsFunction(res, messages.deleteEkgAlgorithmSuccess, {}); 		
			}
		});
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "deleteEkgAlgorithmMethod");
	}
};

/**
 * Method used for delete ekg algorithm
 * @type : post 
 * @returns : custom message
 */
exports.updateEkgAlgorithmMethod = function(req, res){
	try{		
		var sessionId = req.headers.authorization.split(" ")[1];
		var name = req.body.index+req.body.fileName;
		Users.getUser({sessionId: sessionId},{_id:1}, function(err, user){
            if(err){
                responseMessage.serverErrorFunctstartDateion(res, err, "updateEkgAlgorithmMethod");
            }                    
            else{
				if(req.body.fileName){
					var url;
					fs.exists( config.TempFolder+user._id +'/'+ req.body.fileName , function(exists) {
                    	if(exists){
							url= config.algorithmImageUrl+req.body.index+req.body.fileName;                                   
				            copyImage( config.TempFolder+user._id +'/'+ req.body.fileName ,
				                config.algorithmImageRoute+req.body.index+req.body.fileName, 
				            function(success){
				            });
				            updateEkgAlgo(res,{_id:req.body._id, index:req.body.index, step:req.body.step, url:url});
				        }
				    });
		        }
		        updateEkgAlgo(res,{_id:req.body._id, index:req.body.index, step:req.body.step, url:req.body.url}); 	 
			}
		});  
    }catch(err){
		responseMessage.serverErrorFunction(res, err, "updateEkgAlgorithmMethod");
	}
};

/**
* update image name for algorithm
*/
updateEkgAlgo = function(res, algo){
	try{
		Content.updateContent({_id: algo._id, 'ekgAlgorithm.index': algo.index},
        	{ 'ekgAlgorithm.$.step': algo.step, 'ekgAlgorithm.$.url': algo.url},
        	function(err, updated){
			if(err){
				responseMessage.serverErrorFunction(res, err, "updateEkgAlgorithmMethod");
			}
			else if(!updated){
				responseMessage.badRequestFunction(res, messages.updateEkgAlgorithmError, "updateEkgAlgorithmMethod");
			}
			else{
				responseMessage.successsFunction(res, messages.updateEkgAlgorithmSuccess, updated); 		
			}
		});
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "updateEkgAlgorithmMethod");
	}
};

/**
 * Method used for update setting
 * @type : get 
 * @returns : custom message
 */
exports.updatesetting = function (req, res){
	try{
		Setting.updateSetting(req.body.condition,{ $set: req.body.data}, function(err, setting){
			if(err){
				responseMessage.serverErrorFunction(res, err, "updatesetting");
			}
			else if(setting){
				responseMessage.successsFunction(res, messages.updateSettingSuccess, setting); 
			}
			else{
				responseMessage.badRequestFunction(res, messages.updateSettingError, "updatesetting");
			}
		});	
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "updatesetting");
	}
};

/**
 * Method used for get setting
 * @type : get 
 * @returns : custom message
 */
exports.getSettingMethod = function(req, res){
	try{
		Setting.getSettings({}, {}, function(err, setting){
			if(err){
				responseMessage.serverErrorFunction(res, err, "getSettingMethod");
			}
			else if(!setting){
				responseMessage.notFoundFunction(res, messages.getSettindError, "getSettingMethod");
			}
			else{
				responseMessage.successsFunction(res, messages.getSettingSuccess, setting);
			}
		});	
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "getSettingMethod");
	}
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
 * Method used for update T&C
 * @type : post 
 * @returns : custom message
 */
exports.updateTandCMethod = function (req, res){
	try{	
		Content.updateContent(req.body.condition, req.body.data, function(err, references){
			if(err){
				responseMessage.serverErrorFunction(res, err, "updateTandCMethod");
			}
			else if(references){
				responseMessage.successsFunction(res, messages.updateTAndCSuccess, {});
			}
			else{
				responseMessage.badRequestFunction(res, messages.updateTAndCError, "updateTandCMethod");			
			}
		});	
	}catch(err){
		responseMessage.serverErrorFunction(res, err, "updateTandCMethod");
	}
};