const mongoose = require("mongoose");
const UserAll=require('./models/usersAll')
const Team=require('./models/Team')

require('dotenv').config()
mongoose.connect(process.env.DB,{useNewUrlParser: true},(err,db)=>{
    team=["GarlicRoti","Red_Zone","Bit_Lords","Choti maa ka bharosa","Why_r_u?","Badi Maa ka Bharosa","maa ka bharosa","D350","Kartik","Banana","424","Decoders"]
    UserAll.find({team:{$in:team}},{'__v':0,'_id':0},(e,d)=>{
        team={}
        d.forEach(e=>{
            if(team[e.team])
                team[e.team].push(e)
            else team[e.team]=[e]
        })
        teamArray=[]
        for(key in team){
            teamArray.push({
                team:key.toLowerCase().trim(),
                skips:3,
                lastSkip:null,
                passwd:'',
                members:team[key]
            })
        }
        Team.deleteMany({}, function(err) { 
            Team.create(teamArray,()=>db.close())
         });
        
        console.log(teamArray.length)
        // db.close()
    })
})
