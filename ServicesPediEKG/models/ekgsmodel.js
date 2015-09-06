//Importing node modules
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//ekg schema
var ekgsSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    diagnosis: { type: String },
    ekgImageExtension: { type: String },
    urgency:{ type: String },
    therapy:{ type: String },
    differentialDiagnosis: { type: String },
    history:{ type: String },
    references:{ type: String },
    interpretationList:[{
        interpretations:[Schema.Types.ObjectId],
        _id: false
    }],
    answerImageURL:{ type: String },
    answerFileName: { type: String},
    ekgNumber: { type: Number},
    explanation:{ type: String },
    fileName:{ type: String },
    imageURL:{ type: String },
    tags: [ {_id: {type: Schema.Types.ObjectId} , tagName:{ type: String } }],
    segment: [{ explanation:{ type: String }, fileName: { type: String }, imageURL: { type: String }, level: { type: Number }, _id: false}],
    isActive : {type: Boolean, default: false }
});

var ekgs = mongoose.model('ekgs', ekgsSchema);

module.exports={
    //create ekg
    createEkg : function( data, callback) {        
        new ekgs(data).save(callback);     
    },

    //get all ekgs
    getAllEKGS : function(condition, fields, callback){
        if(!fields)
            fields = {};
        ekgs.find(condition, fields, callback);
    },

    //get ekg by codition
    getEKG : function(condition, fields, callback){
         if(!fields)
            fields = {};
        ekgs.findOne(condition, fields, callback);
    },

    //get count of all ekgs
    getTotalEkgCount : function(condition, callback){
        ekgs.count(condition, callback);
    },

    //get random ekgs
    getRandomEkgs : function(condition, fields, skipRecords, countNoOfRecords, callback){
        ekgs.find(condition, fields).skip(skipRecords).limit(countNoOfRecords).exec(callback);
    },

    //get ekgs list for admin with count
    ekgsList : function(condition, fields, callback){
        if(!fields)
            fields = {};
        ekgs.find(condition, fields).sort({title:1}).exec(function(err,ekgList){
            if(err){
                callback(err, null);
            }
            else{
                ekgs.count(condition, function(err, totalCount){
                    if(err){
                        callback(err, null);
                    }
                    else{
                        callback(null,{count: totalCount,ekgs: ekgList});
                    }
                });
            }
        });
    }, 

    //remove ekg
    removeEkg : function(condition, callback){
        ekgs.remove(condition,callback);
    },

    //get ekgs interpretations
    getEKGAnswer : function(condition, fields, callback){
         if(!fields)
            fields = {};
        ekgs.findOne({ _id: condition.ekgId, 'interpretationList.interpretations' : { $size: condition.diagnosis.length,$all :condition.diagnosis}}, fields, callback);
    },

    //overwite ekg object
    updateEkg : function(condition, data, callback){
        ekgs.findOneAndUpdate(condition, data, callback);
    },

    ///remove element in array
    updateInterpretationInEkg : function(condition, data, options, callback){      
        ekgs.find().where("interpretationList.interpretations",condition).exec(function(err, ekgArray) {
            if(err){
                callback(err);
            }
            else if(ekgArray.length == 0){
                callback(null, false);
            }
            else{
                ekgArray.forEach(function(ekg) {              
                    if (ekg != null) {
                        var isModified = false;         
                        var il = ekg.interpretationList;
                        for (var i in il) {
                            var j = il[i].interpretations != null ? il[i].interpretations.length : 0 ;
                            while (j--) {
                                if (il[i].interpretations[j].equals(condition)) {
                                    il[i].interpretations.splice(j, 1);
                                    isModified = true;
                                }
                            }
                        }
                        if (isModified) {
                            ekgs.update({ "_id": ekg._id },{ "$set": { "interpretationList": il }},function(err, updated) {
                                if(err){
                                    callback(err);
                                }
                                else{
                                    callback(null, updated);
                                } 
                            });
                        }
                    }
                });
            }  
        });
    },

    //set specific field
    updateInterpretation : function(condition, data, options, callback){
        ekgs.update(condition, {$set :data}, options, callback);
    },

    //update tag
    updateTag : function(condition, data, options, callback){
        ekgs.update(condition, data, options, callback);
    },

    updateArrayInDocuments : function(condition, data, callback){
        ekgs.find(condition, function(err, ekgObjects){
            var i=0, count=0;
            for(i; i< ekgObjects.length; i++){
                condition._id = ekgObjects[i]._id;
                ekgs.update(condition, { $set: data}, function(err, result){
                    if(err){
                        callback(err);
                    }
                    else{
                         count ++;
                    }
                    if(count == ekgObjects.length){
                        callback(null, 1);
                    }                  
                });                
            }
            if(ekgObjects.length == 0){
                callback(null, 1);
            }
        });
    },
    schema : ekgs
}