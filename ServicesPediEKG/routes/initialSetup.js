var Users = require('../models/usersmodel.js'),
	responseMessage = require('./responseMessage.js'),
	fs = require('fs'),
	Content = require('../models/contentsmodel'),
	Setting = require('../models/settingsmodel'),
	mkdirp = require('mkdirp');

exports.initialSetUp = function(){
		Users.getUser({email: config.superUserEmail}, {}, function(err, user){
			if(err){
				console.log("Create User");
			}
			else if(user.length == 0){
				Users.createUser(
				{
					"email":config.superUserEmail,
					"password":config.superUserPassword,
					"isSuperUser": config.trueValue,
					"firstName":config.superUserFirstName,
					"lastName":config.superUserLastName,
					"userName":config.superUserEmail
				}, function(err, created){
					if(err){
						responseMessage.serverErrorFunction(res, err, "initialSetUp");
					}
					else{
						console.dir("Super User Created");
					}
				})
			}
		});

	createDirectory(config.userImageRoute);
	createDirectory(config.ekgImage);

	// Setting.getSettings({}, {}, function(err, settings){
		// if(err){
			// console.log("Error in setting");
		// }
		// else if(settings.length == 0){
			// Setting.saveSetting({"label" : "Email Setting.",
				// "emailSettings" : {
					// "userName" : config.settingUserName,
        			// "password" : config.settingPassword,
        			// "toEmailAddress" : config.settingtoEmailAddress,
        			// "server" : config.settingServer
    			// }
    		// });
		// }
	// });
	// Content.getContents({}, {}, function(err, contenets){
	// 	if(err){
	// 		console.log("Error in content");
	// 	}
	// 	else if(contenets.length == 0){
	// 		Content.saveContent({aboutUs:"Please update about us.", ekgAlgorithm: undefined},function(err, result){
	// 			console.log("aboutUs created.");
	// 		});
	// 		Content.saveContent({tutorial: "Please update tutorial.", ekgAlgorithm: undefined},function(err, result){
	// 			console.log("tutorial created.");
	// 		});
	// 		Content.saveContent({ekgAlgorithm: []},function(err, result){
	// 			console.log("ekgAlgorithm created.");
	// 		});
	// 		Content.saveContent({references:"Please update refernce.", ekgAlgorithm: undefined},function(err, result){
	// 			console.log("references created.");
	// 		});
	// 	}
	// });
};

//cerate directory
exports.createDirectoryStructure = function(folderPath){
	createDirectory(folderPath);
};

//create directory for users and ekgs to store image
var createDirectory = function(folderPath){
    fs.exists(String(folderPath) , function(exists) {
        if(!exists){
             mkdirp(String(folderPath) ,function(err){
             console.log("Directory created");             	
             });
        }
    });
};