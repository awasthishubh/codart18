const jwt = require("jsonwebtoken");
const User = require("./models/Users");

user = (req, res, next)=>{
    let authHeader = req.get("Authorization") || "";
    let split = authHeader.split(" ");

    if(split.length>1) token=split[1]
    else token=split[0]

    if(!authHeader || !token){
        token=req.query.token
        if(!token) return res.status(406).json({err:"Invalid authorization header"});
    }
    jwt.verify(token, process.env.SECRET, function(err, decoded) {
        if(err){
            return res.status(401).json({err:"Invalid token"});
        }
        console.log(decoded)
        if(!decoded.team) return res.status(401).json({err:"Team not found"});
        User.findOne({team:decoded.team},function(err,doc){
            if(!doc){
                return res.status(401).json({err:"Not allowed for round 2"});
            }
            console.log(decoded.team)
            req.body.team = decoded.team;
            next();
        })
    });
}

admin=function(req,res, next){
    // return next()
    let authHeader = req.get("Authorization") || "";
    let split = authHeader.split(" ");

    if(split.length>1) token=split[1]
    else token=split[0]

    if(!authHeader || !token){
        token=req.body.token || req.cookies.token
        if(!token) return res.status(406).json({err:"Invalid authorization header"});
    }
    jwt.verify(token, process.env.SECRET, function(err, decoded) {
        if(err){
            console.log(err)
            return res.status(401).json({err:"Invalid token"});
        }
        console.log(1111)
        if(decoded.type!=='admin') return res.status(401).json({err:"Not an admin"});
        else next();
    })
}

module.exports={user,admin}