const { Socket } = require('socket.io');
const User = require('../model/userModel');

/**
 * Represents a letter and if its guessed or not
 * @class
 */
class Letter {
    /**
     * @constructor
     * @param {string} char 
     * @param {boolean} guessedRight 
     */
    constructor(char, guessedRight) {
        /**@type {string} */
        this.char = char;
        /**@type {boolean} */
        this.guessedRight = guessedRight;
    }
}

/**
 * Represnts a player that is currently in game
 * @class
 */
class Player {
    /**
     * @constructor
     * @param {User} user - from '../model/userModel.js
     * @param {string} socketID 
     */
    constructor(user, socketID) {
        this.user = user;
        this.socketID = socketID;
        this.turn = false;
        /**Can be: 'Online' | 'Offline' */
        this.status = "Online"
        /**@type {Letter[]} */
        this.guessedLetters = [];
        this.guessedAttempts = 0;
        this.points = 0;
    }

    changeSocket(socketID) {
        this.socketID = socketID;
    }

    changeStatus(status) {
        this.status = status;
    }

    /**
     * @returns modified Player object for clients to display
     */
    getPlayer() {
        return {
            user: {
                /** @type {string}*/
                name: this.user.name,
                /** @type {number}*/
                picture: this.user.picture
            },
            turn: this.turn,
            status: this.status,
            points: this.points,
            guessed: this.guessedLetters
        }
    }

    addGuessedLetter(letter, guessedRight) {
        this.guessedLetters.push(new Letter(letter, guessedRight));
    }

    /**
     * Adds 'points' amount of points to current player
     * @param {number} points 
     */
    addPoints(points) {
        this.points += points;
    }

    /**
     * Adds one more attempt to current player
     */
    incrementAttempt() {
        this.guessedAttempts += 1;
    }
}

/**
 * Represents a game room
 * @class
 */
class Room {
    /**
     * @constructor
     * @param {number} roomID - recived from RoomCodeManager class
     * @param {number} playerNumber - number of players in a game
     * @param {string} word - genereated from WordManager class
     * @param {Function} deleteRoomCallback - passed down function for deletion
     */
    constructor(roomID, playerNumber, word, deleteRoomCallback) {
        this.roomID = roomID;
        /** Can and must be ['Waiting' | 'Progress' | 'Ended']*/
        this.roomState = "Waiting";
        /**@type {number} */
        this.playerNumber = playerNumber;
        /** @type {Player[]} */
        this.players = [];
        this.word = word;
        this.guessedLetterIndexes = [];
        this.timeoutCreation = null;
        this.timeoutMove = null;
        this.timeoutExistance = null;
        this.deleteRoomCallback = deleteRoomCallback;
    }

    /**
     * For debugging, prints all users in the game
     */
    printArr() {
        this.players.forEach((p) => { console.log(`${p.user.name}`) })
    }

    /**
     * For debugging, prints only important data about the room (all except timeouts)
     */
    printRoom() {
        console.log("//////////////////////////////////////////")
        console.log("Room info: ", {
            roomID: this.roomID,
            roomState: this.roomState,
            playerNumber: this.playerNumber,
            players: this.players,
            word: this.word,
            guessedLetterIndexes: this.guessedLetterIndexes,
        });
        console.log("Player in that room info:");
        this.players.forEach((p) => { console.log(`${p.user.name}`) })
        console.log("//////////////////////////////////////////")
    }

