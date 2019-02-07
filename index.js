const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')
const path=require("path")
const http=require('http')
var socketIO = require('socket.io')
var app=express()
var server=http.createServer(app)
var io=socketIO(server)

require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use((req,res, next)=>{	
    res.header("Access-Control-Allow-Origin", "*");	
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods','GET, PUT, POST, DELETE, PATCH, OPTIONS');
    next()
})

socketTeam={}


require('./socket').onFunc(io,socketTeam)
require('./routes/submit')(app,io,socketTeam)
require('./routes/client')(app,io,socketTeam)
require('./routes/admin')(app,io,socketTeam)

console.log(path.join(__dirname,'/view'))
app.use('/adminView',express.static(path.join(__dirname,'/adminView')))

mongoose.connect(process.env.DB,{useNewUrlParser: true},(err,db)=>{
    if(err) throw err
    server.listen(process.env.PORT,function(e){
        if(e) throw e
        console.log('Server Started At',process.env.PORT)
    })
})