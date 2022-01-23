const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
// authenticating the routes
module.exports = function authenticateToken(req, res, next) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]; 
    if (token == null) return res.json({ status: 'ACCESS DENIED' }); 
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.json({ status: "ACCESS DENIED" });  
        req.user = user
        next();
    })
}
