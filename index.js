const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require('dotenv').config()
app=express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use((req,res, next)=>{	
    res.header("Access-Control-Allow-Origin", "*");	
    res.header("Access-Control-Allow-Headers", "Authorization");	
    res.header('Access-Control-Allow-Methods','GET, PUT, POST, DELETE, PATCH, OPTIONS');
    next()
})

require('./routes/submit')(app)

app.listen(process.env.PORT,function(e){
    if(e) throw e
    console.log('Server Started At',process.env.PORT)
})