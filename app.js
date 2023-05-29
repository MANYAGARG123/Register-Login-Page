require("dotenv/config");
var secret = (process.env.SECRET_AB);
const express = require("express")

const app = express()
const ejs = require('ejs')
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption")

mongoose.connect("mongodb://0.0.0.0:27017/userdb",{usenewUrlParser:true})
const userschema = mongoose.Schema({
email:String,
password:String
})
userschema.plugin(encrypt, { secret: secret, encryptedFields: ["password"]})

const User = new mongoose.model("users",userschema);
app.use(express.static('public'))
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}))

app.get("/",(req,res)=>{
    res.render("home.ejs")
})
app.get("/login", (req, res) => {
    res.render("login.ejs")
})
app.get("/register",(req,res)=>{
    res.render("register.ejs")
})

app.post("/register",(req,res)=>{
    const newUser= new User({
        email:req.body.username,
        password:req.body.password
    })
newUser.save().then(function(err){
   
        res.render("secrets.ejs")
    
})

    
})

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email:username}).then(function(foundUser){
        
            if(foundUser.password===password){
                res.render("secrets.ejs")
            }
        
    })
})

app.listen(3000,()=>{
    console.log("running on port 3000")
})