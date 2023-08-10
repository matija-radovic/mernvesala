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
                picture: this.picture
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

    incrementAttempt(){
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
        this.timeout = null;
        this.deleteRoomCallback = deleteRoomCallback;
    }

    printArr() {
        console.log("printing array");
        for (let i = 0; i < this.players.length; i++) {
            console.log(this.players[i])
        }
        console.log("finished printing array");
    }

    /**
     * Joins a user to room. If user is in the same room, `player.status` will be set to "Online" and if hes accessing from different socket, `socketID` will change to new one.
     * Information about socket change should be handled by the invoker of this function.
     * 
     * @param {User} user 
     * @param {String} socketID 
     * @throws {Error} If `Room.roomState` is in progress or ended, or room is full.
     */
    joinRoom(user, socketID) {
        this.printArr();
        const player = this.players.find(player => player.user?.id === user.id)
        if (player) {
            if (player.socketID !== socketID) {
                player.changeSocket(socketID);
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


        ///clear timeout
        this.players.push(new Player(user, socketID));
        this.printArr();
    }

    /**
     * Based on type of leaving will change the status of the user from "Online" to "Offline" 
     * or remove him from the room if room state is "Waiting"
     * @param {User} user - user to be removed/changed status
     * @param {String} socketID 
     * @param {String} type ['disconnect' | 'leave'] other types throw Error
     * @returns 
     */
    leaveRoom(user, socketID, type) {
        const discPlayer = this.players.find((player) => (player.user?.id === user.id));
        switch (type) {
            case "disconnect":
                if (this.roomState === "Waiting") {
                    //Uklanjanje iz sobe komplentno
                    this.players = this.players.filter((player) => (player === discPlayer));
                    return;
                }
                //Upitnik jer mozda se diskonektuje na kraj partije
                discPlayer?.changeStatus("Offline");
                break;
            case "leave":
                if (this.roomState === "Waiting") {
                    //Uklanjanje iz sobe komplentno
                    this.players = this.players.filter((player) => (player === discPlayer));
                    return;
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
     * Deletes the room if no one enters the room
     */
    roomDeletionTimeout() {
        this.timeout = setTimeout(() => {
            this.timeout = null;
            if (this.players.length === 0) {
                this.deleteRoomCallback(this.roomID);
            }
        }, 40 * 1000) //sec
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
                    return this.players[nextIndex];
                }
                nextIndex = (currentIndex + 1) % this.players.length;
            }
            throw new Error("Internal Server Error, Couldnt find next user");
        }
        throw new Error("Internal Server Error, couldn't find next player turn");
    }

    validWord(word) {
        if (word === this.word) {
            return true;
        }
        return false;
    }
    /**
     * 
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
        let max = -100000;
        let winner = undefined;
        this.players.forEach(player => {
            if (player.points >= max) {
                if(player.points === max && player.turn){
                    winner = player;
                }
            }
        });
        return winner;
    }

    getUsedLetters() {
        const letters = [];
        this.players.forEach(p => {
            p.guessedLetters.foreach(l => letters.push(l.char));
        });
        return letters;
    }

    getRoomDataForPlayers() {
        return {
            roomID: this.roomID,
            roomState: this.roomState,
            playerNumber: this.playerNumber,
            players: this.getPlayers(), //U okviru ovoga se nalaze vec pogodjena slova
            wordLength: this.word.length,
            guessedLetterIndexes: this.guessedLetterIndexes,
        }
    }

    getPlayers() {
        const arr = [];
        this.players.forEach(p => {
            arr.push(p.getPlayer());
        });
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

    /**
     * @param {playerNumber} playerNumber number of players to be in the room - NUMBER
     * @returns returns room code upon successfully making the room - NUMBER
     */
    createRoom(playerNumber) {
        const roomCode = this.roomCodeManager.generateCode();
        const room = new Room(roomCode, playerNumber, word, this.deleteRoom.bind(this))
        this.currentRooms.push(room);

        //If no one joined the room in 40seconds delete the room;
        room.roomDeletionTimeout();

        return roomCode;
    }

    /**
     * Deletes a room from the currentRoom array and releases the code
     * @param {Number} roomID 
     */
    deleteRoom(roomID) {
        this.roomCodeManager.releaseCode(this.currentRooms.find((room) => (room.roomID === roomID)));
        this.currentRooms = this.currentRooms.filter(room => room.roomID !== roomID);
    }

    async saveToDatabase(roomID) {
        const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];
        const vowel = ['a', 'e', 'i', 'o', 'u'];
        const room = this.room.find(r => r.roomID === roomID);
        const winner = room.findWinner();

        for (let i = 0; i < room.players.length; i++) {
            const player = room.players[i];
            const user = await User.findById(player.user.id);
            const currentWinStreak = user.stats.currentWinStreak +  (winner.id === player.id ? 1 : 0);
            user.stats = {
                gamesPlayed: user.stats.gamesPlayed + 1,
                gamesWon: user.stats.gamesWon + (winner.id === player.id ? 1 : 0),
                currentWinStreak: currentWinStreak,
                winStreak: (currentWinStreak > user.stats.winStreak ? currentWinStreak : user.stats.winStreak),
                lettersGuessed: user.stats.lettersGuessed + player.guessedLetters.length,
                vowelGuessed: user.stats.vowelGuessed + (()=> {
                    let counter = 0; 
                    player.guessedLetters.forEach(letter => {
                        if(consonants.includes(letter.char)){
                            counter += 1;
                        }
                    });
                    return counter;
                })(),
                consonantsGuessed: user.stats.consonantsGuessed + (()=> {
                    let counter = 0; 
                    player.guessedLetters.forEach(letter => {
                        if(vowel.includes(letter.char)){
                            counter += 1;
                        }
                    });
                    return counter;
                })(),
                wordsGuessed: user.stats.wordsGuessed + (player.turn ? 1 : 0),
                guessAttempts: user.stats.guessAttempts + player.guessAttempts,
                lastGame: Date.now(),
            }
            user.save();
        }
    }
}

const rooms = new GameRooms;
module.exports = rooms;