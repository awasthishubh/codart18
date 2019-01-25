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
        const boxExec = require("box-exec")();
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

        result=[]

        boxExec.on("success",(data)=>{
            console.log("success")
            boxExec.execute();
        });
        boxExec.on("error",()=>{
            var err=true;
            console.log("error")
            console.log(typeof boxExec.errortext);
            console.log(boxExec.errortext);
            return res.status(400).json({err,Message:boxExec.errortext})
        });
        boxExec.on("output",()=>{
            console.log('output')
            var err=false,result=[],points=0
            res.json({output:boxExec.output});
            // doc.testcases.forEach(function(testcase,i){
            //     console.log(i,boxExec.output[testcase].output,doc.output[i])
            //     if(boxExec.output[testcase].output.trim()==doc.output[i].trim()){
            //         result.push(true);points++
            //     } else{result.push(false)}
            // })
        });
        boxExec.on("fileError",(err)=>{
            console.log("fileError")
            console.log(err);
        });
        boxExec.on("langKeyError",(err)=>{
            console.log("langKeyError")
            console.log(err);
        });
        boxExec.setData(lang,fileLoc,'123');
    })
}