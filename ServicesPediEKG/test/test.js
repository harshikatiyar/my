var request = require('supertest'),  
	mongoose = require('mongoose'),
	fs= require('fs'),
	nconf = require('nconf'),
	testData = require('../test/testDataStore.json'),
	config = require('../scripts/configLocal.json'),
	responseCode = require('../scripts/responsecodes.json');
var Users = require('../models/usersmodel.js');
var AnswerModel = require('../models/ekgsanswermodel.js');

describe('check database connection',function() {	   
	/** Database Connection */		
	nconf.argv().env().file({ file: './test/testDataStore.json' });
	it("",function(done){			
		mongoose.connect(config.dbUrl);
		mongoose.connection.on('connected', function(){
			if(mongoose.connection.readyState === 1){
				console.log("database connected");
				done();
			}
		});	
		mongoose.connection.on('error', function(){		
				console.log("error in database connection");
				process.exit(0);
		});
	});
});

/** 
 *  user register test cases
 */
describe('user', function() {	
	/** positive test case */
	// it('Register Success', function(done) {	
	// 	var rnum = Math.floor(Math.random() * 10000);
	// 	console.log(rnum);	
	// 	var profile = {			
	// 			"email":rnum+"@gmail.com",
	// 			"firstName":testData.firstName,
	// 			"lastName":testData.lastName,				
	// 			"password":rnum,
	// 			"userName":testData.userName
	// 		};
	// 	request(config.url)		
	// 	.post('/register')
	// 	.send(profile).expect(responseCode.SUCCESS) 
	// 	.end(function(err, res) {	
	// 		if(err){
	// 			throw err;				      
	// 		}
	// 		else{
	// 			nconf.set('email',profile.email);
	//          nconf.set('password',profile.password);
	// 			nconf.save(function (err) {
	// 				fs.readFile('./test/testDataStore.json', function (err, data) {
	// 					testData = JSON.parse(data.toString());								
	// 					done();
	// 				});
	// 			});
	// 		}
	// 	});
	// });

	/**test case for user already registered*/
	it('user already registered', function(done) {	
		var profile = {
				"userName":testData.userName,
				"email":testData.email,
				"firstName":testData.firstName,
				"lastName":testData.lastName,				
				"password":testData.password				
			};
		request(config.url)		
		.post('/register')
		.send(profile).expect(responseCode.CONFLICT) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			done();
		});
	});
	/**test case for email is undefined */
	it('email is empty', function(done) {	
		var profile = {
				"email": testData.emptyEmail,
				"firstName":testData.firstName,
				"lastName":testData.lastName,				
				"password":testData.password,
				"userName": testData.firstName+" "+testData.lastName
			};
		request(config.url)		
		.post('/register')
		.send(profile).expect(responseCode.SERVERERROR) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			done();
		});
	});	
		
	/** login positive test case */
	it('Login Success', function(done) {	
		var profile = {
				"email": testData.email,
				"password": testData.password
			};
		request(config.url)		
		.post('/login')
		.send(profile).expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{
				console.log(res.headers.authorization);
				nconf.set('token', res.headers.token);
				nconf.save(function (err) {
					fs.readFile('./test/testDataStore.json', function (err, data) {
						testData = JSON.parse(data.toString());								
						done();
					});
				});
			}
		});
	});

	/** Login negative test case */
	it('login fail :: email not found',function(done){
		var profile={						
			"email": testData.invalidEmail,
			"password": testData.invalidPassword
		};	
		request(config.url)
		.post('/login')
		.send(profile).expect(responseCode.NOTFOUND)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	/** change password positive test case */
	it('Change Password Success', function(done) {	
		var rnum = Math.floor(Math.random() * 10000);
		var profile = {
				"oldPassword": testData.password,
				"newPassword": rnum
			};
		request(config.url)		
		.post('/secure/changepassword')
		.set({"Authorization":"bearer "+ testData.token})
		.send(profile).expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{
				nconf.set('password', rnum);
				nconf.save(function (err) {
					fs.readFile('./test/testDataStore.json', function (err, data) {
						testData = JSON.parse(data.toString());								
						done();
					});
				});
			}
		});
	});	

	/** change password negative test case */
	it('Change Password :: Unauthorized', function(done) {	
		var profile = {
				"oldPassword": testData.password,
				"newPassword": ""
			};
		request(config.url)		
		.post('/secure/changepassword')
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send(profile).expect(responseCode.UNAUTHORIZED) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{
				nconf.save(function (err) {
					fs.readFile('./test/testDataStore.json', function (err, data) {
						testData = JSON.parse(data.toString());								
						done();
					});
				});
			}
		});
	});
	
	it('change password :: password not match',function(done){
		var profile={						
			"oldPassword": testData.invalidEmail,
			"newPassword": testData.invalidPassword
		};	
		request(config.url)
		.post('/secure/changepassword')
		.set({"Authorization":"bearer "+ testData.token})
		.send(profile).expect(responseCode.NOTFOUND)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});		

	/** update push notifcation positive test case */
	it('Push Notification :: Success', function(done) {	
		var profile={						
			"pushNotificationStatus": testData.trueValue
		};	
		request(config.url)		
		.post('/secure/updatePushNotification')
		.set({"Authorization":"bearer "+ testData.token})
		.send(profile).expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{						
				done();				
			}
		});
	});	

	/** update push notifcation negative test case */
	it('Push Notification :: Unauthorized',function(done){
		var profile={						
			"pushNotificationStatu": testData.trueValue
		};	
		request(config.url)
		.post('/secure/updatePushNotification')
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send(profile).expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});	

	/** random ekgs positive test case */
	it('Random Ekgs :: Success', function(done) {			
		request(config.url)		
		.get('/secure/randomekgs/'+false)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{						
				done();				
			}
		});
	});	

	/** random ekgs negative test case */
	it('Random Ekgs :: Unauthorized',function(done){			
		request(config.url)
		.get('/secure/randomekgs/'+true)
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send().expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});	

	/** master data: positive test case */
	it('Master Data :: Success', function(done) {			
		request(config.url)		
		.get('/secure/masterdata')
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{						
				nconf.set('interpretationOne', res.body.data.interpretationList[0].interpretations[0]._id);	
				nconf.set('interpretationSecond', res.body.data.interpretationList[1].interpretations[0]._id);			
				nconf.save(function (err) {
					fs.readFile('./test/testDataStore.json', function (err, data) {
						testData = JSON.parse(data.toString());								
						done();
					});
				});	
			}
		});
	});	

	/** master data:negative test case */
	it('Master Data :: Unauthorized',function(done){			
		request(config.url)
		.get('/secure/masterdata')
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send().expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	/** All topics: positive test case */
	it('All Topics :: Success', function(done) {			
		request(config.url)		
		.get('/secure/alltopics')
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{	
				nconf.set('topicId', res.body.data[0]._id);	
				nconf.set('topicName', res.body.data[0].topicName);				
				nconf.save(function (err) {
					fs.readFile('./test/testDataStore.json', function (err, data) {
						testData = JSON.parse(data.toString());								
						done();
					});
				});			
			}
		});
	});	

	/** All topics:negative test case */
	it('All Topics :: Unauthorized',function(done){			
		request(config.url)
		.get('/secure/alltopics')
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send().expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	/** Ekgs by topic: positive test case */
	it('Ekg By Topic :: Success', function(done) {			
		request(config.url)		
		.get('/secure/ekgsbytopicid/'+ testData.topicId)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{	
				nconf.set('ekgId', res.body.data[0]._id);
				nconf.set('ekgTitle', res.body.data[0].title);					
				nconf.save(function (err) {
					fs.readFile('./test/testDataStore.json', function (err, data) {
						testData = JSON.parse(data.toString());								
						done();
					});
				});			
			}
		});
	});	

	/** Ekgs by topic: negative test case */
	it('Ekg By Topic :: Unauthorized',function(done){			
		request(config.url)
		.get('/secure/ekgsbytopicid/'+ testData.topicId)
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send().expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	it('Ekg By Topic :: Not Found', function(done) {			
		request(config.url)		
		.get('/secure/ekgsbytopicid/'+ testData.wrongTopicId)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.NOTFOUND) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{	
				done();		
			}
		});
	});	

	/** Ekg detail: positive test case */
	it('Ekg Detail :: Success', function(done) {			
		request(config.url)		
		.get('/secure/ekgdetails/'+ testData.ekgId)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{					
				done();
			}
		});
	});	

	/** Ekg detail: negative test case */
	it('Ekg Detail :: Unauthorized',function(done){			
		request(config.url)
		.get('/secure/ekgdetails/'+ testData.ekgId)
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send().expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	it('Ekg Detail :: Not Found', function(done) {			
		request(config.url)		
		.get('/secure/ekgdetails/'+ testData.wrongTopicId)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.NOTFOUND) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{	
				done();		
			}
		});
	});	

	/** User feedback: positive test case */
	it('User Feedback :: Success', function(done) {
		var profile={						
			"feedbackContent": testData.feedbackContent
		};			
		request(config.url)		
		.post('/secure/feedback')
		.set({"Authorization":"bearer "+ testData.token})
		.send(profile).expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{					
				done();
			}
		});
	});	

	/** User feedback: negative test case */
	it('User Feedback :: Unauthorized',function(done){	
		var profile={						
			"feedbackContent": testData.feedbackContent
		};		
		request(config.url)
		.post('/secure/feedback')
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send(profile).expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	/** Submit ekg diagnosis: positive test case */
	it('Submit Ekg Diagnosis :: Success', function(done) {
		var profile={						
			"topicId": testData.topicId,
			"ekgId": testData.ekgId,
			"ekgTitle": testData.ekgTitle,
			"topicTitle": testData.topicName,
			"diagnosis": [testData.interpretationOne, testData.interpretationSecond],
			"submissionSessionId": testData.submissionSessionId

		};			
		request(config.url)		
		.post('/secure/submitekgdiagnosis')
		.set({"Authorization":"bearer "+ testData.token})
		.send(profile).expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{					
				done();
			}
		});
	});	

	/** Submit ekg diagnosis: negative test case */
	it('Submit Ekg Diagnosis :: Unauthorized',function(done){	
		var profile={						
			"topicId": testData.topicId,
			"ekgId": testData.ekgId,
			"ekgTitle": testData.ekgTitle,
			"topicTitle": testData.topicName,
			"diagnosis": [testData.interpretationOne, testData.interpretationSecond],
			"submissionSessionId": testData.submissionSessionId

		};			
		request(config.url)
		.post('/secure/submitekgdiagnosis')
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send(profile).expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

/** Test result: positive test case */
	it('Test Result :: Success', function(done) {					
		request(config.url)		
		.get('/secure/testresult/'+testData.topicId+'/'+ testData.submissionSessionId)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{					
				done();
			}
		});
	});	

	/** Test result: negative test case */
	it('Test Result :: Unauthorized',function(done){				
		request(config.url)
		.get('/secure/testresult/'+testData.topicId+'/'+ testData.submissionSessionId)
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send().expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	it('Test Result :: Bad Request',function(done){				
		request(config.url)
		.get('/secure/testresult/'+testData.wrongTopicId+'/'+ testData.submissionSessionId)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.BADREQUEST)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	/** Score Report: positive test case */
	it('Score Report :: Success', function(done) {					
		request(config.url)		
		.get('/secure/scorereport/'+'4'+'/'+ testData.startDate+'/'+testData.endDate)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{					
				done();
			}
		});
	});	

	/** Score Report: negative test case */
	it('Score Report :: Unauthorized',function(done){				
		request(config.url)
		.get('/secure/scorereport/'+testData.intervalType+'/'+ testData.startDate+'/'+testData.endDate)
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send().expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	it('Score Report :: Bad Request',function(done){				
		request(config.url)
		.get('/secure/scorereport/'+testData.intervalType+'/'+ testData.startDate+'/'+testData.startDate)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.NOTFOUND)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	/** Device Registered: positive test case */
	it('device registered :: Successfully', function(done) {
		request(config.url)		
		.put('/secure/registerdevice/'+testData.deviceId+'/'+testData.deviceType)
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{							
				done();					
			}
		});
	});	

	/** Device Registered: negative test case */
	it('device registered :: Unauthorized',function(done){			
		request(config.url)
		.put('/secure/registerdevice/'+testData.deviceId+'/'+testData.deviceType)
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send().expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});

	/** Forgot Password: positive test case */
	it('Forgot Password :: Successfully', function(done) {
		var profile={						
			"email": testData.email,
		};
		request(config.url)		
		.post('/forgotpassword')
		.send(profile).expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{							
				done();					
			}
		});
	});		

	/** Forgot Password: negative test case */
	it('Forgot Password :: Not Found', function(done) {
		var profile={						
			"email": testData.invalidEmail,
		};
		request(config.url)		
		.post('/forgotpassword')
		.send(profile).expect(responseCode.NOTFOUND) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{							
				done();					
			}
		});
	});		
	/** Log out: positive test case */
	it('Log Out :: Success', function(done) {					
		request(config.url)		
		.post('/secure/logout')
		.set({"Authorization":"bearer "+ testData.token})
		.send().expect(responseCode.SUCCESS) 
		.end(function(err, res) {	
			if(err){
				throw err;				      
			}
			else{					
				done();
			}
		});
	});	
	// Users.removeUser({sessionId: testData.token}, function(err, user){
	// 	if(err){
	// 		console.log("User Not Deleted.");
	// 	}
	// 	else{
	// 		AnswerModel.removeAnswer({userId: user._id }, function(err, deleted){
	// 			if(err){
	// 				console.log("Answer Not Deleted.");
	// 			}
	// 			else{
	// 				console.log("Test Data Deleted.");
	// 			}
	// 		});
	// 	}
	// });

	/** Log out: negative test case */
	it(' Log out :: Unauthorized',function(done){				
		request(config.url)
		.post('/secure/logout')
		.set({"Authorization":"bearer "+ testData.wrongToken})
		.send().expect(responseCode.UNAUTHORIZED)
		.end(function(err,res){			
			if(err){
				throw err;
			}
			done();
		});
	});
	// /** Ekgs by topic id: positive test case */
	// it('Random Ekgs :: Success', function(done) {			
	// 	request(config.url)		
	// 	.get('/secure/randomekgs/'+false)
	// 	.set({"Authorization":"bearer "+ testData.token})
	// 	.send().expect(responseCode.SUCCESS) 
	// 	.end(function(err, res) {	
	// 		if(err){
	// 			throw err;				      
	// 		}
	// 		else{						
	// 			done();				
	// 		}
	// 	});
	// });	

	// /** Ekgs by topic id:negative test case */
	// it('Random Ekgs :: Unauthorized',function(done){			
	// 	request(config.url)
	// 	.get('/secure/randomekgs/'+true)
	// 	.set({"Authorization":"bearer "+ testData.wrongToken})
	// 	.send().expect(responseCode.UNAUTHORIZED)
	// 	.end(function(err,res){			
	// 		if(err){
	// 			throw err;
	// 		}
	// 		done();
	// 	});
	// });								
});
