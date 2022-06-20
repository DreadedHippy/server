const { result } = require('lodash');
const wallet = require('../models/wallet');
const Wallet = require('../models/wallet')
const User = require('../models/user');
const user = require('../models/user');
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
        message: 'Wallet Aaready added',
        result: result
      })
    }
    if(result.modifiedCount !== 0){
      return res.status(200).json({
        message: 'Wallet Saved',
        wallet: result
      })
    }
  }).catch(err =>{
    console.log(err)
    return res.status(500).json({
      err: err
    })  
  })

}
