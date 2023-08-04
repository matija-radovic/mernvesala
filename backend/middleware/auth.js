const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ msg: "No token - Authorization Denied" });
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.status(401).json({ msg: "Cannot Verify - Authorization Denied" });
        }
        console.log("Verified Value: ", verified);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ msg: err });//ili 500 nmp
    }
}