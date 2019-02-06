const Ques=require('../models/Question')
const User=require('../models/Users')
const Score=require('../models/Score')
const adminPolicy=require('../policy').admin
const teamQueue=require('../teamQueue')

console.log(adminPolicy)
module.exports=function(app){
    app.post('/assign',adminPolicy,async function(req,res){
        var {level,team}=req.body
        console.log({level,team})
        if(!['hard','medium','easy'].includes(level) || !(await User.findOne({team})))
            return res.status(400).json({err:'invalid level or team'})
        Ques.find({level,assignedTo:{$ne:team}},[],{sort:'count',limit:1},async (e,ques)=>{
            if(e) return res.status(500).json({err:'db err', hint:'assign, ques'})
            if(!ques.length) return res.status(404).json({err:'no ques found'})

            try{
                UpdateQ=await Ques.updateOne({id:ques[0].id},{
                    $push: { assignedTo: team},
                    $inc:  {count:1}
                })
                await Score.updateMany({team},{allowed:false})
                await Score.create({qid:ques[0].id,team})
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
            // await data.forEach(async el => {
            //     await el.assignedTo.forEach(async tm=>{
            //         allowed=(await Score.findOne({team:tm,qid:el.id})).allowed
            //         if(!team[tm])
            //             team[tm]=[{id:el.id,allowed}]
            //         else team[tm].push({id:el.id,allowed})
            //         console.log(team[tm])
            //     })
            // });
            // res.json(team)
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
        res.json({message:'unassigned'})
    })

    app.get('/queue',async (req,res)=>{
        queue=await teamQueue.getAll()
        res.json(queue)
    })
    app.post('/queue',async (req,res)=>{
        if(!req.body.team)res.status(400).json({err:'err'})
        queue=await teamQueue.insert(req.body.team)
        res.json(queue)
    })
    app.delete('/queue',async (req,res)=>{
        if(!req.body.team)res.status(400).json({err:'err'})
        queue=await teamQueue.shift(req.body.team)
        res.json(queue)
    })
}