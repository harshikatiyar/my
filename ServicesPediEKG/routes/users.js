// Importing node modules
var nodemailer = require("nodemailer"),
	fs = require('fs'),
	crypto = require('crypto'),
	sgTransport = require('nodemailer-sendgrid-transport');

// Importing custom models
var settings = require('../models/settingsmodel.js'),
	Users = require('../models/usersmodel.js'),
	formidable=require("formidable"),
	responseMessage = require('./responseMessage.js'),	 
	md5 = require('js-md5');

/**
 * Method used for register new user in system
 * @type : post
 * @params : user object conatin email,firstname,lastname,password
 * @returns : user object conatin email,firstname,lastname,imageUrl
 */
exports.registrationMethod = function (req, res) {
	try{		
		var userModel = req.body;
		Users.getUser({email: req.body.email.toLowerCase()}, function(err, existedUser){
			if (err) {
				responseMessage.serverErrorFunction(res, err, "registrationMethod");
			}
			else if(existedUser){
				responseMessage.conflictFunction(res, messages.registerError, "registrationMethod");						        
			}
			else{
				userModel.sessionId = crypto.randomBytes(90).toString('base64');			
				userModel.lastAccessTime = Date.now();
				userModel.createdOn = Date.now();
				userModel.firstName = req.body.firstName;
				userModel.lastName = req.body.lastName;
				userModel.email = req.body.email.toLowerCase();
				userModel.password = req.body.password;
				userModel.userName = req.body.userName ? req.body.userName.toLowerCase() :req.body.email.toLowerCase();
				Users.createUser(userModel, function(err, createdUser){
					if (err) {
						responseMessage.serverErrorFunction(res, err, "registrationMethod");			
					}
					else {						
						res.header({"token":createdUser.sessionId});
						responseMessage.successsFunction(res, messages.registerSuccess, 
							{
								"email": createdUser.email,
								"firstName": createdUser.firstName,
								"lastName": createdUser.lastName,								
								"userImageURL":""
							}
						);						
					}
				});
			}
		});
	} catch (err) {
		responseMessage.serverErrorFunction(res, err, "registrationMethod");	
	}	
};

/**
 * Method used for login user in system
 * @type : post
 * @params : user object conatain email,password
 * @returns : user object contain email,firstname,lastname,imageUrl
 */
exports.loginMethod = function (req, res){ 
	try {
		Users.loginAuth({ email: req.body.email.toLowerCase(), password:req.body.password, isActive: true }, function(err, userData){
			if(err){
				responseMessage.serverErrorFunction(res, err, "loginMethod");
			}
			else if(!userData){
				responseMessage.notFoundFunction(res, messages.loginError, "loginMethod");				
			}
			else{
				res.header({token:userData.sessionId});
				responseMessage.successsFunction(res, messages.loginSuccess, 
					{
						"email":userData.email,
						"firstName":userData.firstName,
						"lastName":userData.lastName,
						"userImageURL":userData.imageURL || ''
					}
				);
			}
		});
	} catch (err) {
		responseMessage.serverErrorFunction(res, err, "loginMethod");
	}
};

/**
 * Method used for change password of user in system
 * @type : post
 * @params : user object conatin old password and new password
 * @returns : custom message
 */
exports.changePasswordMethod = function (req, res) {
	try {
		var sessionId = req.headers.authorization.split(" ")[1];
		Users.getUser({sessionId: sessionId},{}, function(err, user){
			if(err){
				responseMessage.serverErrorFunction(res, err, "changePasswordMethod");
			}
			else if(!user){
				responseMessage.notFoundFunction(res, messages.userError, "changePasswordMethod");				
			}
			else{
				Users.updateUser({_id: user._id, password: req.body.oldPassword}, {password: req.body.newPassword}, function(err, changedPassword){
					if (err) {
						responseMessage.serverErrorFunction(res, err, "changePasswordMethod");
					}
					else if(!changedPassword){
						responseMessage.notFoundFunction(res, messages.changePasswordError, "changePasswordMethod");				    
					}
					else{
						responseMessage.successsFunction(res, messages.changePasswordSuccess,{});
					}
				});
			}
		});
	} catch (err) {       
		responseMessage.serverErrorFunction(res, err, "changePasswordMethod");
    }   
};

