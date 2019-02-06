const Users=require('../models/Users')
const Score=require('../models/Score')
const Ques=require('../models/Question')
const Attempts=require('../models/Attempts')
const jwt=require('jsonwebtoken')
const Queue=require('../teamQueue')
const userPolicy=require('../policy').user
console.log(userPolicy)
path=require('path')

module.exports=(app)=>{
    app.get('/leaderboard',userPolicy,async (req,res)=>{
        scre=[]
        teams=await Users.distinct('team');
        console.log(teams)
        for(let i=0; i<teams.length; i++){
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
        members=await Users.find({team:req.body.team},'firstname lastname email regno')
        points=0;
        (await Score.find({team:req.body.team}))
            .forEach(pr=>points+=pr.score)
        solvedQues=await Score.find({team:req.body.team,cases:{$ne:false}}).count()
        totalQues=await Ques.find({assignedTo:req.body.team}).count()
        res.json({team:req.body.team, members,points,totalQues,solvedQues})
    })

    app.get('/team/attempts',userPolicy, async (req,res)=>{
        q=(await Score.findOne({team:req.body.team,allowed:true}))
        if(!q){
            index=await Queue.getIndex(req.body.team)
            return res.status(404).json({err:'No Ques assigned',QueueIndex:index})
        }
        attempts=await Attempts.find({team:req.body.team,qid:q.qid})
        res.send(attempts)
    })

    app.get('/download/:team/:file',userPolicy, async (req,res)=>{
        res.download(path.join(__dirname, '../files/attempts/',req.params.team,req.params.file))
    })

    app.post('/login', async function(req,res){
        var {team,passwd}=req.body
        if(!team && !passwd) return res.status(400).json({sucess:false,msg:'Team and passwd required'});
        try{
            user=await Users.findOne({team,passwd})
            console.log(user)
            if(user){
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
            await Score.updateMany({team:req.body.team},{allowed:false})
            await Queue.insert(req.body.team)
            res.json({sucess:true})
        } catch(e){
            console.log(e)
            res.json({sucess:false})
        }
    })
}