const Team=require('../models/Team')
const Score=require('../models/Score')
const Ques=require('../models/Question')
const Attempts=require('../models/Attempts')
const jwt=require('jsonwebtoken')
const Queue=require('../teamQueue')
const userPolicy=require('../policy').user
console.log(userPolicy)
path=require('path')
var emitMem=require('../socket').brodcast

module.exports=(app,io,socketTeam)=>{
    app.get('/leaderboard',userPolicy,async (req,res)=>{
        var scre=[]
        teams=await Team.distinct('team');
        console.log(teams)
        for(var i=0; i<teams.length; i++){
            console.log(i)
            teamScore={team:teams[i],score:0, totalQues:0, solvedQues:0}
            teamScr=await Score.find({team:teams[i]})
            teamScr.forEach(point=>{
                teamScore.score+=point.score
            })
            teamScore.solvedQues=await Score.find({team:teams[i],cases:{$ne:false}}).count()
            teamScore.totalQues=await Ques.find({assignedTo:teams[i]}).count()
            leaderboard=
            scre.push(teamScore)
        }
        scre.sort((a,b)=>{
            if(a.score>b.score) return -1
            if(a.score<b.score) return 1
            if(a.team>b.team) return 1
            if(a.team<b.team) return -1
            else return 0
        })
        position=scre.findIndex(x=>x.team==req.body.team)+1
        res.json({position,result:scre})
        scre=[]
    })

    app.get('/team/problem',userPolicy,async (req,res)=>{
        q=(await Score.findOne({team:req.body.team,allowed:true}))
        if(!q){
            index=await Queue.getIndex(req.body.team)
            return res.status(404).json({err:'No Ques assigned',QueueIndex:index})
        }

        ques=await Ques.findOne({
            id:q.qid,
        },'id level title descr')
        if(ques){
            score=await Score.findOne({team:req.body.team, qid:req.query.qid})
            ques=JSON.parse(JSON.stringify(ques));
            return res.json({...ques,point:score?score.score:0})
        }
        else return res.status(404).json({err:'No Ques assigned'})
    })
    
    app.get('/team',userPolicy,async (req,res)=>{
        teamDetails=await Team.findOne({team:req.body.team},{'passwd':0})
        teamDetails=JSON.parse(JSON.stringify(teamDetails))
        points=0;
        (await Score.find({team:req.body.team}))
            .forEach(pr=>points+=pr.score)
        solvedQues=await Score.find({team:req.body.team,cases:{$ne:false}}).count()
        totalQues=await Ques.find({assignedTo:req.body.team}).count()
        res.json({...teamDetails,team:req.body.team,points,totalQues,solvedQues})
    })

    app.get('/team/attempts',userPolicy, async (req,res)=>{
        q=(await Score.findOne({team:req.body.team,allowed:true}))
        if(!q){
            index=await Queue.getIndex(req.body.team)
            return res.status(404).json({err:'No Ques assigned',QueueIndex:index})
        }
        attempts=await Attempts.find({team:req.body.team,qid:q.qid}).sort({_id:-1})
        res.send(attempts)
    })

    app.get('/download/:team/:file',userPolicy, async (req,res)=>{
        res.download(path.join(__dirname, '../files/attempts/',req.params.team,req.params.file))
    })

    app.post('/login', async function(req,res){
        var {team,passwd}=req.body
        if(!team && !passwd) return res.status(400).json({sucess:false,msg:'Team and passwd required'});
        team=team.toLowerCase()
        console.log(({team,passwd}))
        try{
            teamVerified=await Team.findOne({team,passwd})
            console.log(teamVerified)
            if(teamVerified){
                token = jwt.sign({team},process.env.SECRET);
                res.setHeader('Authorization', token);
                res.json({sucess:true,token})
            }
            else{
                res.status(404).json({sucess:false,msg:'Invalid User/Passwd'})
            }
        }
        catch(e){
            console.log(e);
            res.status(500).json({sucess:false,msg:'Something went wrong'})
        }
    })

    app.post('/team/problem/skip',userPolicy,async function(req,res){
        console.log({team:req.body.team})
        try{
            teamDetails=await Team.findOne({team:req.body.team})
            if(teamDetails.skips<1)
                return res.status(400).json({err:'You are exceeding skip limit'})
            if(teamDetails.lastSkip>(Date.now()-parseInt(process.env.SKIPTIME)*1000*60)){
                remainTime=teamDetails.lastSkip/60000-Date.now()/60000+parseInt(process.env.SKIPTIME)
                return res.status(400).json({err:`Please wait for ${Math.floor(remainTime)} mins befor next skip.`})
            }
            await Score.updateMany({team:req.body.team},{allowed:false})
            await Queue.insert(req.body.team)

            teamDetails.skips=teamDetails.skips-1
            teamDetails.lastSkip=Date.now()
            teamDetails.save()
            emitMem(io,socketTeam[req.body.team],req.body.socketId,'updateQues')
            res.json({sucess:true})
        } catch(e){
            console.log(e)
            res.json({sucess:false})
        }
    })

    app.get('/team/queue',userPolicy,async function(req,res){
        res.json({index:await Queue.getIndex(req.body.team)})
    })

    app.get('/testsocket',(req,res)=>{
        io.emit('hello')
        console.log(req.query.socketId)
        emitMem(io,socketTeam['Alpha'],req.query.socketId,'updateSub')
        res.end()
    })
}