    /**
     * Joins a user to room. If user is in the same room, `player.status` will be set to "Online" and if hes accessing from different socket, `socketID` will change to new one.
     * Information about socket change should be handled by the invoker of this function. It only joins the socket to this room.
     * @param {User} user 
     * @param {Socket} socket
     * @throws {Error} If `Room.roomState` is in progress or ended, or room is full.
     */
    async joinRoom(user, socket) {
        /*console.log("User to join: ", user.name);*/
        const player = this.players.find(player => player.user?.id === user.id)
        if (player) {
            console.log("Chaning socket for user: " + player.user.name + "\toldSocketID: " + player.socketID + "\tnewSocketID: " + socket.id);
            if (player.socketID !== socket.id) {
                player.changeSocket(socket.id);
                socket.join(this.roomID);
            }
            player.changeStatus("Online");
            return;
        }

        if (this.roomState !== "Waiting") {
            throw new Error("Game is in progress");
        }

        if (this.players.length >= this.playerNumber) {
            throw new Error("Game is full");
        }


        this.players.push(new Player(await User.findById(user.id), socket.id));
        console.log("User: " + user.name + " joined");
        console.log("User list after the newly joined user: "); this.printArr();
        
        //Deleting the timeoutCreation since the user joined the room
        if (this.timeoutCreation) {
            clearTimeout(this.timeoutCreation);
            this.timeoutCreation = null;
        }
    }

    /**
     * Based on type of leaving will change the status of the user from "Online" to "Offline" 
     * or remove him from the room if room state is "Waiting"
     * @param {User} user - user to be removed/changed status
     * @param {Socket} socket
     * @param {String} type ['disconnect' | 'leave'] other types throw Error
     * @returns 
     */
    leaveRoom(user, socket, type) {
        const discPlayer = this.players.find((player) => (player.user.id === user.id));
        console.log(discPlayer);
        switch (type) {
            case 'disconnect':
                //Room in progress? - Set player as offline
                if (this.roomState !== "Waiting") {
                    discPlayer?.changeStatus("Offline");
                    console.log("printing Room");
                    this.printRoom();
                    if(this.players.filter(player => player.status === 'Online').length < 2) {
                        console.log("ending the game");
                        this.updateState('Ended');
                        this.deleteRoomCallback(this.roomID, 'Ending mid game');
                        return;
                    }
                    if(this.players.find(player => (player.turn === true && player.user.id === user.id))){
                        this.nextTurn();
                    }
                    return;
                }

                //Room is in waiting state - Deleting user from room
                this.players = this.players.filter((player) => (player.user.id !== discPlayer.user.id));

                //Should we delete the room?
                if (this.players.length === 0) {
                    console.log("deleted the rum due to afk");
                    this.deleteRoomCallback(this.roomID);
                }

                break;
            case 'leave':
                //Room in progress? - cant leave while in progress
                if (this.roomState !== "Waiting") {
                    console.log('Trying to leave while waiting?');
                    socket.emit('game:leave:fail', { msg: "You cant leave the game while its running" });
                    return;
                }

                //Room is in waiting state - Deleting user from room
                this.players = this.players.filter((player) => (player.user.id !== discPlayer.user.id));
                socket.emit('game:leave:success', { msg: "You left successfully" });
                socket.leave(this.roomID);

                //Should we delete the room?
                if (this.players.length === 0) {
                    this.deleteRoomCallback(this.roomID)
                    console.log('deleted da room');
                }

                break;
            default:
                throw new Error("wrong type");
        }
    }

    /**
     * Changes the state of the room, no checking (no throwing if wrong state)
     * @param {String} state ['Waiting' | 'Progress' | 'Ended']
     */
    updateState(state) {
        this.roomState = state;
    }

    /**
     * Deletes the room after `time` amount of time
     * @param {Number} time default is 40
     */
    emptyRoomDeletionTimeout(time = 40) {
        this.timeoutCreation = setTimeout(() => {
            this.timeoutCreation = null;
            if (this.players.length === 0) {
                this.deleteRoomCallback(this.roomID);
            }
        }, time * 1000) //sec
    }

    /**
     * Deletes the room after game started in 40minutes
     */
    roomLifeTimeout() {
        this.timeoutExistance = setTimeout(() => {
            this.timeoutExistance = null;
            this.deleteRoomCallback(this.roomID, "Max ocupation of room is 40minutes");
        }, 40 * 60 * 1000)
    }

