const PeerOffer = require ('../models/p2p');
const PeerTrade = require('../models/peerTrade');
const user = require('../models/user');
const User = require('../models/user');
const ObjectId = require('mongodb').ObjectId
const Funding = require('../models/fundingWallet');

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

exports.trade = function(req, res, next){  //Create Trade
  let offerID = new ObjectId(req.body.offerID)
  let advertiserEmail = req.body.advertiser
  let paymentMethodType = req.body.paymentMethod
  const peerTrade = new PeerTrade({
    offerID: req.body.offerID,
    advertType: req.body.advertType,
    advertiser: req.body.advertiser,
    customer: req.body.customer,
    cryptoCurr: req.body.cryptoCurr,
    cryptoAmt: req.body.cryptoAmt,
    fiatCurr: req.body.fiatCurr,
    fiatAmt: req.body.fiatAmt,
    paymentMethod: req.body.paymentMethod,
    status: req.body.status,
    timeLimit: req.body.timeLimit
  })

  if(peerTrade.advertType == 'buy'){ //Advertiser wishes to buy crypto
    User.findOne( //Find The Offer that the user wants to make a trade on
      {'email': advertiserEmail, 'peerOffers._id': offerID},
      {_id: 0, 'peerOffers.$': 1}
    ).then(peerOffer => {
      offer = peerOffer.peerOffers[0];

      if(offer.inStock < peerTrade.fiatAmt){ //Insufficient amount in stock
        res.status(200).json({
          message: 'Insufficient amount in stock'
        })
        return
      }

      if(offer.inStock >= peerTrade.fiatAmt){ //Sufficient amount in stock
        User.findOne({
          'email': advertiserEmail,
          'peerOffers._id': offerID
        }).then( result => {
          console.log(result)
          peerTrade.status = 'pending-advertiser'
          peerTrade.save()
          res.status(200).json({
            message: 'Trade Successful'
          })
          return
          
        })
      }
    })
  }

  if (peerTrade.advertType == 'sell'){  //Advertiser wishes to sell crypto
    console.log(req.body)
    User.findOne( //Check for the payment method specified
    {'email': advertiserEmail, 'paymentMethods.type': paymentMethodType},
    {_id: 0, 'paymentMethods.$': 1}
    ).then(paymentMethodFound => {
      console.log("\x1b[31m", "Payment Method:", paymentMethodFound, "PaymentMethod")
      if(!paymentMethodFound){
        res.status(200).json({
          message: 'No such payment method found',
          paymentInfo: paymentMethodFound
        })
        return
      }

      User.findOne( //Find The Offer that the user wants to make a trade on
        {'email': advertiserEmail, 'peerOffers._id': offerID},
        {_id: 0, 'peerOffers.$': 1}
      )
      .then(peerOffer => {
        const offer = peerOffer.peerOffers[0] //Using offer[0] because it returns an array
        console.log('Peer', offer)
        if(offer.inStock < peerTrade.cryptoAmt){
          res.status(200).json({
            message: 'Insufficient amount in stock'
          })
          return
        }
        if(offer.inStock > peerTrade.cryptoAmt){ //If sufficient stock, update amount in stock
          offer.inStock -= peerTrade.cryptoAmt
          peerTrade.save().then(peerResult => { //Save the trade
            console.log('Peer Trade Result',peerResult)
            res.status(200).json({
              message: 'OK',
              paymentInfo: paymentMethodFound.paymentMethods[0],
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
        message: 'Payment Method not found',
        result: err
      })
    })
  }
}

exports.customerConfirm = function(req, res, next) {
  let id = req.params.id
  PeerTrade.findOne({_id: id}).then( trade => {
    let offerID = ObjectId(trade.offerID)
    User.findOne(
      {'email': trade.advertiser, 'peerOffers._id': offerID},
      {_id: 0, 'peerOffers.$': 1}
    ).then(peerOffer => {
      if(!peerOffer){ //If offer does not exist
        res.status(400).json({
          message: 'Offer Not Found'
        })
      }
      if(trade.status == 'cancelled'){ //Check if trade is already cancelled
        res.status(200).json({
          message:'Trade already cancelled'
        })
        return
      }
      let timeLimit = peerOffer.peerOffers[0]
      if(new Date() - trade.createdAt  <= timeLimit*60*1000 ){ //Check if trade is expired
        PeerTrade.findOneAndUpdate(
          {_id:id},
          {$set: {'status':'expired'}}
        ).then(
          res.status(200).json({
            message: 'Trade Expired!'
          })
        )
      }

      PeerTrade.findOneAndUpdate(
        {_id:id},
        {$set: {'status':'pending-advertiser'}}
      ).then(
        result => {
          console.log(result, '\n Here it is')
          res.status(200).json({
            message:'Trade confirmed'
          });
        }
      ).catch(err => {
        console.log(err)
      })
    })
  })
}

exports.customerCancel = function(req, res, next) {
  console.log(req.params.id);
  let id = req.params.id
  PeerTrade.findOne({_id: id}).then( trade => {
    if(trade.status == 'cancelled'){ //Check if trade is already cancelled
      res.status(200).json({
        message:'Trade already cancelled'
      })
      return
    }
    PeerTrade.updateOne(
      {_id:id}, {$set: {'status': 'cancelled'}}
    ).then(result => {
      console.log(result)
      res.status(200).json({
        message:'Customer cancelled trade'
      })
    })
  })
}

exports.pending = function(req, res, next) {
  const email = req.query.user;
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

exports.updateExpired = function(req, res, next) {
  let expiredOffers = req.body.offers
  expiredOffers.map( offerID => {
    PeerTrade.findOne({_id: offerID}).then(
      trade => {
        trade.status == 'expired'
        trade.save().then(
          result => {
            console.log(result)
            res.status(200).json({
              message: 'OK'
            })
          }
        )
      }
    )
  })
}


exports.advertiserConfirm = function(req, res, next){
  let id = req.params.id

  function creditUser(email, currency, amount){ //Function to credit a user's funding wallet
    return new Promise(function(resolve, reject) {
      User.findOne({'email': email}).then( user => {
        const username = user.username;
        const walletAddress = username+currency.toUpperCase()+'FundingWallet'
        const allUserWallets = user.wallets
        const email = user.email

        let foundWallet = allUserWallets.filter( wallet => {
          return(wallet.address == walletAddress && wallet.type == 'funding')
        })
        foundWallet = foundWallet[0]

        if(foundWallet){
          User.updateOne({email: email, 'wallets': {$elemMatch: {
            address: walletAddress, type: 'funding'
          }}}, {$inc: {'wallets.$.balance': amount}}).then(
            result => {
              console.log(result)
              resolve(true)
            }
          )
        }

        else if(!foundWallet){
          const fundingWallet = new Funding({
            name: currency.toUpperCase() + ' funding wallet',
            currency: currency,
            address: username+currency.toUpperCase()+'FundingWallet',
            iconSrc: '',
            balance: 0,
            transactions: [],
            type: 'funding',
          })
          User.updateOne(
            {email: email, 'wallets.address': {$ne: fundingWallet.address}},
            {$push: {wallets: fundingWallet}}
          ).then( result => {
            console.log(result)
            User.updateOne({email: email, 'wallets': {$elemMatch: {
              address: walletAddress, type: 'funding'
            }}}, {$inc: {'wallets.$.balance': amount}}).then(
              response => {
                resolve(true)
              }
            )
          }
          )
        }
        else {
          reject(false)
        }
      })        
    })
  }


  PeerTrade.findOne({_id: id})
  .then(trade => {
    const fiatCurrency = trade.fiatCurr;
    const cryptoCurrency = trade.cryptoCurr;
    let offerID = ObjectId(trade.offerID)
    if(!trade){
      res.status(404).json({
        message: 'Trade Not Found'
      })
      return
    }
    if(trade.advertType == 'sell'){
      User.updateOne(
        {'email': trade.advertiser, 'peerOffers._id': offerID},
        {$inc: {'peerOffers.$.inStock' : -trade.cryptoAmt}}
      ).then( response => {
        creditUser(trade.customer, trade.cryptoCurr, trade.cryptoAmt).then( userCredited => {
          console.log('Is user credited?', userCredited)
          PeerTrade.updateOne(
            {_id:id}, {$set: {'status': 'completed'}}
          ).then(
            res.status(200).json({
              message: 'Trade Confirmed'
            })
          )
        }).catch(err => {
          console.log('An Error occurred:', err)
          res.status(200).json({
            message: 'Could not credit user'
          });
          return 
        })
      }).catch(err => {
        console.log(err);
        res.status(500).json({
          message: err
        })
      })
      return
    }

    if(trade.advertType == 'buy'){      
      User.updateOne(
        {'email': trade.advertiser, 'peerOffers._id': offerID},
        {$inc: {'peerOffers.$.inStock' : -trade.fiatAmt}}
      ).then(() => {
        res.status(200).json({
          message: 'Trade Successful'
        })
      }).catch( err => {
        console.log(err)
      })
      return
    }
  })
  .catch( err => {
    console.log(err)
  })
}

exports.checkBal = function(req, res, next){
  console.log(req.body);
  const email = req.body.email;
  const fiatCurrency = req.body.currency;
  const amount = req.body.amount
  User.findOne({email: email}).then(
    user => {
      const walletsArray = user.wallets
      const username = user.username;
      const fundingWalletAddress = username+fiatCurrency.toUpperCase()+'FundingWallet'

      const wallet = walletsArray.filter( wallet => {
        return (wallet.address == fundingWalletAddress && wallet.type == 'funding')
      })

      const foundWallet = wallet[0]

      if(foundWallet){  //If wallet was found
        let walletID = ObjectId(foundWallet._id)
        if(foundWallet.balance < amount){ //if wallet has sufficient amount
          res.status(200).json({
            message: 'Insufficient wallet balance',
            isEligible: false
          })
          return
        }
        User.updateOne({'email': email, 'wallets._id': walletID},
        {$inc: { "wallets.$.balance": -amount}}
        ).then(
          result => {
            console.log(result);
            console.log(foundWallet)
            res.status(200).json({
              message: 'Wallet Found and Updated',
              isEligible: true
            })
            return
          }
        )
      }
      if(!foundWallet){
        res.status(200).json({
          message: 'Wallet not found',
          isEligible: false
        })
        return
      }
      // res.status(200).json({
      //   message: 'All Good',
      // })
    }
  )
}