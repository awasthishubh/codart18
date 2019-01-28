const Users=require('../models/Users')
const Score=require('../models/Score')
const Ques=require('../models/Question')
const Attempts=require('../models/Attempts')
path=require('path')

module.exports=(app)=>{
    app.get('/leaderboard',async (req,res)=>{
        scre=[]
        teams=await Users.distinct('team');
        for(let i=0; i<teams.length; i++){
            teamScore={team:teams[i],score:0, totalQues:0, solvedQues:0}

            teamScr=await Score.find({team:teams[i]})
            teamScr.forEach(point=>{
                teamScore.score+=point.score
            })
            teamScore.solvedQues=await Score.find({team:teams[i],cases:{$ne:false}}).count()
            teamScore.totalQues=await Ques.find({assignedTo:teams[i]}).count()

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

    app.get('/team/problem',async (req,res)=>{
        data=await Ques.find({assignedTo:req.body.team},'id level descr')
        data=JSON.parse(JSON.stringify(data));

        for(let i=0; i<data.length;i++){
            score=await Score.findOne({team:req.body.team,qid:data[i].id})
            data[i].point=score?score.score:0;
        }
        res.json(data)
    })
    
    app.get('/team',async (req,res)=>{
        members=await Users.find({team:req.body.team},'firstname lastname email regno')
        points=0;
        (await Score.find({team:req.body.team}))
            .forEach(pr=>points+=pr.score)
        solvedQues=await Score.find({team:req.body.team,cases:{$ne:false}}).count()
        totalQues=await Ques.find({assignedTo:req.body.team}).count()

        res.json({team:req.body.team, members,points,totalQues,solvedQues})
    })

    app.get('/team/attempts', async (req,res)=>{
        attempts=await Attempts.find({team:req.body.team,qid:req.body.qid||/./})
        res.send(attempts)
    })

    app.get('/download/:team/:file', async (req,res)=>{
        res.download(path.join(__dirname, '../files/attempts/',req.params.team,req.params.file))
    })
}