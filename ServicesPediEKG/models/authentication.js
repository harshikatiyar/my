// Importing node modules
var passport                = require('passport');
var BearerStrategy          = require('passport-http-bearer').Strategy;
var UserModel  = require('../models/usersmodel.js').schema;

//perform authentication
passport.use(new BearerStrategy(function(accessToken, done) {
        accessToken = accessToken.replace(/ /g,'+');
        UserModel.find({ sessionId: accessToken, isActive: true }, function(err, user) {
            if (err) {return done(err); }
            if (user.length < 1) { 
				return done(null, false); 
			}
            else{
			    UserModel.update({ sessionId: accessToken },{"lastAccessTime":Date.now()},function (err,result) {			
                    if (err) { return done(err); }
                    if (result < 0) { return done(null, false, { message: 'Unknown user' }); }
                    var info = { scope: '*' };
				    return done(null, user, info);
                });
			}
        });
    }
));

