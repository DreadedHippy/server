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
const passwordreset = require('./routes/passwordreset');
const wallet = require('./routes/wallet');
const transaction = require('./routes/transaction');
const peer = require('./routes/p2p')
const paymentMethod = require('./routes/paymentMethod')
const fileUpload = require('express-fileupload')
const path = require('path')
const fs = require('fs')




const http = require('http').createServer(express);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(fileUpload({createParentPath: true,}));

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
    console.log("Unable to connect to mongo database", err);
  });

// USER SIGNUP
app.post('/api/users/signup', signup.signup);

// VERIFICATION CHECK
app.get('/api/users/verify', signup.verify);

// PASSWORD CHANGE REQUEST
app.post('/api/users/passresetrequest', passwordreset.passwordresetrequest)

// PASSWORD RESET
app.post('/api/users/passreset', passwordreset.passwordreset)

// SIGNUP CONFIRMATION
app.get('/api/users/signup',signup.signupmsg)

// GET LIST OF USERS
app.get('/api/users/list', checkAuth, login.users);

// USER LOGIN
let log = false
let loggedUser = {};
app.post('/api/users/login', login.login)
app.get('/api/users/logout', login.logout);


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

// CREATE WALLET
app.post('/api/wallets/create', checkAuth, wallet.create)

app.use(express.static('backend/files'))

// GET WALLETS
app.get('/api/wallets',checkAuth, wallet.wallets)

// MAKE TRANSACTION
app.post('/api/transactions/create', checkAuth, transaction.create)

//GET TRANSACTIONS
app.get('/api/transactions',checkAuth, transaction.transactions)

//GET DEPOSITS
app.get('/api/transactions/deposits', checkAuth, transaction.deposits)

// MAKE P2P OFFER
app.post('/api/peer/create', checkAuth, peer.create)

//GET P2P OFFERS
app.get('/api/peer/offers', checkAuth, peer.offers)

//MAKE P2P TRADE
app.post('/api/peer/trade', checkAuth, peer.trade);

// ADD PAYMENT METHOD
app.post('/api/paymentMethods/new', checkAuth, paymentMethod.add)

// GET PAYMENT METHODS
app.get('/api/paymentMethods', checkAuth, paymentMethod.methods);

// DELETE PAYMENT METHODS
app.post('/api/paymentMethods/delete', checkAuth, paymentMethod.delete)

// CUSTOMER CONFIRM ORDER
app.patch('/api/peer/:id', checkAuth, peer.customerConfirm)

// GET PENDING OFFERS
app.get('/api/peer/pending', checkAuth, peer.pending)

module.exports = app



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

// UPLOAD PROFILE PIC
app.post("/api/upload", checkAuth, (req, res) => {
  if (!req.files) {
    console.log('No files!');
    return res.status(400).json({
      message: "No files were uploaded."
    });
  }
  const file = req.files.image;
  console.log(file)
  const extensionName = path.extname(file.name); // fetch the file extension
  const allowedExtension = ['.png','.jpg','.jpeg']; // declare allowed extensions
  
  if(!allowedExtension.includes(extensionName)){
    return res.status(422).json({
      message: "Invalid Image file. Please select an image"
    });
  }
  const folderPath = __dirname + "/files/" + file.name; //Define file storage path and name.


  file.mv(folderPath, (err) => {
    //GET FILE NAME WITHOUT EXTENSION(USER EMAIL)
      let last_dot = file.name.lastIndexOf('.')
      let userEmail = file.name.slice(0, last_dot)
    ;
    if (err) {
      return res.status(500).json({
        error: err
      });
    }
    User.findOne({email: userEmail}).then(user => { //Store Image Src In Database
      if(!user){
        res.status(401).json({
          message: 'An unexpected error has occurred, try logging in.'
        });
      }
      let fileName = file.name
      User.updateOne({email: userEmail}, {$set: {imageSrc: fileName}})
      .then( result => {
        console.log('Profile pic updated')
        return res.status(200).json({
          message: "Profile pic successfully uploaded",
          path: folderPath 
        })
      }).catch(err => {
        console.log('Error', err)
      })
    });
  });
});

//GET PROFILE PIC
app.get('/api/upload', checkAuth, (req, res, next) => {
  let email = req.query.email
  User.findOne({email: email}).then(user => {
    if(!user){
      return res.status(401).json({
        message:"An unexpected error has occurred, try logging in."
      })
    }
    return res.status(200).json({
      message: "Here's the pic",
      picture: user.imageSrc
    })
  })
})

