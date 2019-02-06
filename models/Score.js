const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Score = new Schema({
    qid:String,
    team:String,
    score:{
        type:Number,
        default:0
    },
    cases:{
        type:Array,
        default:[false]
    },
    allowed:{
        type:Boolean,
        default:true
    }
});

module.exports = mongoose.model("score", Score);