    /**
     * Gives a turn to next player. For player to get the next turn he must be 'Online' (`Player.status === 'Online'`)
     * @returns {Player} player that is next move or null if no users are connected;
     * @throws {Error} if cant find the current user;
     */
    nextTurn() {
        const currentIndex = this.players.findIndex(p => p.turn === true);
        if (currentIndex !== -1) {
            this.players[currentIndex].turn = false;

            let nextIndex = (currentIndex + 1) % this.players.length;
            while (nextIndex !== currentIndex) {
                if (this.players[nextIndex].status === "Online") {
                    this.players[nextIndex].turn = true;
                    console.log("Player whos turn it is", this.players[nextIndex])
                    return this.players[nextIndex];
                }
                nextIndex = (nextIndex + 1) % this.players.length;
            }
            throw new Error("Internal Server Error, Couldnt find next user");
        }
        throw new Error("Internal Server Error, couldn't find next player turn");
    }

    /**
     * Handled by sockets
     * @param {Number} time 
     */
    nextTurnTimeout(time) {
        ///Empty
    }


    /**
     * @param {string} word 
     * @returns array of indexes where char is found, if word doesnt match, undefined is returned
     */
    validWord(word) {
        if (word === this.word) {
            const allIndexes = Array.from({ length: this.word.length }, (_, index) => index);

            this.guessedLetterIndexes.forEach(index => {
                const foundIndex = allIndexes.indexOf(index);
                if (foundIndex !== -1) {
                    allIndexes.splice(foundIndex, 1); // Remove the index from allIndexes
                }
            });

            return allIndexes;
        }
        return undefined;
    }
    /**
     * @param {String} letter one char
     * @returns array of indexes where char is found, if char is already used it will return -1
     */
    validLetter(letter) {
        const usedLetters = this.getUsedLetters();
        const charIndexes = [];
        if (usedLetters.find(l => l === letter)) {
            charIndexes.push(-1);
        } else {
            for (let i = 0; i < this.word.length; i++) {
                if (this.word[i] === letter) {
                    charIndexes.push(i);
                }
            }
        }
        return charIndexes;
    }

    /**
     * Adds the correct guessed letters to `guessedLetterIndexes` array of this room
     * @param {Array} arrayOfLetterIndexes 
     */
    setGuessedIndexes(arrayOfLetterIndexes) {
        arrayOfLetterIndexes.forEach(letter => {
            this.guessedLetterIndexes.push(letter);
        });
    }

    /**
     * Returns a winner of current game, if two players have the same amount of points the one that made the last turn (and has the max points) will be set as winner, if two players have the same amount of points but neither of them guessed the word the first player with max points is returned.
     * @satisfies `roomState === 'Ended'` and `nextTurn()` is not called before this method
     * @returns {Player} player object
     */
    findWinner() {
        const winner = this.players.reduce((maxPlayer, currentPlayer) => {
            if (currentPlayer.points > maxPlayer.points) {
                return currentPlayer;
            } else if (currentPlayer.points === maxPlayer.points && currentPlayer.turn) {
                return currentPlayer;
            } else {
                return maxPlayer;
            }
        }, this.players[0]);
        return winner;
    }

    /**
     * @returns {Array} returns a array of letters of all guessed letters
     */
    getUsedLetters() {
        const letters = [];
        this.players.forEach(p => {
            p.guessedLetters.forEach(l => letters.push(l.char));
        });
        return letters;
    }

    /**
     * @returns specific data about the room for players, so no sensitive data is being shared
     */
    getRoomDataForPlayers() {
        const guessedLetters = this.guessedLetterIndexes.map(index => ({
            index: index,
            letter: this.word[index]
        }));

        return {
            roomID: this.roomID,
            roomState: this.roomState,
            playerNumber: this.playerNumber,
            players: this.getPlayers(), //U okviru ovoga se nalaze vec pogodjena slova
            wordLength: this.word.length,
            guessedLetters: guessedLetters,
        }
    }

