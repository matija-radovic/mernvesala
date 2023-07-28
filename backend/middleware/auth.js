const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const {token} = req.header('auth-token');
    if(!token) {
        return res.status(401).json({msg: "No token - Authorization denied"});
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if(!verified) {
            return res.status(401).json({msg: "Cannot Verify - Authorization denied"});
        }
        console.log("Verified token value: ", verified);
        req.user = verified
        next();
    }catch (err){
        res.status(500).json({msg: err})
    }
}

module.exports = { auth }
