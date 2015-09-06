//module for IOS push notification
var apn = require('apn');

//module for Android push notification
var gcm = require('node-gcm');

var optionsForAppleDevice = {
    gateway: config.appleGateway ,
    cert:  config.appleCert,
    key: config.appleKey,
    passphrase: config.applePassphrase
};
var apnsConnectionForAppleDevice = new apn.Connection(optionsForAppleDevice);


exports.sendPushNotification=function(user,message)
{
	
	if(user.deviceType == config.android)
	{
		pushToAndroid(user.deviceId,message);
	}
	else if(user.deviceType == config.apple)
	{
		pushToApple(user.deviceId,message);
	}
};

/**
 * Method  to send push notification on apple device
 * @params : tokens
 * @params : message
 * @params : callback
 * @returns : returns callback with notification object 
 */
pushToApple = function(tokens, message) {
    
    var device = new apn.Device(tokens);
	var notification = new apn.Notification();
	notification.sound = "ping.aiff";
	notification.payload = {"title": message.title, "topicId":message.topicId, "isTest":config.isTest};
	notification.alert = messages.alertMessageOnPushNotification;
	apnsConnectionForAppleDevice.pushNotification(notification, device);
	console.log(">>: Apple PushNotification success ");
	
	
	
};

/**
 * Method  to send push notification on android device
 * @params : tokens
 * @params : message
 * @params : callback
 * @returns : returns callback with notification object 
 */
pushToAndroid=function(tokens,message){
	var notificationMessage = new gcm.Message();
	 notificationMessage = new gcm.Message({
	 	delayWhileIdle: true,
	 	timeToLive: 50, 
		data: {
			"title":message.title,
			"topicId":message.topicId,
			"isTest":config.isTest,
			"notificationTitle":messages.alertMessageOnPushNotification
		}
	});
 	var sender = new gcm.Sender(config.androidApiKey);
 	var registrationIds = [];  	
	registrationIds.push(tokens);

	sender.send(notificationMessage, registrationIds,4,function (err, result) {
  		if(err) console.log(err);
  		else console.log(">>: Android PushNotification success ");
  	}); 
  	

};

