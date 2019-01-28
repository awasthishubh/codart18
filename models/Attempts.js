const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Attempts = new Schema({
    qid:String,
    team:String,
    score:{
        type:Number,
        default:0
    },
    cases:{
        type:Array,
        default:[]
    },
    time:Object
});

module.exports = mongoose.model("attempts", Attempts);