config = '';
messages = '';
responseCode = '';

// Importing node modules
var express = require('express');
var http = require('http');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var path = require('path');
var passport=require('passport');
var errorHandler = require('express-error-handler');
var expressValidator = require('express-validator');
var methodOverride = require('method-override');
var crypto = require('crypto'); 
var setup = require('./routes/initialSetup');
require('./models/authentication');
var app = express();
app.use(expressValidator());
app.use(passport.initialize());

app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

var request = require('request');

mongoose.set('debug', true);

app.use(require('stylus').middleware(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    var typeOf = false;
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        typeOf = true;
    }
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-Allow-Headers']);
        typeOf = true;
    }
    if (req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        typeOf = true;
    }
    if (req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        typeOf = true;
    }
    // intercept OPTIONS method
    if (typeOf && req.method == 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

//restart server after crash
domain = require('domain'),
d = domain.create();

d.on('error', function(err) {
  console.error(err);
});

// development only
if ('development' == app.get('env')) {
    config = require('./scripts/config.json');
    messages = require('./scripts/messages.json');
    responseCode = require('./scripts/responsecodes.json');
    app.use(errorHandler());
}
// local env
else if ('local' == app.get('env')) {
    config = require('./scripts/configLocal.json');
    messages = require('./scripts/messages.json');
    responseCode = require('./scripts/responsecodes.json');
    app.use(errorHandler());
}
// test env
else if ('test' == app.get('env')) {
    config = require('./scripts/configTest.json');
    messages = require('./scripts/messages.json');
    responseCode = require('./scripts/responsecodes.json');
    app.use(errorHandler());
}
var routes = require('./routes');

app.set('port', process.env.PORT || config.port);
app.set('case sensitive routing', false);

// Create the database connection
mongoose.connect(config.dbUrl);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
	console.log('Mongoose default connection open to ' + config.dbUrl);
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
	console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
	console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
	mongoose.connection.close(function () {
		console.log('Mongoose default connection disconnected through app termination');
		process.exit(0);
	});
});

var router = express.Router();

// Perform authentication
router.all('/secure/*',passport.authenticate('bearer', { session: false }),function(req,res,next){ 
   console.log(req.method,'/',req.url);
	next();
});

function validateApp(req, res, next) {   
    var key = config.encryptionKey;
    var decrypted = '';
    var deCipher = crypto.createDecipher('aes256', key); 
    decrypted += deCipher.update(req.headers.appkey,'base64','utf-8');
    decrypted += deCipher.final('utf-8');
    if(decrypted != config.appkey){
         res.statusCode = config.unauthorized;
         return res.json(messages.unauthorized);       
    }
    else{
         next();
    }
};

//Routing between URL and corresponding controller
//services for mobile user
router.post('/register', routes.users.registrationMethod);
router.post('/forgotpassword', routes.users.forgotPasswordMethod);
router.post('/login', routes.users.loginMethod);
router.post('/secure/changepassword', routes.users.changePasswordMethod);
router.post('/secure/uploadProfileImage', routes.users.uploadImage);
router.post('/secure/logout', routes.users.logoutMethod);
router.put('/secure/registerdevice/:deviceId/:deviceType', routes.users.registerDeviceMethod); 
router.post('/secure/updatePushNotification', routes.users.updatePushNotification); 

router.get('/secure/alltopics', routes.topics.topicListForMobile);

router.get('/masterdata', validateApp, routes.masterdata.getMasterData);

router.post('/secure/feedback', routes.feedbacks.feedbackReport);

router.get('/secure/randomekgs/:personalize', routes.ekgs.randomEkgsMethod);
router.get('/secure/ekgsbytopicid/:topicId', routes.ekgs.ekgByTopicIdMethod);
router.get('/secure/ekgdetails/:ekgId', routes.ekgs.ekgDetailsMethod);

router.post('/secure/submitekgdiagnosis', routes.ekgsTest.submitEkgDiagnosisMethod);
router.get('/secure/testresult/:topicId/:submissionsessionId', routes.ekgsTest.testResultMethod);
router.get('/secure/scorereport/:intervalType/:startDate/:endDate', routes.ekgsTest.scoreReportMethod);

//services for admin user

