const Sequelize = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

// db connection
module.exports =  new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
})