/**
 * Method used for recover password of user in system
 * @type : post
 * @params : user object conatin email 
 * @returns : generate a new password send to email
 */
exports.forgotPasswordMethod = function (req, res) {
    try {		
		function randomString() {
            var length = config.randomPasswordLength;
            var chars = config.randomPasswordCharacters;
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
            plainPasswordRandom = result;
            return md5(result, true);
		}
		var _password = randomString();	
		Users.findAndUpdate({email: req.body.email}, {password: _password, isPasswordReset: true}, function(err, userData){
			if (err) {
				responseMessage.serverErrorFunction(res, err, "forgotPasswordMethod");
			}
			else if(!userData){
				responseMessage.notFoundFunction(res, messages.forgotPasswordError, "forgotPasswordMethod");				        
			}
			else{
				fs.readFile('./templates/forgotPassword.html', function (err, data) {
                    if (err) {
						responseMessage.serverErrorFunction(res, err, "forgotPasswordMethod");	
					}
                    else { 					
						settings.getSetting({}, function (err, mailSettingOptions) {                      
                            var options = {
	                        	 auth: {
                                    api_user: mailSettingOptions.emailSettings.userName,
                                    api_key:  mailSettingOptions.emailSettings.password
                                },
                            };
                            var client = nodemailer.createTransport(sgTransport(options));
                            var mailOptions = {
                                from: 'EKG <'+mailSettingOptions.emailSettings.toEmailAddress+'>', 
                                to: userData.email, 
                                subject: 'Pedi ECG: Password Reset Notification', 
                                html : '' 
                                 + data.toString().replace('[userName]',
                                      userData.firstName +' '+ userData.lastName).replace('[password]', plainPasswordRandom)//+ '</pre>'
                            };                                
                            client.sendMail(mailOptions, function (error, info) {
                                if (error) {									
                                    responseMessage.serverErrorFunction(res, error, "forgotPasswordMethod");	
                                } 
								else {
									responseMessage.successsFunction(res, messages.forgotPasswordSuccess,{});
								}
                            });
						});
					}							
                });
            }
        })       
	}
	catch(err){
		responseMessage.serverErrorFunction(res, err, "forgotPasswordMethod");
	}	
};

/**
 * Method used for register device 
 * @type : get
 * @params : param contain device id and device type
 * @returns : custom message
 */
exports.registerDeviceMethod = function (req, res) {
	try{
		var sessionId = req.headers.authorization.split(" ")[1];
  	 	Users.updateUser({sessionId:sessionId},{$set: {deviceId:req.params.deviceId,deviceType:req.params.deviceType}},function(err, updated){
  	 		if (err) {
				responseMessage.serverErrorFunction(res, err, "registerDeviceMethod");	
			}
			else if(updated){
				responseMessage.successsFunction(res, messages.registerDeviceSuccess,{});
			}
			else{
				responseMessage.badRequestFunction(res, messages.registerDeviceError, "registerDeviceMethod"); 
			}
  	 	});   		 
   	}catch (err) {
		responseMessage.serverErrorFunction(res, err, "registerDeviceMethod");
	}	
};

/**
 * Method used for unable/disable push notification on device 
 * @type : post
 * @params : contain pushNotificationStatus
 * @returns : custom message
 */
exports.updatePushNotification = function (req, res) {
	try{
		var temp;
			if(req.body.pushNotificationStatus == "1"){
				 temp = 1;
			}
		else{
			temp = 0;
		}
		var sessionId = req.headers.authorization.split(" ")[1];
		var pushDisabled = temp ? true : false;
		Users.updateUser({sessionId:sessionId},{isPushNotificationDisabled:pushDisabled},function(err, updated){
  	 		if (err) {
				responseMessage.serverErrorFunction(res, err, "updatePushNotification");
			}
			else if(updated){
				responseMessage.successsFunction(res, messages.pushNotificationSuccess,{});
			}
			else{
				responseMessage.badRequestFunction(res, messages.pushNotificationError, "updatePushNotification");				  
			}
  	 	});   		 
   	}catch (err) {
		responseMessage.serverErrorFunction(res, err, "updatePushNotification");
	}	
};

