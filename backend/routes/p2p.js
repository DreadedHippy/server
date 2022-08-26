const PeerOffer = require ('../models/p2p');
const PeerTrade = require('../models/peerTrade')
const user = require('../models/user');
const User = require('../models/user')

exports.create = function(req, res, next){
  let email = req.body.email
  console.log(email)
  const peerOffer = new PeerOffer({
    name: req.body.name,
    email: email,
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
  User.updateOne({email: email}, {$push: {peerOffers: peerOffer}})
  .then(result => {
    console.log('Peer offer has been added', result)
    res.status(200).json({
      message: 'Added Offer',
      offers: user.peerOffers
    })
  })
}

exports.offers = function(req, res, next){
  const email = req.query.email;
  User.findOne({'email': email})
  .then( user => {
    if(!user){
      console.log("User not found")
      res.status(200).json({
        message: 'User not found'
      })
      return
    }
    res.status(200).json({
      message: 'Peer offers retreived',
      offers: user.peerOffers
    })
  })
}

exports.trade = function(req, res, next){
  let advertiserEmail = req.body.advertiser
  let paymentMethodType = req.body.paymentMethod
  const peerTrade = new PeerTrade({
    advertType: req.body.advertType,
    advertiser: req.body.advertiser,
    customer: req.body.customer,
    cryptoCurr: req.body.cryptoCurr,
    cryptoAmt: req.body.cryptoAmt,
    fiatCurr: req.body.fiatCurr,
    fiatAmt: req.body.fiatAmt,
    paymentMethod: req.body.paymentMethod,
    status: req.body.status
  })

  User.findOne({'email': advertiserEmail, 'paymentMethods.type': paymentMethodType}, {_id: 0, 'paymentMethods.$': 1})
  .then(result => {
    console.log(result)
  }).catch(err => {
    console.log(err)
  })

  res.status(200).json({
    Message: 'OK'
  })
}