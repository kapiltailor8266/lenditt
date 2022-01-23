const mysql = require('mysql')

module.exports.getConnectionObject = () => {
  var connection = mysql.createPool({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'the-virtual-classroom',
    port: Number(process.env.PORT) || 3306
  })
  return connection
}
