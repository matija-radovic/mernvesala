const router = require('express').Router();
const User = require('../model/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

//https://www.npmjs.com/package/bcryptjs

router.get('/register', (req, res) => {
    User.find()
        .then((result) => {
            res.json(result);
        }).catch((err) => {
            res.status(400).json('Error: ' + err);
        });
});
router.post('/register', async (req, res) => {
    //Validation -- prevencija da mongoose daje svoje errore koji
    //              uglavnom nemaju smisla gde je greska, Error ce
    //              se svakako uhvatiti ili od mongoose ili od nas.
    if (!req.body.name || !req.body.password) {
        return res.status(400).json({ msg: "Plesae enter all fields" });
    }
    if (req.body.name.length > 15) {
        return res.status(400).json({ msg: "Name length is 15 character MAX" });
    }
    if (req.body.name === "Apple" || req.body.name === "Banana" || req.body.name === "Carrot" || req.body.name === "General Chat") {
        return res.status(400).json({ msg: "sorry but thats a reserved keyword" })
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

//Protected by - auth
router.get('/profile', auth, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({
        id: user._id,
        name: user.name,
        stats: user.stats,
        date: user.date,
        picture: user.picture
    })

    router.delete('/profile', auth, (req, res) => {
        User.findByIdAndDelete(req.user._id)
            .then((result) => {
                res.json('User deleted');
            }).catch((err) => {
                res.status(400).json('Error: ' + err);
            });
    })
});

router.put('/profile', auth, async (req, res) => {
    const oldPassword = req.body.oldPassword
    const newPassword = req.body.password;
    const newName = req.body.name;
    const newAvatar = req.body.picture;
    const user = await User.findById(req.user._id);

    try {
        if(newAvatar) {
            user.picture = newAvatar;
            user.save();
            return res.json('Avatar updated successfully');
        }

        if(!(await bcrypt.compare(oldPassword, user.password))){
            return res.status(401).send({msg: 'Wrong password'});
        }

        if(!newName) {
            return res.status(401).send({msg: 'Name is required'});
        }

        console.log("Newname: " + newName + " user.name: " + user.name)
        if(newName !== user.name && (await User.findOne({name: newName}))){
            return res.status(401).send({msg: 'Username already taken'});
        }

        if(newName !== user.name) {
            user.name = newName;
        }

        if(newPassword){
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

router.put('/profile/reset-password', auth, async (req, res) => {
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
    });
});

router.get('/login', (req, res) => {
    res.send('GET Login');
});

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