    /**
     * @returns {Player[]} returns only specific data about players so that no sensitive data is being shared. Check {@linkcode Player.getPlayer()} for more information about getPlayer function.
     */
    getPlayers() {
        const arr = [];
        this.players.forEach(p => {
            arr.push(p.getPlayer());
        });
        return arr;
    }

    /**
     * Not used any more since {@linkcode Room.getRoomDataForPlayers()} was implemented
     * @deprecated
     * @returns 
     */
    getEndRoomData() {
        return {
            playerNumber: this.playerNumber,
            players: this.getPlayers().sort((a, b) => b.points - a.points),
            word: this.word,
        }
    }
}


/**
 * Used to generate unique non repeating codes.
 */
class RoomCodeManager {
    /**
     * Creates a code manager of size `codeLength`, default is 4
     * @param {Number} codeLength 
     */
    constructor(codeLength = 4) {
        this.codeLength = codeLength;
        this.usedCodes = new Set();
    }

    /**
     * @static
     * @param {number} min minimum value 
     * @param {number} max maximum value
     * @returns a random number from `min` to `max`
     */
    static randInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * Returns a code of length provided upon class creation (default is 4) and stores it in Set
     * @returns {number} generated code
     */
    generateCode() {
        const min = 0;
        const max = Math.pow(10, this.codeLength) - 1;
        let code = RoomCodeManager.randInt(min, max);

        if (this.usedCodes.size >= max) {
            throw new Error("No room available");
        }

        while (this.usedCodes.has(code)) {
            code = (code + 1) % max;
        }
        this.usedCodes.add(code);
        return code;
    }

    /**
     * Releases a code from the Set
     * @param {Number} code 
     */
    releaseCode(code) {
        this.usedCodes.delete(code)
    }
}

/** Class to generate a random word from `words` variable */
class WordManager {
    constructor() {
        this.words = [
            'kompjuter', 'stolica', 'mozak', 'tanjir', 'papir', 'sveska', 'olovka'
        ]
    }

    /**
     * @returns returns a random word from `WordManager.words` array
     */
    getOneWord() {
        return this.words[RoomCodeManager.randInt(0, this.words.length)];
    }
}

/**
 * Represents the core logic of the game, handling code and word generation as well as room management.
 * @class
 * @param {Object} io - The Socket.IO module instance. This should be passed as soon as the module is required, preferably immediately after importing it in the main file (e.g., `server.js`).
 * @example
 * // In the main file (e.g., server.js)
 * const io = require('socket.io')(server);
 * const rooms = require('./utils/userArr');
 * rooms.init(io);
 */
class GameRooms {
    /**Creates a 3 variables: `GameRooms.wordManager`, `GameRooms.roomCodeManager`, `GameRooms.currentRooms`. 
     * These variables are responsible for regulating rooms, codes and words.
     */
    constructor() {
        this.wordManager = new WordManager; 
        this.roomCodeManager = new RoomCodeManager;
        /**@type {Room[]} */
        this.currentRooms = [];
    }

    /**
     * Binds Socket.IO module instance to the GameRooms object.
     * @param {Object} io - The Socket.IO module instance
     */
    init(io) {
        this.io = io;
    }

    /**
     * @param {playerNumber} playerNumber number of players to be in the room - NUMBER
     * @returns returns room code upon successfully making the room - NUMBER
     */
    createRoom(playerNumber) {
        const roomCode = this.roomCodeManager.generateCode();
        const room = new Room(roomCode, playerNumber, this.wordManager.getOneWord(), this.deleteRoom.bind(this))
        this.currentRooms.push(room);


        room.emptyRoomDeletionTimeout(40);

        console.log(room);
        return roomCode;
    }

