require("dotenv/config");
// var secret = (process.env.SECRET_AB);
const express = require("express");

const ejs = require('ejs');
const bodyParser = require("body-parser")
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const app = express();


app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://0.0.0.0:27017/userdb",{usenewUrlParser:true});
// mongoose.set("useCreateIndex",true);
const userschema = mongoose.Schema({
email:String,
password:String
});
userschema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userschema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/",(req,res)=>{
    res.render("home.ejs")
})
app.get("/login", (req, res) => {
    res.render("login.ejs")
})
app.get("/register",(req,res)=>{
    res.render("register.ejs")
})
app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets.ejs")
    }
    else{
        res.redirect("/login")
    }
})

app.get("/logout", function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/");
        }
    });
   
})
app.post("/register",(req,res)=>{ 
User.register({
    username: req.body.username
},req.body.password, function(err,user){
    if(err){
        console.log(err);
        res.redirect("/register")
    }
    else{
        passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets")
        });
    }
})
    
})

app.post("/login",function(req,res){
const user = new User({
    username: req.body.username,
    password : req.body.password
});
req.login(user,function(err){
    if(err){
        console.log(err)
    }
    else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
        })
    }
})
})

app.listen(3000,()=>{
    console.log("running on port 3000")
})