const {DataTypes } = require('sequelize');
const db = require('../dbConfig/dbconnection');

const Contacts = db.define('list', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

Contacts.sync().then(() => {
  console.log('table created');
});

module.exports = Contacts;