const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config();
const user = require('../models/user');
const User = require('../models/user')
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/check-auth')



let log = false;
let loggedUser = {};

// USER LOGIN
exports.login = function(req, res, next) {
  User.findOne({email: req.body.email})
  .then( user => {
    if (!user){
      return res.status(401).json({
        message: 'Email not recognized'
      });
    }
    // if (user.status !== 'verified'){
    //   console.log(user.status)
    //   return res.status(401).json({
    //     message: 'User Not Verified'
    //   });
    // }
    loggedUser = user
    return bcrypt.compare(req.body.password, user.password);
  })
  .then (result => {
    if(!result){
      return res.status(401).json({
        message: 'Password Does Not Match',
        badPwd: 'True'
      });
    }
    if (loggedUser.isVerified !== true){
      return res.status(401).json({
        message: 'User Not Verified. Please verify with the email link'
      });
    }
    const token = jwt.sign({email: loggedUser.email, userId: loggedUser._id},
      process.env.JWTPASSWORD,
      {expiresIn:'1h'})
    console.log(token)
    // console.log(loggedUser)
    res.status(200).json({
      token: token,
      expiresIn: 3600,
      status: 'verified',
      message: 'Logged in',
      user: loggedUser
    })
    log = true
    console.log('Logged in')
  })
  .catch(err => {
    console.log(err)
    return res.status(401).json({
      message: err,
    });
  })
}

// LOGIN MSG
exports.logaccess = function(req, res, next) {
  if (log){
    res.status(200).json({
      message: 'Logged in!'
    })
  }
}

// USER PROFILE DISPLAY
exports.profile = function(req, res, next){
  res.status(200).json({
    message: 'This is the user',
    username: loggedUser.username,
    email: loggedUser.email,
    _id: loggedUser._id
  })

}

exports.google = async function(req, res, next){
}

exports.logout = function(req, res, next){
  console.log("User logged out")
  res.status(200).json({
    message: 'User logged out'
  })
}

exports.users = function(req, res, next){
  User.find().then(documents => {
    res.status(200).json({
      message: "Users fetched successfully!",
      users: documents
    });
  }).catch(err => {
    res.status(500).json({
      CaughtError: err
    })
  });
};

