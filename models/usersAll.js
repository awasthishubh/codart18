const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const users = new Schema({
    firstname:String,
    lastname: String,
    email: String,
    regno: String,
    team: String,
    phone: String
});

module.exports = mongoose.model("allRegUsers", users);