/**
 * Method used for upload user image in system 
 * @type : post
 * @params : contain iamge bit array
 * @returns : custom message
 */
exports.uploadImage = function(req, res){ 
	try{
		var sessionId = req.headers.authorization.split(" ")[1];
		Users.getUser({sessionId: sessionId},{}, function(err, user){
			if(err){
				responseMessage.serverErrorFunction(res, err, "uploadImage");	
			}
			else if(!user){
				responseMessage.notFoundFunction(res, messages.userError, "uploadImage");				
			}
			else{
				var form = new formidable.IncomingForm();
				form.parse(req, function(err, fields, files) { 
					if(files.image){
						var imageName = user._id;
						var imageAbslutePath = imageName+"."+files.image.type.split('/')[1];
						copyImage(files.image.path, config.userImageRoute+imageAbslutePath, function(value){});						
						Users.updateUser({_id : user._id},{ fileName:files.image.name,imageURL:config.userImageUrl+imageAbslutePath},function(err, uploaded){
							if(err){
								responseMessage.serverErrorFunction(res, err, "uploadImage");
							}
							else if(uploaded){
								responseMessage.successsFunction(res, messages.imageSuccess,
									{
										imageURL : config.userImageUrl+imageAbslutePath
									}
								);							
							}
							else{
								responseMessage.badRequestFunction(res, messages.imageError, "uploadImage");
							}
						})
					}
					else{
						responseMessage.badRequestFunction(res, messages.imageError, "uploadImage");						
					}
				});
			}			
		});
	}catch (err) {
		responseMessage.serverErrorFunction(res, err, "uploadImage");
	}	
};

/**
 * Method used for logout from system 
 * @type : get
 * @returns : custom message
 */ 
exports.logoutMethod = function (req, res){
 	try{
 		var sessionId = req.headers.authorization.split(" ")[1];
 		Users.updateUser({sessionId:sessionId},{sessionId:""},function(err, logouted){
 			if(err){
 				responseMessage.serverErrorFunction(res, err, "logoutMethod");
			}
			else {
				responseMessage.successsFunction(res, messages.logoutSuccess,{});
			}
    	});
	}catch (err) {
		responseMessage.serverErrorFunction(res, err, "logoutMethod");	
	}	
};

/**
 * Method used for admin login
 * @type : post
 * @returns : custom message
 */ 
