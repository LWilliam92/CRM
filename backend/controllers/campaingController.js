const db = require("../config/db");

exports.createCampaign = (req,res)=>{

 const {name,type,message,recipients} = req.body;

 db.query(
  "INSERT INTO campaigns (name,type,message,recipients,status) VALUES (?,?,?,?,?)",
  [name,type,message,recipients,"Completed"],
  ()=> res.json("Campaign created")
 );

};

exports.getCampaigns = (req,res)=>{

 db.query("SELECT * FROM campaigns",(err,result)=>{
   res.json(result);
 });

};