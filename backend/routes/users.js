const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../model/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/password');
const { async } = require('rxjs');

router.get('/', (req, res) => {
    res.send(`
        .get('/') => ROOT
        .get('/register') => Retrives all users
        .get('/login') => Retrives nothing
        .get('/profile') => Retrives profile if auth-token is valid

        .post('/register') => Registers user
        .post('/login') => Logins the user
        .post('/profile') => AUTH protected gets profile info

        .get('/tokenIsValid') => Checks the validation of a token
    `);
});

router.get('/register', (req, res) => {
    User.find().then((result) => {
        res.json(result);
    }).catch((err) => {
        res.status(400).json('Error: ' + err);
    });
});

router.post('/register', async (req, res) => {
    //Bolje naše odgovore da šaljemo nego mongoDB errore
    const regexStrict = /^(?=.{3,15}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;
    const regexStrictAlternative = /^(?=[a-zA-Z0-9._]{3,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
    if (!req.body.name || !req.body.password) {
        return res.status(400).json({ msg: "Please enter all fields" });
    }
    if (req.body.name.length > 15) {
        return res.status(400).json({ msg: "Maximum name length is 15 characters" });
    }
    //Regex ce da pita sve sto ima iznad
    if (!regexStrict.test(req.body.name)) {
        return res.status(400).json({ msg: "Bad input" });
    }
    const user = await User.findOne({ name: req.body.name })
    if (user) {
        return res.status(400).json({ msg: "Use already exists" });
    }

    await hashPassword(req.body.password).then((password) => {
        //SAVE TO DB
        new User({
            name: req.body.name,
            password: hash
        }).save().then((result) => {
            res.json("New user added");
        }).catch((err) => {
            res.status(400).json("Error saving to database: " + err);
        });
    }).catch((err) => {
        res.status(400).json("Error while crypting the password. " + err);
    });
});

router.get('/profile', auth, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({
        id: user._id,
        name: user.name,
        stats: user.stats,
        date: user.date
    })
});

router.delete('/profile', auth, (req, res) => {
    User.findByIdAndDelete(req.user._id).then((result) => {
        res.json("User deleted");
    }).catch((err) => {
        res.status(400).json("Error: " + err);
    });
});

app.get('/profile/:name', async (req, res) => {
    await User.findOne({ name: req.params.name }).then((result) => {
        res.json({
            name: result.name,
            stats: result.stats,
            date: result.date
        });
    }).catch((err) => {
        res.json("Error: " + err)
    });
});


router.get('/login', (req, res) => {
    res.send('GET login');
});

router.post('/login', async (req, res) => {
    const user = await User.findOne({ name: req.body.name });
    if (!user) {
        return res.status(400).json({ msg: "User doesnt exist" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
        res.status(400).send({ msg: "Authentication Error" })
    }

    try {
        jwt.sign({ _id: user.id }, process.env.JWT_SECRET, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id: user._id,
                name: user.name,
                stats: user.stats,
                date: user.date
            });
        });
    } catch (error) {
        res.status(500).send({ msg: `Token error, couldnt login: ${error}` })
    }

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