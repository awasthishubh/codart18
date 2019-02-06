const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Ques=require('../models/Question')
const Attempts=require('../models/Attempts')
const Score=require('../models/Score')
const userPolicy=require('../policy').user

var uploadLoc=path.join(__dirname,'../files/uploads')
var upload = multer({ dest: uploadLoc })

module.exports=function(app){
    app.post('/submit', upload.single('file'),userPolicy ,async function(req,res){
        //###########--Validates--################
        allowedLang={
            "python2": 7,
            "python3": 9,
            "c": 11,
            "cpp":16,
            "java8":25
        }   
        lang=allowedLang[req.body.lang]
        var {team}=req.body;
        if(!lang || !req.file) 
            return res.status(400).json({Message:"Incomplete Request."})

        qid=(await Score.findOne({team:req.body.team,allowed:true})).qid
        if(!qid) return res.status(404).json({err:'No Question Assigned'})

        ques=await Ques.findOne({id:qid,assignedTo:team})
        if(!ques)
            return res.status(404).json({err:'Question not found/assigned'})

        //###########--Set Files--################
        team_=team.split(' ').join('_')

        orgName=req.file.originalname.split('.')
        filename=`${team_}_${qid}_${(new Date).getTime()}.${orgName[orgName.length-1]}`

        folder=path.join(__dirname,'../files/attempts/',team_)
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }

        fileLoc=path.join(folder,filename)

        try{
            fs.renameSync(path.join(__dirname,'../files/uploads',req.file.filename),fileLoc)
        } catch(e){
            console.log(e);
            return res.status(500).json({"Message":"Unable to read loacation"})
        }
        //##########################################

        console.log({team,qid})
        //######---DB---############
        Test=ques.testCase
        outputDB=ques.output
        // Test=['1/V1.txt','1/V2.txt','1/T3.txt','1/T4.txt','1/T5.txt']
        // outputDB=['1','1','4','3','1']
        //##############
        points=0
        result=[]
        resultDB=[]
        TestCase=[]
        done=false

        marking=[10,15,20,25,30]
        output=[]
        Test.forEach((f,i)=> {
            file=path.join(__dirname,'../files/problems',f)
            TestCase.push({
                file,
                timeout: 2
            })
            output[file]=outputDB[i]
        });

        const boxExec = require('box-exec')();
        boxExec.on("output",async ()=>{
            for(key in boxExec.output){
                visible=['1','2'].includes(key[key.length-5])
                result.push({
                    case:parseInt(key.slice(-5,-4)),
                    sucess:boxExec.output[key].output===output[key],
                    visible,
                    error:boxExec.output[key].error,
                    testCase:visible?fs.readFileSync(key,"utf8").trim():null,
                    output:visible?boxExec.output[key].output:null,
                    expectedOutput:visible?output[key]:null
                })
                resultDB.push(boxExec.output[key].output===output[key])
                if(boxExec.output[key].output===output[key]&&!visible)
                    points+=marking[parseInt(key[key.length-5])-3];
            }
            result.sort((a,b)=>{
                if(a.case < b.case) return -1;
                if(a.case > b.case) return 1;
                return 0;
            })
            console.log('creating log...')
            Attempts.create({
                    qid,team,
                    time:new Date,
                    cases:resultDB,
                    score:points,
                    download:path.join('download',team_,filename)
                }, (e)=>{
                    console.log('log created',{err:e})
                })

            Score.findOne({qid,team},async (err,doc)=>{
                if(err) return res.status(500).json({err:'db err'})
                if(!doc)
                    await Score.create({qid,team, cases:resultDB, score:points})
                else if(doc.score<points){
                    doc.cases=resultDB
                    doc.score=points
                    doc.save()
                }
                res.json({points,done:points==100?true:false,result})
            })
        });

        boxExec.on("formatError", (err)=>{
            console.log(err);
            res.status(400).json({err})
        });
        boxExec.on("error",()=>{
            console.log(12345, boxExec.errortext)
            console.log(0000,String(boxExec.errortext))
            res.status(400).json({err:String(boxExec.errortext)})
        });
        boxExec.on("success",()=>{
            boxExec.execute();
        });
        boxExec.setData(lang,fileLoc,TestCase);
    })
}