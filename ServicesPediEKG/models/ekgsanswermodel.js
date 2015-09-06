//node module
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//answer schema
var ekgsanswermodel = new mongoose.Schema({
    userId: {type: Schema.Types.ObjectId, ref:'users'},
    topicId : {type: Schema.Types.ObjectId, ref: 'topics'},
    ekgId : {type: Schema.Types.ObjectId, ref: 'ekgs'},
    answerSubmitted :{type: Number},
    dateAttempted : { type: Date},
   	history : {type: String, default: " "},
   	title : {type: String, default: " "},
   	submitAnswerValue: [],
    ekgType:  {type: String},
   	correctAnswer : [],
   	tags : [],
   	ekgTitle: {type: String},
    submissionSessionId : {type: String}  
});

var submittedAnswer = mongoose.model('ekganswerssubmissions', ekgsanswermodel);

module.exports={
	//save answer
	saveAnswer : function(data, callback){
		new submittedAnswer(data).save(callback);	
	},

	//get result by match, projection and grouping
	fetchRecordsByGrpAndProjection : function( condition, projection, group, callback){
		submittedAnswer.aggregate({$match : condition},{$project: projection},{$group: group},callback);
	},

	//gat result by match and grouping
	getDataByGroup : function(conditon, key, callback){
		submittedAnswer.aggregate({ $match : conditon},{ $group : key}, callback);
	},

	//get result by natch and nested grouping
	getScoreWeeklyBasis : function(condition, groupLevel1, groupLevel2, groupLevel3, callback){
		submittedAnswer.aggregate({ $match: condition},{ $group: groupLevel1},{ $group : groupLevel2},{ $group: groupLevel3},callback);//.populate('userId', 'email',callback);//).exec(callback);
	},

	//get result by match, projection and nested grouping
	getScoreReport : function( condition, projection, groupLevel1, groupLevel2, groupLevel3, callback){
		submittedAnswer.aggregate({ $match: condition},{ $project: projection},{ $group: groupLevel1},{ $group : groupLevel2},{ $group: groupLevel3}, callback);
	},
	//update answer
	updateAnswer : function(condition, data, options, callback){
		submittedAnswer.update(condition, data, options, callback);
	},

	//remove answer
	removeAnswer : function(condition, callback){
		submittedAnswer.remove(condition, callback);
	},

	//two level grouping
	groupingTwoLevel : function( condition, projection, groupLevel1, groupLevel2, callback){
		submittedAnswer.aggregate({ $match: condition},{ $project: projection},{ $group: groupLevel1},{ $group : groupLevel2}, callback);
	},

	schema : submittedAnswer
}