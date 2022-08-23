const { result } = require('lodash');
const Wallet = require('../models/wallet')
const User = require('../models/user');
const { response } = require('express');


exports.create = function(req, res, next) {
  const wallet = new Wallet({
    name: req.body.name,
    address: req.body.address,
    currency: req.body.currency,
    iconSrc: req.body.iconSrc,
    balance: req.body.balance,
    transactions: [],  
  })
  User.updateOne(
    {email: req.body.email, 'wallets.address': {$ne: wallet.address}},
    {$push: {wallets: wallet}}
  )
  .then(result => {
    console.log(result)
    if(result.modifiedCount == 0){
      return res.status(400).json({
        message: 'Wallet Already added',
        result: result
      })
    }
    if(result.modifiedCount !== 0){
      return res.status(200).json({
        message: 'Wallet Saved',
        result: result,
        wallet: wallet
      })
    }
  }).catch(err =>{
    console.log(err)
    return res.status(500).json({
      err: err
    })  
  })

}

exports.wallets = function(req, res, next){  // GET WALLETS
  const email = req.query.email
  User.findOne({email: email})
  .then(user => {
    return res.status(200).json({
      message: 'Wallets fetched!',
      wallets: user.wallets      
    })
  }).catch( err => {
    console.log(err);
    return res.status(400).json({
      message: 'Error!',
      error: err
    })
  })
}
