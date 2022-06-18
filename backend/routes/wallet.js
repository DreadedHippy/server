const { result } = require('lodash');
const wallet = require('../models/wallet');
const Wallet = require('../models/wallet')
const User = require('../models/user')


exports.create = function(req, res, next) {
  User.findOne({email: req.body.email})
  .then(user => {
    const wallet = new Wallet({
      name: req.body.name,
      address: req.body.address,
      currency: req.body.currency,
      iconSrc: req.body.iconSrc,
      balance: req.body.balance,
      transactions: [],  
    })
    if (!user){
      return res.status(401).json({
        message: 'Internal email mismatch problem'
      });
    };
    if (!user.wallets){
      user.wallets =[]
    }
    user.wallets.push(wallet)
    user.save()
    console.log(user)
    return res.status(200).json({
      message: 'Wallet Added',
      wallet: wallet
    })
  })
}