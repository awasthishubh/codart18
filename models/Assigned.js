const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Assigned = new Schema({
    qid:String,
    team:String,
    score:Number,
    cases:Array
});

module.exports = mongoose.model("scores", Assigned);