const multer = require('multer');
const path = require('path');
const fs = require('fs');

var uploadLoc=path.join(__dirname,'../files/uploads')
var upload = multer({ dest: uploadLoc })

module.exports=function(app){
    app.post('/submit', upload.single('file') ,function(req,res){
        //###########--Validates--################
        allowedLang={
            "python2": 7,
            "python3": 9,
            "c": 11,
            "cpp":16
        }
        lang=allowedLang[req.body.lang]
        team=req.body.team;
        number=req.body.number;
        
        if(!number || !lang || !req.file) 
            return res.status(400).json({Message:"Incomplete Request."})

        //###########--Set Files--################

        orgName=req.file.originalname.split('.')
        filename=`${team}_${number}_${(new Date).getTime()}.${orgName[orgName.length-1]}`

        fileLoc=path.join(__dirname,'../files/attempts',filename)
        try{
            fs.renameSync(path.join(__dirname,'../files/uploads',req.file.filename),fileLoc)
        } catch(e){
            console.log(e);
            return res.status(500).json({"Message":"Unable to read loacation"})
        }
        //##########################################

        console.log({team,number})
        //######---DB---############
        Test=['1/V1.txt','1/V2.txt','1/T3.txt','1/T4.txt','1/T5.txt']
        outputDB=['1','1','4','3','1']
        //##############

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

        const boxExec = require('box-exec')();
        boxExec.on("output",()=>{
            for(key in boxExec.output){
                result.push({
                    case:parseInt(key.slice(-5,-4)),
                    sucess:boxExec.output[key].output===output[key],
                    visible:key[key.length-6]=='V',
                    output:key[key.length-6]=='V'?boxExec.output[key].output:null,
                    expectedOutput:key[key.length-6]=='V'?output[key]:null
                })
            }
            result.sort((a,b)=>{
                if(a.case < b.case) return -1;
                if(a.case > b.case) return 1;
                return 0;
            })
            console.log(result)
            res.send(boxExec.output)
        });
        boxExec.on("formatError", (err)=>{
            console.log(err);
        });
        boxExec.on("error",()=>{
            console.log(boxExec.errortext)
        });
        boxExec.on("success",()=>{
            boxExec.execute();
        });
        boxExec.setData("9",fileLoc,TestCase);
    })
}