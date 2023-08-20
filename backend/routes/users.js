const router = require('express').Router();
const User = require('../model/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// For debugging
router.get('/register', (req, res) => {
    User.find()
        .then((result) => {
            res.json(result);
        }).catch((err) => {
            res.status(400).json('Error: ' + err);
        });
});

/**
 * Registers a user
 * @param {string} name
 * @param {string} password
 * 
 * @returns {object} 
 * @property {string} msg - error or success
 */
router.post('/register', async (req, res) => {
    /**
     * 1. Only contains alphanumeric characters, underscore and dot (e.g "_username","username_",".username", "username.").
     * 2. Underscore and dot can't be next to eachother (e.g "user_.name").
     * 3. Underscore or dot can't be used multiple times in a row (e.g "user__name","user..name")
     * 4. Number of characters must be between 3 and 15.
     */
    const regexStrict = /^(?=.{3,15}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;
    const regexStrictAlternative = /^(?=[a-zA-Z0-9._]{3,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;

    if (!req.body.name || !req.body.password) {
        return res.status(400).json({ msg: "Plesae enter all fields" });
    }
    if (req.body.name.length > 15) {
        return res.status(400).json({ msg: "Name length is 15 character MAX" });
    }
    if (!regexStrict.test(req.body.name)) {
        return res.status(400).json({ msg: "Bad input" });
    }
    

    const user = await User.findOne({ name: req.body.name });
    if (user) {
        return res.status(400).json({ msg: "User already exists" });
    }


    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(req.body.password, salt, function (err, hash) {
            // Store hash in your password DB.
            const newUser = new User({
                name: req.body.name,
                password: hash
            });

            newUser.save()
                .then((result) => {
                    res.json('New user added');
                }).catch((err) => {
                    res.status(400).json('Error: ' + err);
                });
        });
    });
});

/**
 * Gets profile when logging in 
 * Protected by - auth
 * @param {object} user - from authentication process
 * 
 * @returns {object}
 * @property {string} id
 * @property {string} name
 * @property {string} stats
 * @property {date} date
 * @property {number} picture 
 *  */ 
router.get('/profile', auth, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({
        id: user._id,
        name: user.name,
        stats: user.stats,
        date: user.date,
        picture: user.picture
    })
});

/**
 * Used to delete users, now for debugging only
 * @deprecated
 *  */
router.delete('/profile', auth, (req, res) => {
    User.findByIdAndDelete(req.user._id)
        .then((result) => {
            res.json('User deleted');
        }).catch((err) => {
            res.status(400).json('Error: ' + err);
        });
});


/**
 * Changes profile - username, password, avatar
 * Protected by - auth
 * @param {string} oldPassword
 * @param {string} password
 * @param {string} name
 * @param {number} picture - doesnt require password to be changed
 * 
 * @returns {object}
 * @property {string} msg - error or succes message
 *  */ 
router.put('/profile', auth, async (req, res) => {
    const oldPassword = req.body.oldPassword
    const newPassword = req.body.password;
    const newName = req.body.name;
    const newAvatar = req.body.picture;
    const user = await User.findById(req.user._id);

    try {
        if (newAvatar) {
            user.picture = newAvatar;
            user.save();
            return res.json('Avatar updated successfully');
        }

        if (!(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(401).send({ msg: 'Wrong password' });
        }

        if (!newName) {
            return res.status(401).send({ msg: 'Name is required' });
        }

        console.log("Newname: " + newName + " user.name: " + user.name)
        if (newName !== user.name && (await User.findOne({ name: newName }))) {
            return res.status(401).send({ msg: 'Username already taken' });
        }

        if (newName !== user.name) {
            user.name = newName;
        }

        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user.password = hashedPassword;
        }

        await user.save();

        return res.json({ message: 'Password and/or username updated successfully' });
    } catch (err) {
        console.error('Error updating password and/or username:', err);
        res.status(500).json({ msg: 'An error occurred while updating password and/or username' });
    }

});

/**
 * Changes password
 * Protected by - auth
 * @deprecated
 */
router.put('/profile/reset-password', auth, async (req, res) => {
    return res.status(400).json({msg: 'This path is no longer available'});
    /*
    const user = await User.findById(req.user._id);
    bcrypt.compare(req.body.password, user.password, function (err, resCrypt) {
        if (!resCrypt) {
            return res.status(400).send({ msg: "Wrong password" });
        } else {
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(req.body.password, salt, function (err, hash) {
                    user = {
                        ...user,
                        password: hash
                    }
                    user.save()
                        .then((result) => {
                            res.json('Password changed');
                        }).catch((err) => {
                            res.status(400).json('Error: ' + err);
                        });
                });
            });
        }
    });*/
});

// For debugging purposes
router.get('/login', (req, res) => {
    res.send('GET Login');
});


/**
 * Logins the user
 * @param {string} name
 * @param {string} password 
 */
router.post('/login', async (req, res) => {
    const user = await User.findOne({ name: req.body.name });
    if (!user) {
        return res.status(400).json({ msg: "User doesnt exist" });
    }

    bcrypt.compare(req.body.password, user.password, function (err, resCrypt) {
        if (!resCrypt) {
            return res.status(400).send({ msg: "Authentication Error" });
        } else {
            //res.send("Authentication successful!");
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET)
            res.json({
                token: token,
                user: {
                    id: user._id,
                    name: user.name,
                    stats: user.stats,
                    date: user.date,
                    picture: user.picture
                }
            });
        }
    });
});

/**
 * For testing tokens
 * @param {JsonWebKey} auth_token - from header 'auth-token'
 * @returns {boolean}
 */
router.post('/tokenIsValid', async (req, res) => {
    try {
        const token = req.header('auth-token');
        if (!token) {
            return res.json(false);
        }
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.json(false);
        }
        const user = await User.findById(verified._id)
        if (!user) {
            return res.json(false);
        }
        return res.json(true);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

module.exports = router;
