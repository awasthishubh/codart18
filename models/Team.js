const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const teams = new Schema({
    team:String,
    skips:{
        type:Number,
        default:3
    },
    lastSkip:{
        type:Number,
        default:0
    },
    passwd:{
        type:String,
        default:''
    },
    members:Array
});

module.exports = mongoose.model("teams", teams);