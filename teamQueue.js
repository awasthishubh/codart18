TeamQueue=require('./models/TeamQueue');
var emitMem=require('./socket').brodcast

module.exports ={
    insert:function(team){
        return new Promise(async (resolve,reject)=>{
            try{
                data=await TeamQueue.findOne({})
                if(!data)
                    data=TeamQueue.create({})
                if(data.queue.indexOf(team)===-1)
                    data.queue.push(team)
                await data.save()
                resolve(data.queue)
            } catch(e){throw(e)}
        })
    },
    shift:function(io,socketTeam){
        return new Promise(async (resolve,reject)=>{
            try{
                data=await TeamQueue.findOne({})
                if(!data)
                    data=TeamQueue.create({})
                team=data.queue.shift()
                await data.save()
                if(io&&socketTeam[team])
                data.queue.forEach(team => {
                    emitMem(io,socketTeam[team],null,'updateQues')
                });
                resolve(team)
            } catch(e){throw(e)}
        })
    },
    getAll:function(team){
        return new Promise(async (resolve,reject)=>{
            try{
                data=await TeamQueue.findOne({})
                if(!data)
                    data=TeamQueue.create({})
                resolve(data.queue)
            } catch(e){throw(e)}
        })
    },
    getIndex:function(team){
        return new Promise(async (resolve,reject)=>{
            try{
                data=await TeamQueue.findOne({})
                if(!data)
                    data=TeamQueue.create({})
                resolve(data.queue.indexOf(team))
            } catch(e){throw(e)}
        })
    },
    
}