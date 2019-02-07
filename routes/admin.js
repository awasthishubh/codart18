const Ques=require('../models/Question')
const Team=require('../models/Team')
const Score=require('../models/Score')
const adminPolicy=require('../policy').admin
const teamQueue=require('../teamQueue')
const jwt=require('jsonwebtoken')
// const Users=require('../models/Users')
var emitMem=require('../socket').brodcast

console.log(adminPolicy)
module.exports=function(app,io,socketTeam){
    app.post('/assign',adminPolicy,async function(req,res){
        var {level}=req.body
        team=await teamQueue.shift()
        team=team.toLowerCase()
        if(team===undefined) return res.status(400).json({msg:'empty queue'})
        console.log({level,team})

        if(!['hard','medium','easy'].includes(level) || !(await Team.findOne({team})))
            return res.status(400).json({err:'invalid level or team'})

        if(await Score.findOne({team,allowed:true}))
            return res.status(400).json({err:'Already assigned'})

        Ques.find({level,assignedTo:{$ne:team}},[],{sort:'count',limit:1},async (e,ques)=>{
            if(e) return res.status(500).json({err:'db err', hint:'assign, ques'})
            if(!ques.length) return res.status(404).json({err:'no ques found'})

            try{
                await Ques.updateOne({id:ques[0].id},{
                    $push: { assignedTo: team},
                    $inc:  {count:1}
                })
                await Score.create({qid:ques[0].id,team})
                emitMem(io,socketTeam[team],null,'updateQues')
                console.log({sucess:true, msg:ques[0].id+' assigned to '+team})
                return res.json({sucess:true, msg:ques[0].id+' assigned to '+team})
            } catch(e){
                console.error(e)
                return res.json(ques[0])
            }
        })
    })

    app.get('/assign', adminPolicy, function(req,res){
        Ques.find({},'id assignedTo', async (err,data)=>{
            if(err) return res.status(500).json({err:'db err', hint:'assign, ques'})
            team={}
            for(var i=0; i<data.length; i++){
                for(var j=0; j<data[i].assignedTo.length;j++){
                    console.log({
                        team:data[i].assignedTo[j],
                        qid:data[i].id
                    })
                    allowed=(await Score.findOne({
                        team:data[i].assignedTo[j],
                        qid:data[i].id
                    })).allowed
                    if(!team[data[i].assignedTo[j]])
                        team[data[i].assignedTo[j]]=[{id:data[i].id,allowed}]
                    else team[data[i].assignedTo[j]].push({id:data[i].id,allowed})
                }
            }
            res.json(team)
        })
    })

    app.delete('/assign', adminPolicy, async function(req,res){
        var {qid,team}=req.body
        if(!(qid && team)) return res.status(400).json({err:'Incomplete req'})
        if(!(await Ques.findOne({id:qid,assignedTo:team})))
            return res.status(404).json({err:'Ques not assigned'})
        await Ques.updateOne(
            {id:qid},
            {$pull:{assignedTo:team}}
        )
        await Score.remove({qid,team})
        emitMem(io,socketTeam[team],null,'updateQues')
        res.json({message:'unassigned'})
    })

    app.get('/queue',adminPolicy, async (req,res)=>{
        queue=await teamQueue.getAll()
        res.json(queue)
    })
    app.post('/queue',adminPolicy, async (req,res)=>{
        if(!req.body.team) return res.status(400).json({err:'team name required'})
        queue=await teamQueue.insert(req.body.team)
        res.json(queue)
    })
    app.delete('/queue',adminPolicy, async (req,res)=>{
        queue=await teamQueue.shift(req.body.team)
        res.json(queue)
    })

    app.post('/adminLogin',(req,res)=>{
        if(req.body.adminId==process.env.ADMINID){
            token = jwt.sign({type:'admin'},process.env.SECRET);
            res.cookie('token',token, { maxAge: 900000, httpOnly: true })
            return res.json({sucess:true,token})
        }
        res.status(401).json({err:'invalid'})
    })
    app.get('/participants',adminPolicy,async (req,res)=>{
        res.json(await Team.distinct('team'))
    })
}