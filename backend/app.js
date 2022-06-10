const express = require('express');
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require("mongoose");
const User = require('./models/user');
const checkAuth = require('./middleware/check-auth')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const nml = require('nodemailer');
const mailer = require('./mailer');
const user = require('./models/user');
const dotenv = require('dotenv').config();
const signup = require('./routes/signup')
const login = require('./routes/login')
const passwordreset = require('./routes/passwordreset')
// const multer = require('multer')
// const io = require('socket.io')(http);
// const { buildSchema } = require('graphql');
// const  { composeMongoose } = require('graphql-compose-mongoose');
// const { schemaComposer } = require('graphql-compose');




const http = require('http').createServer(express);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


// MONGOOSE CONNECTION
mongoose
  .connect( process.env.MONGO_DB_URI_2, {useNewUrlParser: true, useUnifiedTopology: true,})
  .then(() => {
    console.log("Connected to database!");
  })
  .catch((err) => {
    console.log(err);
  });


  // USER SIGNUP
app.post('/api/users/signup', signup.signup);

// VERIFICATION CHECK
app.get('/api/users/verify', signup.verify);

// PASSWORD CHANGE REQUEST
app.post('/api/users/passresetrequest', passwordreset.passwordresetrequest)

// PASSWORD RESET
app.post('/api/users/passreset', passwordreset.passwordreset)

// Signup Confirmation
app.get('/api/users/signup',signup.signupmsg)


app.get('/api/users/list', checkAuth, login.users);

// USER LOGIN
let log = false
let loggedUser = {};
app.post('/api/users/login', login.login)


// Login Confirmation
app.get('/api/users/login', login.logaccess);


//  CURRENT USER PROFILE DISPLAY
app.get('/api/currentuser',checkAuth, login.profile);

// USERNAME MODIFICATION
app.post('/api/users/usermod', (req, res, next) => {
  loggedUser.username = req.body.username,
  console.log(req.body)
  loggedUser
    .save()
    .then(result => {
      res.status(201).json({
        message: "User modified!",
        result: result
      });
    })
})

module.exports = app

// SET STORAGE
// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now())
//   }
// })



// ADD FRIEND
let fetchedfriend
app.post('/api/users/friendadd', (req, res, next) => {
  console.log('Fetched User', loggedUser)
  User.findOne({username: req.body.username})
  .then( user => {
    if (!user){
      return res.status(401).json({
        message: 'Username not recognized'
      });
    };
    fetchedfriend = user
    if (!user.friends){
      user.friends =[]
    }
    if (!loggedUser.friends){
      loggedUser.friends =[]
    }
    user.friends.push(loggedUser._id)
    loggedUser.friends.push(fetchedfriend._id)
    user.save()
    loggedUser.save()
    return res.status(200).json({
      message: 'Friend Added',
      friend: user.username
    })
  })
})

