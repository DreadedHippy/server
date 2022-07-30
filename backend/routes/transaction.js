const Transaction = require('../models/transaction')
const User = require('../models/user')

exports.create = function (req, res, next) {
  const transaction  = new Transaction({
    fromId: req.body.fromId,
    fromEmail: req.body.email,
    fromName: req.body.fromName,
    fromAddress: req.body.fromAddress,
    toAddress: req.body.toAddress,
    amount: req.body.amount,
    currency: req.body.currency,
    date: req.body.date,
    type: req.body.type,
    status: 'pending',
    remark: req.body.remark
  })
  User.updateOne(
    {email: req.body.email, 'wallets.address': transaction.fromAddress},
    {$inc: {"wallets.$.balance": -transaction.amount}}
  ).then(result => {
    transaction
      .save()
      .then(result => {
        res.status(200).json({
          message: 'Transaction processed, awaiting approval...',
          id: transaction._id,
        })
        console.log(result)
      })
      .catch(err => {
        res.status(500).json({
          message: 'An error occurred, please try again later',
          error: err
        });
        console.log(err)
      }).catch(err => {
        console.log(err)
      })
  })
  User.findOne(
    {$and : [{'wallets.address': transaction.toAddress}, {'wallets.currency': transaction.currency}]}
  ).then(user => {
    if(!user){
      return res.status(401).json({message: 'No user with such wallet'})
    }
    User.updateOne(
      {email: user.email, 'wallets.address': transaction.toAddress},
      {$inc: {"wallets.$.balance": parseInt(transaction.amount)}}
    ).then(result => {console.log('Result', result)})
  }).catch(err => {
    console.log('Unable to fetch user with such wallet!', err)
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