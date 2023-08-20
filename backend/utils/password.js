const bcrypt = require('bcryptjs');

/**
 * Hashes the password
 * @deprecated
 * @param {string} password 
 * @returns {Promise}
 */
const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        console.log("Usli smo u promise: proslo");
        bcrypt.genSalt(10, (err, salt) => {
            if(err) {
                console.log("Error dok smo generisali salt: error");
                reject(err);
            }
            bcrypt.hash(password, salt, (err, hash) => {
                
                if(err) {
                    console.log("Error dok smo hashovali sifru: error");
                    reject(err);
                }
                console.log("Sve ok sa hashovanjem: proslo");
                resolve(hash);
            });
        });
    });
}

const comparePassword = (password, hashed) => {
    return bcrypt.compare(password, hashed)
}

module.exports = {
    hashPassword, 
    comparePassword
}