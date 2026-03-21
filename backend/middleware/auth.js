const jwt = require("jsonwebtoken");

module.exports = function(req,res,next){

 const token = req.headers["authorization"];

 if(!token) return res.status(401).json("Access denied");

 try{
   const verified = jwt.verify(token,"crmsecret");
   req.user = verified;
   next();
 }catch(err){
   res.status(400).json("Invalid token");
 }

}