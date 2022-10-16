const { rest } = require('lodash')
const Transaction = require('../models/transaction')
const User = require('../models/user');
const Wallet = require('../models/wallet');
const Funding = require('../models/fundingWallet');


exports.create = function (req, res, next) {
  const transaction  = new Transaction({
    fromId: req.body.fromId,
    fromEmail: req.body.email,
    fromName: req.body.fromName,
    fromAddress: req.body.fromAddress.trim(),
    toAddress: req.body.toAddress.trim(),
    amount: req.body.amount,
    currency: req.body.currency,
    date: req.body.date,
    type: req.body.type,
    status: 'pending',
    remark: req.body.remark
  })
  User.findOne(
    {wallets: { $elemMatch: {address: transaction.toAddress, currency: transaction.currency}}}
  ).then(user => {
    // console.log(user, "\x1b[36m", 'User')
    if(!user){
      User.updateOne(
        {email: req.body.email, 'wallets.address': transaction.fromAddress},
        {$inc: {"wallets.$.balance": -transaction.amount}}
      ).then(
        res.status(200).json({
          message: 'Transaction pending, waiting approval'
        })        
      )
      return
    }
    User.updateOne(
      {email: req.body.email, 'wallets.address': transaction.fromAddress},
      {$inc: {"wallets.$.balance": -transaction.amount}}
    ).then(result => {
      User.updateOne(
        {email: user.email, 'wallets.address': transaction.toAddress},
        {$inc: {"wallets.$.balance": parseInt(transaction.amount)}}
      ).then(result=> {console.log(result, ' <-- Result')}).catch(err => {console.log(err, 'Error')})
      transaction
      .save()
      .then(result => {
        res.status(200).json({
          message: 'Transaction processed, awaiting approval...',
          id: transaction._id,
        })
      })
      .catch(err => {
        res.status(500).json({
          message: 'An error occurred, please try again later',
          error: err
        });
        console.log(err)
      })
    })
  }).catch(err => {
    console.log('Unable to fetch user with such wallet!', err)
    res.status(500).json({message: 'No user with such wallet', err})
    return
  })

}

//GET TRANSACTIONS
exports.transactions = function(req, res, next){
  const email = req.query.email
  Transaction.find({email: email})
  .then(result => {
    res.status(200).json({
      message: 'Retrieved transactions!',
      transactions: result
    })
  }).catch(err => {
    console.log('err', err)
  })
}

//GET DEPOSITS
exports.deposits = function(req, res, next){
  const email = req.query.email //Get user email
  let wallets = []
  User.findOne({ //Get user information
    email: email
  }).then(user => {    
    wallets = user.wallets.map(wallet => wallet.address) //Assign all user wallets to a variable 'wallets
    Transaction.find({
      toAddress: { $in: wallets}
    }).then(deposits => {
      res.status(200).json({
        message: 'Retrieved deposits!',
        deposits: deposits //Send the deposits as response
      })
    }).catch(err => {
      console.log('Error', err)
    })
  }).catch(err => {
    console.log('err', err)
  })
}

exports.funding = function(req, res, next){
  let transactionInfo = req.body.transaction; //TransactionInfo gotten from website
  console.log(transactionInfo);

  const email = req.body.email; //User Email
  const currency = req.body.currency; //Currency of wallet
  const amount = req.body.amount; //Amount transferred

  const transaction  = new Transaction({
    fromId: transactionInfo.fromId,
    fromEmail: email,
    fromName: transactionInfo.fromName.trim() + ' spot wallet',
    fromAddress: transactionInfo.fromAddress.trim(),
    toAddress: 'fundingWallet',
    amount: amount,
    currency: currency,
    date: transactionInfo.date,
    type: 'funding',
    status: 'confirmed',
    remark: transactionInfo.remark
  })



  //Funding Wallet functions
  User.findOne({
    'email': email
  }).then( user => {
    let userWallets = user.wallets
    function isWallet(wallet){ //Check if the funding wallet already exists
      if(wallet.currency == currency && wallet.type == 'funding'){
        return true
      }
      return false
    }
    let filteredWallet = userWallets.filter(isWallet)[0] //Get wallet if existing

    console.log(filteredWallet)

    if(filteredWallet){
      User.updateOne(
        {email: email, 'wallets.address': transaction.fromAddress},
        {$inc: {"wallets.$.balance": -amount}}
      ).then(
        User.updateOne(
          {email: email, 'wallets.type': 'funding', 'wallets.currency': currency},
          {$inc: {"wallets.$.balance": amount}, $push: {"wallets.$.transactions": transaction}}
        ).then(
          res.status(200).json({
            message: 'Funding received'
          })
        )
      ).catch (err => {
        res.status(201).json({
          message: 'An Error Occured'
        })
      })
      return
    }
    if(!filteredWallet){
      const fundingWallet = new Funding({
        name: currency.toUpperCase() + ' funding wallet',
        currency: currency,
        address: user.username+currency.toUpperCase()+'FundingWallet',
        iconSrc: '',
        balance: amount,
        transactions: [transaction],
        type: 'funding',
      })
      User.updateOne(
        {email: email, 'wallets.address': {$ne: fundingWallet.address}},
        {$push: {wallets: fundingWallet}}
      ).then(
        User.updateOne(
          {email: email, 'wallets.address': transaction.fromAddress},
          {$inc: {"wallets.$.balance": -amount}}
        ).then(
          res.status(200).json({
            message: 'Funding wallet created and funding received'
          })
        )
      )
      console.log(fundingWallet);
    }
  })

}