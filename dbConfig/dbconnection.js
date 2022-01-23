const mysql = require('mysql')

module.exports.getConnectionObject = () => {
  var connection = mysql.createConnection({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'the-virtual-classroom',
    port: Number(process.env.PORT) || 3306
  });
  connection.connect(function (err) {
    if(err){
        console.log("error occured while connecting");
    }
    else{
        console.log("connection created with Mysql successfully");
    }
 })
  return connection
}
