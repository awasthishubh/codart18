const Users=require('../models/Users')
const Score=require('../models/Score')
module.exports=(app)=>{
    app.get('/leaderboard',async (req,res)=>{
        scre=[]
        teams=await Users.distinct('team');
        for(let i=0; i<teams.length; i++){
            teamScore={team:teams[i],score:0}

            teamScr=await Score.find({team:teams[i]})
            teamScr.forEach(point=>{
                teamScore.score+=point.score
            })
            scre.push(teamScore)
        }
        scre.sort((a,b)=>{
            if(a.score>b.score) return -1
            if(a.score<b.score) return 1
            if(a.team>b.team) return 1
            if(a.team<b.team) return -1
            else return 0
        })
        res.json(scre)
    })
}