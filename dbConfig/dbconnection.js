const Sequelize = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

console.log('process.env.DATABASE_URL',process.env.DATABASE_URL)

module.exports = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false
    }
  }
})