    /**
     * Deletes a room from the currentRoom array
     * Removes all sockets from that room
     * Releases the roomCode
     * @param {number} roomID 
     * @param {string} reason - Default value is undefined or empty string. This variable should be used when there is a specific reason for room deletion (e.g., `Ending mid game`, `Life time exceeded`)
     */
    deleteRoom(roomID, reason = "") {
        console.log("room with id:" + roomID + "got deleted");
        if (reason === 'Ending mid game'){
            this.io.to(roomID).emit('game:update:end', {room: this.currentRooms.find(rm => rm.roomID === roomID).getRoomDataForPlayers()});
        } else if (reason !== "") {
            this.io.to(roomID).emit('game:timeout', { msg: reason });
        }

        const r = this.currentRooms.find(rm => rm.roomID === roomID);
        if (r?.roomLifeTimeout) {
            clearTimeout(r.roomLifeTimeout);
        }

        this.io.socketsLeave(roomID);
        this.roomCodeManager.releaseCode(this.currentRooms.find((room) => (room.roomID === roomID)));
        this.currentRooms = this.currentRooms.filter(room => room.roomID !== roomID);
    }

    /**
     * Changes the state from 'Waiting' to 'Progress'. Emits socket.io event: `game:update:start` to all users in the given room, currently this event is not registered by frontend since `game:update` is being called at main file(server.js on event `game:join` line #109)
     * @param {number} roomID
     * @throws {Error} Occurs when number of physical players is not equal to number of players specified upon creation
     */
    startGame(roomID) {
        const roomToStart = this.currentRooms.find(room => room.roomID === roomID);
        roomToStart.updateState('Progress');
        /* Sanity check */
        if (roomToStart.players.length !== roomToStart.playerNumber) {
            this.deleteRoom(roomID);
            throw new Error("Couldnt start the game, this function was called when room wasnt full");
        }
        roomToStart.players[0].turn = true;
        roomToStart.roomLifeTimeout();
        this.io.to(roomID).emit('game:update:start', { room: roomToStart.getRoomDataForPlayers() });
    }

    /**
     * Saves the the data for each user in the given `roomID`. Method doesn't check what the roomState is, it saves to database anyway.
     * @async
     * @param {number} roomID 
     */
    async saveToDatabase(roomID) {
        const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];
        const vowel = ['a', 'e', 'i', 'o', 'u'];
        const room = this.currentRooms.find(r => r.roomID === roomID);
        const winner = room.findWinner();

        for (let i = 0; i < room.players.length; i++) {
            const player = room.players[i];
            const user = await User.findById(player.user.id);
            const currentWinStreak = winner.user.id === player.user.id ? user.stats.currentWinStreak + 1 : 0;
            user.stats = {
                ...(user.stats),
                gamesPlayed: user.stats.gamesPlayed + 1,
                gamesWon: user.stats.gamesWon + (winner.user.id === player.user.id ? 1 : 0),
                currentWinStreak: currentWinStreak,
                winStreak: (currentWinStreak > user.stats.winStreak ? currentWinStreak : user.stats.winStreak),
                lettersGuessed: user.stats.lettersGuessed + player.guessedLetters.length,
                vowelGuessed: user.stats.vowelGuessed + (() => {
                    let counter = 0;
                    player.guessedLetters.forEach(letter => {
                        if (consonants.includes(letter.char)) {
                            counter += 1;
                        }
                    });
                    return counter;
                })(),
                consonantsGuessed: user.stats.consonantsGuessed + (() => {
                    let counter = 0;
                    player.guessedLetters.forEach(letter => {
                        if (vowel.includes(letter.char)) {
                            counter += 1;
                        }
                    });
                    return counter;
                })(),
                wordsGuessed: user.stats.wordsGuessed + (player.turn ? 1 : 0),
                guessAttempts: user.stats.guessAttempts + player.guessedAttempts,
                lastGame: Date.now(),
            }
            user.save();
        }
    }
}

const rooms = new GameRooms;
module.exports = rooms;