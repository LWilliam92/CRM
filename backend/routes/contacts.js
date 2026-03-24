const router = require("express").Router()
const db = require("../config/db")

// GET contacts
router.get("/", (req,res)=>{
  db.query("SELECT * FROM contacts",(err,result)=>{
    if(err) throw err
    res.json(result.rows)
  })
})

// CREATE contact
router.post("/",(req,res)=>{
  const {name,phone,email,category} = req.body
  db.query(
    "INSERT INTO contacts (name,phone,email,category) VALUES ($1,$2,$3,$4)",
    [name,phone,email,category],
    (err,result)=>{
      if(err) throw err
      res.json({message:"Contact created"})
    }
  )
})

module.exports = router