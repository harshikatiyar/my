//Importing node modules
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//ekg schema
var tagSchema = new mongoose.Schema({
    tagName: { type: String }
});

var tags = mongoose.model('ekgtags', tagSchema);

module.exports={
    //create tag
    createTag : function( data, callback) {        
        new tags(data).save(callback);     
    },
    //get tags list
    tagssList : function(condition, fields, callback){
        if(!fields)
            fields = {};
        tags.find(condition, fields).sort({tagName:1}).exec(function(err,tagList){
            if(err){
                callback(err, null);
            }
            else{
                tags.count(condition, function(err, totalCount){
                    if(err){
                        callback(err, null);
                    }
                    else{
                        callback(null,{count: totalCount,tags: tagList});
                    }
                });
            }
        });
    },
    //update tags
    updateTag : function(condition, data, options, callback){
        tags.update(condition, data, options, callback);
    },
    //remove tags
    removeTag : function(condition, callback){
        tags.remove(condition,callback);
    },
    schema : tags
};