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
    title:String,
    testCase:Array,
    output:Array,
    time:Number,
    count:{
        type:Number,
        default: 0
    },
    assignedTo:{
        type:Array,
        default: []
    }
});

module.exports = mongoose.model("questions", Questions);