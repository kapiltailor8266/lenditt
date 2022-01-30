const express = require('express');
const router = express.Router();
const Contacts = require('../models/Contacts');


router.get('',(req,res)=>{
  res.send('Welcome to Lenditt.')
})

// Add Contact
router.get('/contact/', (req, res) => {
  try {
    // Split query string into array
    let contactList = req.query.contacts.split(';')

    let newArr = []
    contactList.map(item => newArr.push(item.slice(-10).trim()))

    let uniqueContactList = [...new Set(newArr)]

    let makePayload = []
    uniqueContactList.map((item) => {
      if(item.length !== 10) return res.send('Phone number digits are more or less than 10.')
      makePayload.push({ phone_number: Number(item) })
    })

    console.log('makePayload',makePayload)

    // INSERT INTO TABLE
    Contacts.bulkCreate(makePayload)
      .then((item) => {
        res.json({
          "Message": "Contact added successfully.",
          "Item": item
        });
      }).catch((err) => {
        res.json({
          "Error": err   
        })
      })
  }
  catch (err) {
    res.send(err)
  }
}
)
module.exports = router;