require("dotenv/config");
const express = require("express");
const ejs = require('ejs');
const findOrCreate = require('mongoose-findorcreate')
const bodyParser = require("body-parser")
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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

mongoose.connect("mongodb://0.0.0.0:27017/userdb",{usenewUrlParser:true});

const userschema = mongoose.Schema({
email:String,
password:String,
googleId: String,
secret : String
});
userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);
const User = new mongoose.model("User",userschema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// this was for local .....for google:
passport.serializeUser(function(user,done){
    done(null,user.id)
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
       
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));




app.get("/",(req,res)=>{
    res.render("home.ejs")
})
app.get("/auth/google",
passport.authenticate('google',{scope: ['profile']}))

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get("/login", (req, res) => {
    res.render("login.ejs")
})
app.get("/register",(req,res)=>{
    res.render("register.ejs")
})
app.get("/secrets",function(req,res){
    User.find({"secret": {$ne: null}}).then(function(foundUsers){
        res.render("secrets", { userWithSecrets: foundUsers });      
        
    }).catch(function(err){
        console.log(err);
    })
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
app.get("/submit", function(req,res){
    if(req.isAuthenticated()){
        res.render("submit")
    }
    else{
        res.redirect("/login")
    }
})

app.post("/submit", function(req,res){
const submittedSecret = req.body.secret;
    User.findById(req.user)
        .then(foundUser => {
            if (foundUser) {
                foundUser.secret = req.body.secret;
                return foundUser.save();
            }
            return null;
        })
        .then(() => {
            res.redirect("/secrets");
        })
        .catch(err => {
            console.log(err);
        });
})

app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});
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