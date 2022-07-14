const Transaction = require('../models/transaction')
const User = require('../models/user')

exports.create = function (req, res, next) {
  const transaction  = new Transaction({
    fromId: req.body.fromId,
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
          error: err
        });
        console.log(err)
      }).catch(err => {
        console.log(err)
      })
  })
}