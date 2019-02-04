const mongoose = require("mongoose");
const Ques=require('./models/Question')
const fs=require('fs')
const path=require('path')

require('dotenv').config()
mongoose.connect(process.env.DB,{useNewUrlParser: true},(err,db)=>{
    ['hard','easy','medium'].forEach(level=>{
        dPath=path.join(__dirname,'files','problems',level)
        fs.readdirSync(dPath).forEach(folder=>{
            qPath=path.join(dPath,folder)
            if(folder=='0') return
            output=[]; test=[];
            for(let i=1;i<=7;i++){
                test.push(path.join(level,folder,`T${i}.txt`))
                output.push(fs.readFileSync(path.join(qPath,`O${i}.txt`),"utf8").trim())
            }

            statement=fs.readFileSync(path.join(qPath,'statement.txt'),"utf8").trim()
            title=statement.split('\n')[0]
            descr=statement.split('\n').splice(1).join('\n')
            // Ques.deleteMany({}, (err)=>{
            //     if(err) throw err
                
            Ques.updateOne(
                {id:level[0]+folder},
                {
                    id:level[0]+folder,
                    level,
                    descr, title,
                    testCase:test,
                    output:output
                },
                {upsert:true,setDefaultsOnInsert: true},
                (err)=>{
                    if(err) throw err
                    db.close()
                }
            )
        })
    })
   
})