exports.adminLoginMethod = function ( req, res){  console.log(req.body);
 	try{
 		Users.loginAuth({ email: req.body.email.toLowerCase(), password:req.body.password }, function(err, userData){
			if(err){
				responseMessage.serverErrorFunction(res, err, "adminLoginMethod");
			}
			else if(!userData){
				responseMessage.notFoundFunction(res, messages.loginError, "adminLoginMethod");				
			}
			else{
				res.header({token:userData.sessionId}); 
				responseMessage.successsFunction(res, messages.loginSuccess, 
					{
						"email":userData.email,
						"firstName":userData.firstName,
						"lastName":userData.lastName,
						"isSuperUser":userData.isSuperUser,
						"token":userData.sessionId
					}
				);
			}
		}); 		
 	}catch(err){
 		responseMessage.serverErrorFunction(res, err, "adminLoginMethod");
 	}
};

 /**
 * Method used for add uesr in the system by admin
 * @type : post
 * @returns : custom message
 */ 
 exports.addUserMethod = function ( req, res){
 	try{ 		
 		Users.getUser({email: req.body.email.toLowerCase()}, function(err, existedUser){
			if (err) {
				responseMessage.serverErrorFunction(res, err, "addUserMethod");
			}
			else if(existedUser){
				responseMessage.conflictFunction(res, messages.registerError, "addUserMethod");						        
			}
			else{
 				Users.createUser(req.body, function(err, createdUser){
					if (err) {
						responseMessage.serverErrorFunction(res, err, "addUserMethod");			
					}
					else {
						responseMessage.successsFunction(res, messages.registerSuccess, 
							{
								"email": createdUser.email,
								"firstName": createdUser.firstName,
								"lastName": createdUser.lastName
							}
						);						
					}
				});	
			}
		});		
 	}catch(err){
 		responseMessage.serverErrorFunction(res, err, "addUserMethod");
 	}
 };

 /**
 * Method used for update uesr information by admin
 * @type : post
 * @returns : custom message
 */ 
 exports.updateUserMethod = function ( req, res){
 	try{
 		var sessionId = req.headers.authorization.split(" ")[1];
		Users.getUser({sessionId: sessionId},{}, function(err, user){
			if(err){
				responseMessage.serverErrorFunction(res, err, "updateUserMethod");	
			}
			else if(!user){
				responseMessage.notFoundFunction(res, messages.userError, "updateUserMethod");				
			}
			else{
				var condition = req.body.condition;
				if(user.isSuperUser){
					condition.isSuperUser = false;
				}
				else{
					condition.isAdmin = false;
					condition.isSuperUser = false;
				}		
				Users.updateUser(condition , req.body.data, function(err, updated){
					if (err) {
						responseMessage.serverErrorFunction(res, err, "updateUserMethod");			
					}
					else if(!updated){
						responseMessage.badRequestFunction(res, messages.notRights, "updateUserMethod");
					}
					else{
						responseMessage.successsFunction(res, messages.updateUserSuccess, {});				
					}
				});	
			}
		});
 	}catch(err){
 		responseMessage.serverErrorFunction(res, err, "updateUserMethod");
 	}
 };

 /**
 * Method used for delete uesr information by admin
 * @type : get
 * @returns : custom message
 */ 
 exports.deleteUserMethod = function ( req, res){
 	try{ 	
 		var sessionId = req.headers.authorization.split(" ")[1];
		Users.getUser({sessionId: sessionId},{}, function(err, user){
			if(err){
				responseMessage.serverErrorFunction(res, err, "deleteUserMethod");	
			}
			else if(!user){
				responseMessage.notFoundFunction(res, messages.userError, "deleteUserMethod");				
			}
			else{
				var condition = { _id: req.params.userId };
				if(user.isSuperUser){
					condition.isSuperUser = false;
				}
				else{
					condition.isAdmin = false;
					condition.isSuperUser = false;
				}				
				Users.removeUser( condition, function(err, updated){
					if (err) {
						responseMessage.serverErrorFunction(res, err, "deleteUserMethod");			
					}
					else if(!updated){
						responseMessage.badRequestFunction(res, messages.notRights, "deleteUserMethod");
					}
					else{
						responseMessage.successsFunction(res, messages.deleteUserSuccess, {});				
					}
				});
			}
		});	
 	}catch(err){
 		responseMessage.serverErrorFunction(res, err, "deleteUserMethod");
 	}
 };

  /**
 * Method used for list alll user of the system
 * @type : get
 * @returns : custom message
 */ 
 exports.userListMethod = function ( req, res){
 	try{ 
 		var sessionId = req.headers.authorization.split(" ")[1];
		Users.getUser({sessionId: sessionId},{}, function(err, user){
			if(err){
				responseMessage.serverErrorFunction(res, err, "userListMethod");	
			}
			else if(!user){
				responseMessage.notFoundFunction(res, messages.userError, "userListMethod");				
			}
			else{
				var condition = {};
				if(user.isSuperUser){
					condition.isSuperUser = false;
				}
				else{
					condition.isAdmin = false;
					condition.isSuperUser = false;
				}					
				Users.userList( condition, {}, function(err, users){
					if (err) {
						responseMessage.serverErrorFunction(res, err, "userListMethod");			
					}
					else if(!users){
						responseMessage.notFoundFunction(res, messages.usersError, "userListMethod");
					}
					else{
						responseMessage.successsFunction(res, messages.usersSuccess, users);				
					}
				});
			}
		});	
 	}catch(err){
 		responseMessage.serverErrorFunction(res, err, "userListMethod");
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