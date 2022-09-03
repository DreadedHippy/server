const PeerOffer = require ('../models/p2p');
const PeerTrade = require('../models/peerTrade');
const user = require('../models/user');
const User = require('../models/user');
const ObjectId = require('mongodb').ObjectId

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
      offers: result.peerOffers
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
  let offerID = new ObjectId(req.body.offerID)
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
  User.findOne( //Check for the payment method specified
    {'email': advertiserEmail, 'paymentMethods.type': paymentMethodType},
    {_id: 0, 'paymentMethods.$': 1}
  ).then(result => {
    console.log(result)
    if(!result){
      res.status(200).json({
        message: 'No such payment method found',
        paymentInfo: result.paymentMethods[0]
      })
      return
    }
    
    User.findOne( //Find The Offer that the user wants to make a trade on
      {'email': advertiserEmail, 'peerOffers._id': offerID},
      {_id: 0, 'peerOffers.$': 1}
    )
    .then( offer => {
      console.log(offer)
      if(offer.inStock < peerTrade.cryptoAmt){
        res.status(200).json({
          message: 'Insufficient amount in stock'
        })
        return
      }
      if(offer.inStock > peerTrade.cryptoAmt){ //if sufficient stock, update amount in stock
        offer.inStock -= peerTrade.cryptoAmt
        peerTrade.save().then(peerResult => { //Save the trade
          console.log('Peer Trade Result',peerResult)
          res.status(200).json({
            message: 'OK',
            paymentInfo: result.paymentMethods[0],
            peerTradeID: peerResult._id
          })
        });
      }
    }).catch( err => {
      console.log('An error occurred', err)
    })
  }).catch(err => {
    console.log(err),
    res.status(404).json({
      message: 'Error',
      result: err
    })
  })
}

exports.customerConfirm = function(req, res, next) {
  console.log(req.params.id);
  let id = req.params.id
  PeerTrade.updateOne(
    {_id:id}, {$set: {'status': 'pending-advertiser'}}
  ).then(result => {
    console.log(result)
    res.status(200).json({
      message:'Customer confirmed trade'
    })
  })
}

exports.customerCancel = function(req, res, next) {
  console.log(req.params.id);
  let id = req.params.id
  PeerTrade.updateOne(
    {_id:id}, {$set: {'status': 'cancelled'}}
  ).then(result => {
    console.log(result)
    res.status(200).json({
      message:'Customer cancelled trade'
    })
  })
}

exports.pending = function(req, res, next) {
  const email = req.query.user;
  console.log(email)
  PeerTrade.find({$and: [
    {$or: [
      {'advertiser': email},
      {'customer': email}
    ]},
    {$or: [
      {'status': 'pending'},
      {'status': 'pending-advertiser'}
    ]}
  ]}).then(result => {
    res.status(200).json({
      message: 'OK',
      result: result
    })
  })
}