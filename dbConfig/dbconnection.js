const mysql = require('mysql')

module.exports.getConnectionObject = () => {
  var connection = mysql.createConnection({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'the-virtual-classroom',
    port: Number(process.env.DATABASE_PORT) || 3306
  });
  connection.connect()
  return connection
}
