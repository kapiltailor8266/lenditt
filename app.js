require('./dbConfig/dbconnection')
const express = require('express')
const app = express()
const morgan = require('morgan')
const dotenv = require('dotenv')
dotenv.config()

// Importing routes
const authRoutes = require('./routes/authRoute');
const assignmentRoutes = require('./routes/assignmentRoute');

// Middleware
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:false}))


app.use('/api', authRoutes, assignmentRoutes);


// PORT
const PORT = process.env.DATABASE_PORT || 3000;


app.listen(PORT,()=>{
    console.log(`Server Started on Port ${PORT}`);
});