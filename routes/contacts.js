const express = require('express');
const router = express.Router();
const Contacts = require('../models/Contacts');


router.get('', (req, res) => {
  res.send('Welcome to Lenditt.')
})

// Add Contact
router.get('/contact/', (req, res) => {
  try {
    // Parse array
    let contactList = JSON.parse(req.query.contacts)

    let newArr = []
    contactList.map(item => newArr.push(item.trim().slice(-10).trim()))

    // Unique contact array
    let uniqueContactList = [...new Set(newArr)]

    let makePayload = []

    // make payload for insert query
    uniqueContactList.map((item) => {
      if (item.length !== 10) res.send('Phone number digits are more or less than 10.')
      makePayload.push({ phone_number: item })
    })

    // INSERT INTO TABLE 
    Contacts.bulkCreate(makePayload)
      .then((item) => {
        res.json({
          "Message": "Contact added successfully.",
          "Contacts": item
        });
      }).catch((err) => {
        res.send(err)
      })
  }
  catch (err) {
    res.send("Error while adding contact")
  }
}
)
module.exports = router;