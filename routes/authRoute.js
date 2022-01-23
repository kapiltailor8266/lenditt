const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const uuid = require('uuid').v4
const jwt = require('jsonwebtoken');
const authenticateToken = require('../controller/auth');
const dotenv = require('dotenv');
dotenv.config();
const { getUser, find, insert } = require('../dbConfig/dbQueries')

// [ Logged in user check ]  
router.get('/', authenticateToken, (req, res) => {
    res.json(`Welcome to The Virtual Classroom`);
})

// [ Get all users  ]
router.get('/users',authenticateToken, async (req, res) => {
    const users = await getUser()
    console.log(users)
    res.json(users)
})


//  [ User Registration ]
router.post('/registration', async (req, res) => {
    /**
       * 1. Check User already exist or not
       * 2. If already exist throw error.
       * 3. Else prepare payload for user
       * 4. Insert into user table
       * 4. retun success.
      **/
   
    const { first_name: firstName, last_name: lastName, email, password, user_type: userType } = req.body;
   
    // check if user with the given email exists
    const userExists = await find(email)

    console.log(userExists)

    if (userExists && userExists.length > 0) return res.status(400).send('Username already exists')

    try {
        const hash = await bcrypt.hash(password, 10);
        let userPayload = {
            id: uuid(),
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: hash,
            user_type: userType
        }
        // insert into table
        await insert('user', userPayload)

        return res.json({ user: userPayload, status: 'user registration successful.' })
    } catch {
        return res.json({ status: 'Error while user registration.' });
    }
})

// [ User Login ] 
router.post('/login', async (req, res) => {
     /**
       * 1. Check User exist or not
       * 2. If not throw error.
       * 3. Compare given  password with stored password and authenticate
       * 4. If email and password mismatch throw error
       * 5. else make JWt token 
       * 6. retun response.
      **/
    const { email, password } = req.body;

    let userExists = await find(email)
    userExists = userExists[0]

    console.log('User', userExists)

    if (!userExists) return res.status(401).send('No User Found.');

    let passwordMatch = await bcrypt.compare(password, userExists.password)
    if (passwordMatch) {
        const token = jwt.sign({
            id: userExists.id,
            userType: userExists.user_type
        }, process.env.SECRET_KEY
        )
        res.json({ token: token, user: userExists });
    } else { res.status(401).send('Incorrect Credentials.') }

});

module.exports = router;