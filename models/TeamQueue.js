const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Queue = new Schema({
    queue:Array,
});

module.exports = mongoose.model("queue", Queue);