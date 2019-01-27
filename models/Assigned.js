const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Scores = new Schema({
    qid:String,
    team:String,
    score:Number,
    cases:Array
});

module.exports = mongoose.model("scores", Scores);