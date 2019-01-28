const Ques=require('../models/Question')
const Score=require('../models/Score')
const User=require('../models/Users')

module.exports=function(app){
    app.post('/assign',async function(req,res){
        var {level,team}=req.body
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
                score=await Score.create({qid:ques[0].id,team})
                return res.json(ques[0])
            } catch(e){
                console.error(e)
                return res.json(ques[0])
            }
           

            
        })
    })
}