router.post('/admin/login', routes.users.adminLoginMethod);
router.post('/secure/admin/adduser', routes.users.addUserMethod);
router.post('/secure/admin/updateUser', routes.users.updateUserMethod);
router.get('/secure/admin/deleteUser/:userId', routes.users.deleteUserMethod);
router.get('/secure/admin/users', routes.users.userListMethod);
router.post('/secure/admin/changepassword', routes.users.changePasswordMethod);

router.get('/secure/admin/topics/:type', routes.topics.topicsListMethod);
router.post('/secure/admin/addtopic', routes.topics.addTopicMethod);
router.post('/secure/admin/updatetopic', routes.topics.updateTopicMethod);
router.get('/secure/admin/deletetopic/:topicId', routes.topics.deleteTopicMethod);
router.get('/secure/admin/alltopicscategories', routes.topics.topicListForMobile);

router.get('/secure/admin/getfeedback', routes.feedbacks.getFeedbackMethod);

router.get('/secure/admin/tags', routes.tags.tagListMethod);
router.post('/secure/admin/addtag', routes.tags.addTagMethod);
router.post('/secure/admin/updatetag', routes.tags.updateTagMethod);
router.get('/secure/admin/deletetag/:tagId', routes.tags.deleteTagMethod);


router.get('/secure/admin/getsetting', routes.masterdata.getSettingMethod);
router.post('/secure/admin/updatesetting', routes.masterdata.updatesetting);
router.get('/secure/admin/getcontents', routes.masterdata.getContents);
router.post('/secure/admin/updateaboutus', routes.masterdata.updateAboutUsMethod);
router.post('/secure/admin/updatetutorial', routes.masterdata.updateTutorialMethod);
router.post('/secure/admin/updatereferences', routes.masterdata.updateReferenceMethod);
router.post('/secure/admin/addalgorithm', routes.masterdata.addEkgAlgorithmMethod);
router.get('/secure/admin/deletealgorithm/:algoId/:index', routes.masterdata.deleteEkgAlgorithmMethod);
router.post('/secure/admin/updatealgorithm', routes.masterdata.updateEkgAlgorithmMethod);

router.post('/secure/admin/updatetandc', routes.masterdata.updateTandCMethod);

router.post('/secure/admin/gettopicbyekg', routes.ekgs.retrieveTopicOnUpdateEkgMethod);
router.post('/secure/admin/addekgintopic',routes.ekgs.addEkgInTopicMethod);
router.get('/secure/admin/ekgs', routes.ekgs.ekgsListMethod);
router.post('/secure/admin/addekg', routes.ekgs.addEkgMethod);
router.post('/secure/admin/uploadimage', routes.ekgs.uploadEkgImages);
router.post('/secure/admin/sendnotification', routes.ekgs.sendTestNotification);
router.post('/secure/admin/updateekg', routes.ekgs.updateEkgMethod);
router.get('/secure/admin/deleteekg/:ekgId', routes.ekgs.deleteEkgMethod);
router.get('/secure/admin/ekgsbytopicid/:topicId', routes.ekgs.ekgByTopicIdMethod);

router.get('/secure/admin/groups', routes.groups.groupsListMethod);  
router.post('/secure/admin/addgroup', routes.groups.addGroupMethod);
router.post('/secure/admin/updategroup', routes.groups.updategroupMethod);
router.post('/secure/admin/addinterpretation', routes.groups.addInterpretationsMethod);   
router.get('/secure/admin/deletegroup/:groupId', routes.groups.deleteGroupMethod);  
router.post('/secure/admin/updateinterpretation', routes.groups.EditInterpretationsMethod); 
router.get('/secure/admin/deleteinterpretation/:interpretationId', routes.groups.deleteInterpretationsMethod);


router.get('/secure/admin/scorereportbytopic/:userId/:intervalType/:startDate/:endDate', routes.ekgsTest.scoreReportUserBasis);
router.get('/secure/admin/scorereportbyuser/:topicId/:intervalType/:startDate/:endDate', routes.ekgsTest.scoreReportTopicBasis);
router.get('/secure/admin/scorereportbyuser/:topicId/:ekgId/:intervalType/:startDate/:endDate', routes.ekgsTest.scoreReportTopicBasis);

setup.initialSetUp();
app.use('/',router);
app.listen(config.port);