const db = require("../config/db");

exports.getContacts = (req,res)=>{

 db.query("SELECT * FROM contacts",(err,result)=>{
   res.json(result);
 });

};

exports.createContact = (req,res)=>{

 const {name,phone,email,category} = req.body;

 db.query(
  "INSERT INTO contacts (name,phone,email,category) VALUES (?,?,?,?)",
  [name,phone,email,category],
  ()=> res.json("Contact added")
 );

};