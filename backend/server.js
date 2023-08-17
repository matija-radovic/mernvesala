const express = require('express');
require('dotenv').config();
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 5000;
const mongoose = require('mongoose');
const usersRouter = require('./routes/users');
const gamesRouter = require('./routes/games');
const rooms = require('./utils/userArr');
rooms.init(io);

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;


db.once('open', () => console.log('Connected to DataBase!'));

app.use(express.json());
app.use('/api/users', usersRouter);
app.use('/api/games', gamesRouter);

const connectedUsers = {};

io.on('connection', (socket) => {
    console.log("This socket joined: ", socket.id);

    socket.on("game:join", async ({ user, roomID }) => {
        connectedUsers[socket.id] = [user.name, roomID];
        console.log(`User trying to join: ${user.name}, roomID: ${roomID}, socket.id: ${socket.id}`);
        /*console.log(`Rooms object`, {...rooms, io: undefined});*/
        roomID = parseInt(roomID);
        if (isNaN(roomID)) {
            console.log("Nan error");
            socket.emit('game:join:fail', { msg: `Room id can only contain numbers` });
            return;
        }

        const roomToJoin = rooms.currentRooms.find((room) => room.roomID === roomID);

        //Valid request
        if (!user || !roomID) {
            console.log("first");
            socket.emit('game:join:fail', { msg: `Error no user or no roomID` });
            return;
        }

        //Room exists
        if (!roomToJoin) {
            console.log("second");
            socket.emit('game:join:fail', { msg: "no such room exists" });
            return;
        }

        //In-game?
        const userRoom = rooms.currentRooms.find(room => (room.players.find(player => player.user?.id === user.id)));
        if (userRoom) {
            //In different game
            if (userRoom !== roomToJoin) {
                console.log("third");
                socket.emit('game:join:fail', { msg: `You alread in a game with code: ${userRoom.roomID}` });
                return;
            }

            //Handle rejoining the same game
            if (userRoom === roomToJoin) {
                //Handle changing sockets
                try {
                    //const prevUser = userRoom.players.find(player => player.user.id === user.id);
                    previousSocket = io.sockets.sockets.get((userRoom.players.find(player => player.user.id === user.id)).socketID);
                    await roomToJoin.joinRoom(user, socket);

                    //console.log('previous user', prevUser);
                    //console.log("previous socket", previousSocket);
                    if(socket !== previousSocket){
                        console.log('changed socket and emitted reconnect to old one');
                        previousSocket?.emit('game:reconnect', {msg: 'client joined the game from another tab'});
                        previousSocket?.leave(roomID);
                    }

                    socket.emit('game:join:success', { msg: "you are rejoining", setupInfo: { roomPlayerNumber: roomToJoin.playerNumber } });
                    io.to(roomID).emit('game:update', { room: roomToJoin.getRoomDataForPlayers() });
                } catch (err) {
                    socket.emit('game:join:fail', { msg: `Error: ${err}` });
                }
                return;
            }
        }

        //Handle joining new player
        try {
            console.log("Joining for the first time: ", user , socket.id);
            //Joining him into Room object
            await roomToJoin.joinRoom(user, socket);

            //Joining into socket
            socket.join(roomID);

            //Sending that its an succesful join and info about
            socket.emit('game:join:success', { msg: "Joining the room", setupInfo: { roomPlayerNumber: roomToJoin.playerNumber } });

            //If room is full then emit that game is started
            console.log("room to join: ", roomToJoin);
            console.log("Number of players in array: ", roomToJoin.players.length, typeof roomToJoin.players.length);
            console.log("number of players by variable: ", roomToJoin.playerNumber, typeof roomToJoin.playerNumber);
            console.log("Is this true?: ", roomToJoin.players.length === roomToJoin.playerNumber)
            if (parseInt(roomToJoin.players.length, 10) === parseInt(roomToJoin.playerNumber, 10)) {
                console.log("start room executed")
                rooms.startGame(roomID);
            }

            //Sending update request that is specific to ... being not specific
            io.to(roomID).emit('game:update', { room: roomToJoin.getRoomDataForPlayers() });

        } catch (err) {
            if (err.message === "Couldnt start the game, this function was called when room wasnt full") {
                socket.emit('game:update:start:fail', { msg: `Error: ${err}` });
            }
            console.log(err);
            socket.emit('game:join:fail', { msg: `Error: ${err}` });
        }
    });

    socket.on('game:move', async ({ userID, roomID, moveStr }) => {
        roomID = parseInt(roomID);
        const room = rooms.currentRooms.find(r => r.roomID === roomID);
        if (!room) {
            socket.emit('game:update:move:err:fatal', { msg: "Wrong room" });
            return;
        }
        const player = room.players.find(p => p.user.id === userID);
        if (!player) {
            socket.emit('game:update:move:err:fatal', { msg: "Wrong player" });
            return;
        }

        if (!player.turn) {
            socket.emit('game:update:move:err', { room: room.getRoomDataForPlayers(), msg: "not your move" });
            return;
        }

        const move = moveStr.toLowerCase().trim();
        const regex = /^[a-z]+$/;

        if (!regex.test(move)) {
            socket.emit('game:update:move:err', { room: room.getRoomDataForPlayers(), msg: "String to match must contain only letters from a-z, and at least one letter" });
            return;
        }

        let goodMove = false;
        player.incrementAttempt();
        if (move.length > 1) {
            //Reč
            const arrayOfLetterIndexes = room.validWord(move);
            if (!arrayOfLetterIndexes) {
                goodMove = false;
                player.addPoints(-1);
                room.nextTurn();
                io.to(roomID).emit('game:update:move', { room: room.getRoomDataForPlayers(), goodMove: goodMove, move: { guess: move, user: player.user.name } });
                return;
            }

            //Dodavanje koliko je slova pogodio sa jednom recju
            player.addPoints(move.length - room.guessedLetterIndexes.length);
            room.updateState('Ended');
            room.setGuessedIndexes(arrayOfLetterIndexes);
            io.to(roomID).emit('game:update:end', { room: room.getRoomDataForPlayers(), endRoomData: room.getEndRoomData() });
            try {
                await rooms.saveToDatabase(roomID);
            } catch (error) {
                console.log(error);
            }

            //Zavrsavanje partije
            rooms.deleteRoom(roomID);
            return;
        } else if (move.length === 1) {
            //Slovo
            const arrayOfLetterIndexes = room.validLetter(move);

            //Ako nije pogodio nista
            if (arrayOfLetterIndexes.length === 0) {
                console.log("nisi pogodio nista");
                goodMove = false;
                player.addGuessedLetter(move, false);
                room.nextTurn();
                io.to(roomID).emit('game:update:move', { room: room.getRoomDataForPlayers(), goodMove: goodMove, move: { guess: move, user: player.user.name } });
                return;
            }

            //Ako je uneo slovo koje je vec bilo uneto
            if (arrayOfLetterIndexes[0] === -1) {
                socket.emit('game:update:move:err', { room: room.getRoomDataForPlayers(), msg: "Letter is already used" });
                return;
            }

            //Ako je pogodio slovo
            player.addPoints(1);
            room.setGuessedIndexes(arrayOfLetterIndexes);
            player.addGuessedLetter(move, true);

            //Ako je zavrsio reč
            console.log('word length:', room.word.length, typeof room.word.length);
            console.log('number of guessed indexes:', room.guessedLetterIndexes.length);
            if (room.word.length === room.guessedLetterIndexes.length) {
                room.updateState('Ended');
                io.to(roomID).emit('game:update:end', { room: room.getRoomDataForPlayers(), word: room.word });
                try {
                    await rooms.saveToDatabase(roomID);
                } catch (error) {
                    console.log(error);
                }

                //Zavrsavanje partije
                rooms.deleteRoom(roomID);
                return;
            }

            //Ako je pogodio samo jedno slovo a nije zavrsio reč
            goodMove = true;
            room.nextTurn();
            io.to(roomID).emit('game:update:move', { room: room.getRoomDataForPlayers(), goodMove: goodMove, move: { guess: move, user: player.user.name } });
            return;
        }
    })

    socket.on('game:leave', ({ user, roomID }) => {
        roomID = parseInt(roomID);
        const roomToLeave = rooms.currentRooms.find((room) => room.roomID === roomID);
        try {
            console.log("trying to leave")
            roomToLeave.leaveRoom(user, socket, 'leave');
            io.to(roomID).emit('game:update', { room: roomToLeave.getRoomDataForPlayers() });
            console.log("who left in da room", roomToLeave);
        } catch (error) {
            console.log("yoo we got a error" + error)
            if(!roomToLeave){
                socket.emit('game:leave:fail', {msg:'room-undefined'})
            }
            socket.emit('game:leave:fail', { msg: "Leaving type is wrong or " + error});
        }
    });

    socket.on('disconnect', () => {
        console.log("User Disconnected: ", socket.id);
        console.log("connectedUsers", connectedUsers);
        console.log("rooms");
        console.log(io.of("/").adapter.rooms);
        console.log("sockets");
        console.log(io.of("/").adapter.sids);
        const room = rooms.currentRooms.find(r => (r.players.find(player => player.socketID === socket.id)));
        //Da li je uopste u nekoj igri
        if (!room) {
            return;
        }
        const user = room.players.find(player => player.socketID === socket.id);
        const roomID = room.roomID;
        console.log("room player was in", room);

        room.leaveRoom({ id: user.user.id, name: user.user.name }, socket.id, 'disconnect');

        /*Da li se izbrasila soba?*/
        if (rooms.currentRooms.includes(room)) {
            io.to(roomID).emit('game:update:offline', { room: room.getRoomDataForPlayers(), msg: `Player ${user.user.name} disconnected` });
            return;
        }
        console.log("This socket left: " + socket.id)
    });
});


server.listen(port, () => {
    //console.clear();
    console.log(`Vešala app listening on port ${port}`);
});