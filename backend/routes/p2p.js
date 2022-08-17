const PeerOffer = require ('../models/p2p');
const User = require('../models/user')

exports.create = function(req, res, next){
  let email = req.body.email
  const peerOffer = new PeerOffer({
    name: req.body.name,
    timeLimit: req.body.timeLimit,
    type: req.body.type,
    price: req.body.price,
    fiatCurr: req.body.fiatCurr, //Bank Currency accepted by the Peer offering the crypto
    inStock: req.body.inStock, //Amount of crypto left in stock
    cryptoCurr: req.body.cryptoCurr, //The Cryptocurrency being offered
    upperLimit: req.body.upperLimit, //Maximum amount of crypto that can be bought at a time
    lowerLimit: req.body.lowerLimit, //Minimum amount of crypto that can be bought a time.
    paymentMethods: req.body.paymentMethods
  })
  User.updateOne(
    {email: email},
    {$push: {peerOffers: peerOffer}}
  ).then(
    res.status(200).json({
      message: 'Peer Offer Created'
    })
  )
}