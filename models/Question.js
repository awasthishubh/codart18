const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Questions = new Schema({
    id:{
        type:String,
        unique: true
    },
    level:{
        type:String,
        enum :['hard','medium','easy']
    },
    descr:String,
    testCase:Array,
    output:Array,
    count:{
        type:Number,
        default: 0
    },
    AssignedTo:{
        type:Array,
        default: []
    }
});

module.exports = mongoose.model("questions", Questions);