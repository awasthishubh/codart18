const Ques=require('../models/Question')
const User=require('../models/Users')
const Score=require('../models/Score')
const adminPolicy=require('../policy').admin
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
                console.log({sucess:true, msg:ques[0].id+' assigned to '+team})
                return res.json({sucess:true, msg:ques[0].id+' assigned to '+team})
            } catch(e){
                console.error(e)
                return res.json(ques[0])
            }
        })
    })

    app.get('/assign', adminPolicy, function(req,res){
        Ques.find({},'id assignedTo', (err,data)=>{
            if(err) return res.status(500).json({err:'db err', hint:'assign, ques'})
            team={}
            data.forEach(el => {
                el.assignedTo.forEach(tm=>{
                    if(!team[tm])
                        team[tm]=[el.id]
                    else team[tm].push(el.id)
                })
            });
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
        res.json({message:'unassigned'})
    })
}