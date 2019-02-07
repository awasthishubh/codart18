
var jwt=require('jsonwebtoken')
module.exports={
    brodcast:function(io,sockets,id,msg){
        if(!sockets) return
        sockets.forEach(element => {
            if(element!=id){
                io.to(element).emit(msg)
            }
        });
    },
    onFunc:function(io,socketTeam){
        io.on('connection',(socket)=>{
            socket.on('connectMe',function(data){
                console.log(process.env.SECRET)
                jwt.verify(data, process.env.SECRET, function(err, decoded) {
                    try{ 
                        if (err) throw err;
                        if(socketTeam[decoded.team] && socketTeam[decoded.team].length>0){
                            socketTeam[decoded.team].push(socket.id)
                        } else{
                            socketTeam[decoded.team]=[socket.id]
                        }
                        socket.verified=true
                        socket.team=decoded.team
                    } catch(e){console.log(e);socket.disconnect()}
                })
            })
            socket.on('disconnect',()=>{
                if(socket.verified){
                    socketTeam[socket.team].splice(socketTeam[socket.team].indexOf(socket.team),1)
                }
            })
            socket.on('printLobby',()=>{
                console.log(JSON.stringify(socketTeam,null,4))
            })
        })
    }
}