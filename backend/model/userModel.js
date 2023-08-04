const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        maxlength: 15
    },
    password: {
        type: String,
        required: true,
    },
    stats: {
        gamesPlayed: {
            type: Number,
            default: 0
        },
        gamesWon: {
            type: Number,
            default: 0
        },
        winStreak: {
            type: Number,
            default: 0
        },
        currentWinStreak: {
            type: Number,
            default: 0
        },
        lettersGuessed: {
            type: Number,
            default: 0
        },
        vowelGuessed: {
            type: Number,
            default: 0
        },
        consonantsGuessed: {
            type: Number,
            default: 0
        },
        wordsGuessed: {
            type: Number,
            default: 0
        },
        guessAttempts: {
            type: Number,
            default: 0
        },
        lastGame: {
            type: Date
        }
    },
    date: {
        type: Date,
        default: Date.now
    },
    picture: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('User', userSchema);