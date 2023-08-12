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

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;


db.once('open', () => console.log('Connected to DataBase!'));

app.use(express.json());
app.use('/api/users', usersRouter);
app.use('/api/games', gamesRouter);



io.on('connection', (socket) => {
    console.log("This socket joined: ", socket.id);

    socket.on("game:join", async ({ user, roomID }) => {
        console.log(`User trying to join: ${user.name}, roomID: ${roomID}`);
        console.log(`Rooms object`, rooms);
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

            //In same game
            if (userRoom === roomToJoin) {
                console.log("All good u in that game");

                //Handle changing sockets
                try {
                    await roomToJoin.joinRoom(user, socket.id);
                    socket.emit('game:join:success', { msg: "you are rejoining", setupInfo: {roomPlayerNumber: roomToJoin.playerNumber } });
                    socket.emit('game:update', {room: roomToJoin.getRoomDataForPlayers()})
                } catch (err) {
                    socket.emit('game:join:fail', { msg: `Error: ${err}` });
                }
                console.log(rooms);
                return;
            }
        }

        //Handle joining player
        try {
            await roomToJoin.joinRoom(user, socket.id);
            socket.join(roomID);
            socket.emit('game:join:success', { msg: "Joining the room", setupInfo: {roomPlayerNumber: roomToJoin.playerNumber }});
            io.to(roomID).emit('game:update', { room: roomToJoin.getRoomDataForPlayers() });
            if (roomToJoin.players.length === roomToJoin.playerNumber) {
                io.to(roomID).emit('game:update:start');
            }
        } catch (err) {
            console.log("here");
            socket.emit('game:join:fail', { msg: `Error: ${err}` });
        }
    });

    socket.on('game:move', async ({ userID, roomID, moveStr }) => {
        const room = rooms.currentRooms.find(r => r.id === roomID);

        if (!room) {
            socket.emit('game:update:move:err:fatal', { msg: "Wrong room" });
            return;
        }

        const player = room.players.find(p => p.id === userID);

        if (!player) {
            socket.emit('game:update:move:err:fatal', { msg: "Wrong player" });
            return;
        }

        if (!player.turn) {
            socket.emit('game:update:move:err', { msg: "not your move" });
            return;
        }

        const move = moveStr.toLowerCase().trim();
        const regex = /^[a-z]+$/;

        if (!regex.test(move)) {
            socket.emit('game:update:move:err', { msg: "String to match must contain only letters from a-z, and at least one letter" });
            return;
        }

        let goodMove = false;
        player.incrementAttempt();
        if (move.length > 1) {
            //Reč
            if (!room.validWord(move)) {
                goodMove = false;
                player.addPoints(-2);
                io.to(roomID).emit('game:update:move', { room: room.getRoomDataForPlayers(), goodMove: goodMove, guessedWord: move });
                return;
            }

            //Dodavanje koliko je slova pogodio sa jednom recju
            player.addPoints(move.length - room.guessedLetterIndexes);
            try {
                rooms.saveToDatabase(roomID);
            } catch (error) {
                console.log(error);
            }

            io.to(roomID).emit('game:update:end', { room: room.getRoomDataForPlayers(), word: room.word });

        } else if (move.length === 1) {
            //Slovo
            const arrayOfLetterIndexes = room.validLetter(move);

            //Ako nije pogodio nista
            if (arrayOfLetterIndexes.length === 0) {
                goodMove = false;
                player.addGuessedLetter(move, false);
                room.nextTurn();
                io.to(roomID).emit('game:update:move', { room: room.getRoomDataForPlayers(), goodMove: goodMove });
                return;
            }

            //Ako je uneo slovo koje je vec bilo uneto
            if (arrayOfLetterIndexes[0] === -1) {
                socket.emit('game:update:move:err', { msg: "Letter is already used" });
                return;
            }

            //Ako je pogodio slovo
            room.setGuessedIndexes(arrayOfLetterIndexes);
            player.addGuessedLetter(move, true);

            //Ako je zavrsio reč
            if (room.word.length === room.guessedLetterIndexes.length) {
                io.to(roomID).emit('game:update:end', { room: room.getRoomDataForPlayers() });
                try {
                    await rooms.saveToDatabase(roomID);
                } catch (error) {
                    console.log(error);
                }

                io.to(roomID).emit('game:update:end', { room: room.getRoomDataForPlayers(), word: room.word });

                return;
            }

            //Ako je pogodio samo jedno slovo a nije zavrsio reč
            room.nextTurn();
            io.to(roomID).emit('game:update:move', { room: room.getRoomDataForPlayers(), goodMove: goodMove });
            return
        }
    })

    socket.on('game:leave', ({ user, roomID }) => {
        const room = rooms.currentRooms.find(r => r.roomID === roomID);

        if (room.roomState !== "Waiting") {
            socket.emit('game:leave:fail', { msg: "You cant leave the game while its running" });
            return;
        }

        if (room.players.length < 2 || room.players.filter(player => player.status === "Online").length < 2) {
            socket.leave(roomID);
            rooms.currentRooms.deleteRoom(roomID);
            return;
        }

        try {
            room.leaveRoom(user, socket.id, 'leave');
            socket.leave(roomID);
            io.to(roomID).emit("game:update", { room });
        } catch (error) {
            socket.emit('game:leave:fail', { msg: "Leaving type is wrong:" });
        }
    });

    socket.on('disconnect', () => {
        const room = rooms.currentRooms.find(r => (r.players.find(player => player.socketID === socket.id)));
        //Da li je uopste u nekoj igri
        if (!room) {
            return;
        }
        const user = room.players.find(player => player.socketID === socket.id);
        const roomID = room.roomID;

        if (room.roomState !== "Waiting") {
            room.leaveRoom(user, socket.id, 'disconnect');
            if (room.players.length < 2 || room.players.filter(player => player.status === "Online").length < 2) {
                //User disconnected mid game: TODO obraditi logiku kad se zavrsi jer su svi izasli iz sobe.
                rooms.currentRooms.deleteRoom(roomID);
                io.to(roomID).emit("game:update:end", { room });
                return;
            }
            room.nextTurn();
            return;
        }

        if (room.players.length < 2 || room.players.filter(player => player.status === "Online").length < 2) {
            rooms.currentRooms.deleteRoom(roomID);
            return;
        }

        try {
            room.leaveRoom(user, socket.id, 'disconnect');
            io.to(roomID).emit("game:update", { room });
        } catch (error) {
            socket.emit("game:leave:fail", { msg: "Leaving type is wrong:" });
        }
        console.log("This socket left: " + socket.id)
    });
});


server.listen(port, () => {
    console.clear();
    console.log(`Vešala app listening on port ${port}`);
});