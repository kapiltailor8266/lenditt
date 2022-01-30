const db = require('./dbConfig/dbconnection')
const express = require('express')
const app = express()
const morgan = require('morgan')
const dotenv = require('dotenv')
dotenv.config()

// import routes
const contactRoute = require('./routes/contacts')

// Middleware
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:false}))


db.authenticate()
.then(() => console.log('Connection has been established successfully.'))
.catch(err => console.error('Unable to connect to the database:', err))

// middleware
app.use('/', contactRoute)

// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`Server Started on Port ${PORT}`);
});