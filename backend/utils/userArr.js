const User = require('../model/userModel');


class Letter {
    constructor(char, guessedRight) {
        this.char = char;
        this.guessedRight = guessedRight;
    }
}

class Player {
    /**
     * 
     * @param {User} user 
     * @param {String} socketID 
     */
    constructor(user, socketID) {
        this.user = user;
        this.socketID = socketID;
        this.turn = false;
        this.status = "Online" //Offline //this.onlineStatus = true/false
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
                name: this.user.name,
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

    addPoints(points) {
        this.points += points;
    }

    incrementAttempt() {
        this.guessedAttempts += 1;
    }
}

class Room {
    constructor(roomID, playerNumber, word, deleteRoomCallback) {
        this.roomID = roomID;
        this.roomState = "Waiting"; //"Progress" "Ended"
        this.playerNumber = playerNumber;
        this.players = [];
        this.word = word;
        this.guessedLetterIndexes = [];
        this.timeoutCreation = null;
        this.timeoutMove = null;
        this.timeoutExistance = null;
        this.deleteRoomCallback = deleteRoomCallback;
    }

    printArr() {
        this.players.forEach((p) => { console.log(`${p.user.name}`) })
    }

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
     * Information about socket change should be handled by the invoker of this function.
     * 
     * @param {User} user 
     * @param {String} socketID 
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
        //Time the user has to join the room
        if (this.timeoutCreation) {
            clearTimeout(this.timeoutCreation);
            this.timeoutCreation = null;
        }

        /*this.printArr();*/
    }

    /**
     * Based on type of leaving will change the status of the user from "Online" to "Offline" 
     * or remove him from the room if room state is "Waiting"
     * @param {User} user - user to be removed/changed status
     * @param {String} socketID 
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
     * Deletes the room after x amount of time
     * @param {Number} time 
     */
    emptyRoomDeletionTimeout(time = 40) {
        this.timeoutCreation = setTimeout(() => {
            this.timeoutCreation = null;
            if (this.players.length === 0) {
                this.deleteRoomCallback(this.roomID);
            }
        }, time * 1000) //sec
    }

    roomLifeTimeout() {
        this.timeoutExistance = setTimeout(() => {
            this.timeoutExistance = null;
            this.deleteRoomCallback(this.roomID, "Max ocupation of room is 40minutes");
        }, 40 * 60 * 1000)
    }

    /**
     * Find the next player turn
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

    setGuessedIndexes(arrayOfLetterIndexes) {
        arrayOfLetterIndexes.forEach(letter => {
            this.guessedLetterIndexes.push(letter);
        });
    }

    /**
     * Moramo da pazimo kada settujemo sledeci korak
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

    getUsedLetters() {
        const letters = [];
        this.players.forEach(p => {
            p.guessedLetters.forEach(l => letters.push(l.char));
        });
        return letters;
    }

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

    getPlayers() {
        const arr = [];
        this.players.forEach(p => {
            arr.push(p.getPlayer());
        });
        return arr;
    }

    getEndRoomData() {
        return {
            playerNumber: this.playerNumber,
            players: this.getPlayers().sort((a, b) => b.points - a.points),
            word: this.word,
        }
    }
}


class RoomCodeManager {
    /**
     * Creates a code manager of size `codeLength`, default is 4
     * @param {Number} codeLength 
     */
    constructor(codeLength = 4) {
        this.codeLength = codeLength;
        this.usedCodes = new Set();
    }

    static randInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * Returns a code of length provided upon class creation (default is 4) and stores it in Set
     * @returns {Number} generated code
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

class WordManager {
    constructor() {
        this.words = [
            'kompjuter', 'stolica', 'mozak', 'tanjir', 'papir', 'sveska', 'olovka'
        ]
    }

    getOneWord() {
        return this.words[RoomCodeManager.randInt(0, this.words.length)];
    }
}

class GameRooms {
    constructor() {
        this.wordManager = new WordManager; //Za definisanje reči
        this.roomCodeManager = new RoomCodeManager;
        this.currentRooms = [];
    }

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
     * @param {Number} roomID 
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
            clearInterval(r.roomLifeTimeout);
        }

        this.io.socketsLeave(roomID);
        this.roomCodeManager.releaseCode(this.currentRooms.find((room) => (room.roomID === roomID)));
        this.currentRooms = this.currentRooms.filter(room => room.roomID !== roomID);
    }

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
        this.io.to(roomID).emit('game:update:start', { room: roomToStart.getRoomDataForPlayers });
    }

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