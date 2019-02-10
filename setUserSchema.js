const mongoose = require("mongoose");
const UserAll=require('./models/usersAll')
const Team=require('./models/Team')

require('dotenv').config()
mongoose.connect(process.env.DB,{useNewUrlParser: true},(err,db)=>{
    team=["GarlicRoti","Red_Zone","Bit_Lords","Choti maa ka bharosa","Why_r_u?","Badi Maa ka Bharosa","maa ka bharosa","D350","Kartik","Banana","424","Decoders"]
    passwd=["latehornet","sillychicken","poorbutterfly","decentturtle",
        "bouncylizard","testedbacteria","thesetamarin","classicraven","illgrouse",
        "dailyswift","pettyboa","ruralturkey","hilarioushorse","tamecow"]
    UserAll.find({team:{$in:team}},{'__v':0,'_id':0},(e,d)=>{
        team={}
        d.forEach((e,i)=>{
            if(team[e.team])
                team[e.team].push(e)
            else team[e.team]=[e]
        })
        teamArray=[]
        for(key in team){
            teamArray.push({
                team:key.toLowerCase().trim(),
                skips:3,
                lastSkip:0,
                passwd:passwd.pop(),
                members:team[key]
            })
        }
        teamArray.push({
            team:'admin',
            skips:1000,
            lastSkip:0,
            passwd:'admin112',
            members:[]
        })
        Team.deleteMany({}, function(err) { 
            Team.create(teamArray,()=>db.close())
        });
        
        console.log(teamArray.length)
        // db.close()
    })
})
