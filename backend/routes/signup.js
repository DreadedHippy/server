const jwt = require('jsonwebtoken');
const User = require('../models/user')
const bcrypt = require('bcrypt')
const dotenv = require('dotenv').config();
const user = require('../models/user');
const nml = require('nodemailer');


let reg = false
let newman = false
var mail = "email.mail"
let token = ""
let status =  "pending"

// USER SIGNUP
exports.signup = function(req, res, next) {
  const verifyToken = jwt.sign(
    {
      email: req.body.email,
      name: req.body.name,
    },
    process.env.JWTPASSWORD,
    { expiresIn: 2000 * 60 } // 2 mins
  );
  bcrypt.hash(req.body.password, 10).then(hash => {
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hash,
      friends: req.body.friends,
      verifyToken: verifyToken,
      peerOffers: []
    });
    reg = true
    newman = true
    mail = user.email
    token = verifyToken
    status = 'pending'
    user
      .save()
      .then(result => {
        validation();
        res.status(201).json({
          email: user.email,
          message: "User created! Please Verify with E-mail Link.",
          status: 'pending',
          result: result
        });
        console.log(token);
      })
      .catch(err => {
        res.status(500).json({
          error: err,
          message: err.message
        });
      });
  });
}

// Email Verification
let verifLink = ""

function validation(){
  try {
    if (newman)
    verifLink = "http://localhost:8100/verification?key="+ token
    let transporter = nml.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAILNAME,
      pass: process.env.MAILPASS
    }
    });

    var mailOptions = {
      from: 'aizon.mailer@gmail.com',
      to: mail,
      subject: 'Email Verification for Aizon inc.',
      html: '<h3>This email has signed up for Ono Trade</h3><br>'
        + '<p>Verifiy your Email <a href='+ verifLink + ' target="_blank">Here</a></p>'
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
        state = "verified"
        return 'Sent'
      }
    });
  }

  catch (err) {
    console.log({message: 'verify error '+ err})
  }
}

// SIGNUP CONFIRMATION
exports.signupmsg = function(req, res, next) {
  if (reg){
    res.status(200).json({
      message: 'User created! Please verify with E-mail link.'
    })
  }
}

// VERIFICATION CHECK
exports.verify = function(req, res, next) {
  const key = req.query.key;
  User.findOne({verifyToken: key})
  .then(user => {
    if(!user){
      res.status(401).json({
        message: 'This user is not recognized'
      })
    }
    User.findByIdAndUpdate(user._id, {isVerified: 'true'})
    .then( result => {
      res.status(200).json({
        message: 'Your email has been verified',
        status: 'verified'
      })
    })
  })
}
