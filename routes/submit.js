const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Ques=require('../models/Question')

var uploadLoc=path.join(__dirname,'../files/uploads')
var upload = multer({ dest: uploadLoc })

module.exports=function(app){
    app.post('/submit', upload.single('file') ,async function(req,res){
        //###########--Validates--################
        allowedLang={
            "python2": 7,
            "python3": 9,
            "c": 11,
            "cpp":16
        }
        lang=allowedLang[req.body.lang]
        var {qid,team}=req.body;
        
        if(!qid || !lang || !req.file) 
            return res.status(400).json({Message:"Incomplete Request."})

        ques=await Ques.findOne({id:qid,assignedTo:team})
        if(!ques)
            return res.status(404).json({err:'Question not found/assigned'})
        //###########--Set Files--################

        orgName=req.file.originalname.split('.')
        filename=`${team}_${qid}_${(new Date).getTime()}.${orgName[orgName.length-1]}`

        fileLoc=path.join(__dirname,'../files/attempts',filename)
        fileLoc=fileLoc.replace(' ','_')
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
        TestCase=[]
        output=[]
        Test.forEach((f,i)=> {
            file=path.join(__dirname,'../files/problems',f)
            TestCase.push({
                file,
                timeout: 2
            })
            output[file]=outputDB[i]
        });
        console.log(output,TestCase)

        const boxExec = require('box-exec')();
        boxExec.on("output",()=>{
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
                if(boxExec.output[key].output===output[key]&&!visible)
                    points+=5;
            }
            result.sort((a,b)=>{
                if(a.case < b.case) return -1;
                if(a.case > b.case) return 1;
                return 0;
            })
            console.log(result)
            res.json({result,points})
        });
        boxExec.on("formatError", (err)=>{
            console.log(err);
            res.status(400).json({err})
        });
        boxExec.on("error",()=>{
            console.log(111, boxExec.errortext)
            res.status(400).json({err:boxExec.errortext})
        });
        boxExec.on("success",()=>{
            boxExec.execute();
        });
        boxExec.setData(lang,fileLoc,TestCase);
    })
}