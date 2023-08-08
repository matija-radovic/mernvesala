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

    socket.on("room:join", (data) => {
        const user = data.user;
        const roomCode = data.roomCode
        const roomToJoin = rooms.currentRooms.find((room) => room.roomID === roomCode);

        //Valid request
        if (!user || !roomCode) {
            console.log("first");
            socket.emit('room:join:fail', { msg: `Error no user or no roomCode` });
            return;
        }

        //Room exists
        if (!roomToJoin) {
            console.log("second");
            socket.emit('room:join:fail', { msg: "no such room exists" });
            return;
        }

        //In-game?
        const userRoom = rooms.currentRooms.find(room => (room.players.find(player => player.user?.id === user.id)));
        if (userRoom) {
            //In different game
            if (userRoom !== roomToJoin) {
                console.log("third");
                socket.emit('room:join:fail', { msg: `You alread in a game with code: ${userRoom.roomID}` });
                return;
            }

            //In same game
            if (userRoom === roomToJoin) {
                console.log("All good u in that game");

                //Handle changing sockets
                try {
                    roomToJoin.joinRoom(user, socket.id);
                    socket.emit('room:join:success', { msg: "you are rejoining" });
                } catch (err) {
                    socket.emit('room:join:fail', { msg: `Error: ${err}` });
                }
                console.log(rooms);
                return;
            }
        }

        //Handle joining player
        try {
            roomToJoin.joinRoom(user, socket.id);
            if (roomToJoin.players.length === roomToJoin.playerNumber) {
                io.to(roomCode).emit('room:start');
            }
            socket.join(roomCode);
            socket.emit('room:join:success', { msg: "Joining the room" });
            io.to(roomCode).emit('room:update');
        } catch (err) {
            console.log("here");
            socket.emit('room:join:fail', { msg: `Error: ${err}` });
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
        if (move.length > 1) {
            //Reč
            if (!room.validWord(move)) {
                goodMove = false;
                player.addPoints(-2);
                io.to(roomID).emit('game:update', { room: room.getRoomDataForPlayers(), goodMove: goodMove });
                return;
            }
            ///////////////////////
            ////Handle end room////
            ///////////////////////
        } else if (move.length === 1) {
            //Slovo
            const arrayOfLetterIndexes = room.validLetter(move);

            //Ako nije pogodio nista
            if (arrayOfLetterIndexes.length === 0) {
                goodMove = false;
                player.addGuessedLetter(move, false);
                room.nextTurn();
                io.to(roomID).emit('game:update', { room: room.getRoomDataForPlayers(), goodMove: goodMove });
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
            
            if (room.word.length === room.guessedLetterIndexes.length) {
                io.to(roomID).emit('game:update:end', { room: room.getRoomDataForPlayers() });
                try {
                    await rooms.saveToDatabase(roomID);
                } catch (error) {
                    console.log(error);
                }

                /***
                 * Cuvanje u bazu
                 */


                ///////////////////////
                ////Handle end room////
                ///////////////////////
                return;
            }
            room.nextTurn();
            io.to(roomID).emit('game:update', { room: room.getRoomDataForPlayers(), goodMove: goodMove });
            return
        }
    })

    socket.on('room:leave', (data) => {
        const user = data.user;
        const roomID = data.roomID;
        const room = rooms.currentRooms.find(r => r.roomID === roomID);

        if (room.roomState !== "Waiting") {
            socket.emit('room:leave:fail', { msg: "You cant leave the game while its running" });
            return;
        }

        if (room.players.length < 2 || room.players.filter(player => player.status === "Online").length < 2) {
            rooms.currentRooms.deleteRoom(roomID);
            return;
        }

        try {
            room.leaveRoom(user, socket.id, 'leave');
            socket.leave(roomID);
            io.to(roomID).emit("room:update", { room });
        } catch (error) {
            socket.emit("room:leave:fail", { msg: "Leaving type is wrong:" });
        }
    });

    socket.on('disconnect', () => {
        /**
         * Double query jer javasciprt ne moze da smesti jedan parametar u jednu promenljivu osim ako ne napisem svoju foreach funkciju, a mrzi me
         */
        /*
        const room = rooms.currentRooms.find(r => (r.players.find(player => player.socketID === socket.id)));
        const user = room.players.find(player => player.socketID === socket.id);
        const roomID = room.roomID;

        if (room.roomState !== "Waiting") {
            room.leaveRoom(user, socket.id, 'disconnect');
            if (room.players.length < 2 || room.players.filter(player => player.status === "Online").length < 2) {
                //User disconnected mid game: TODO obraditi logiku kad se zavrsi jer su svi izasli iz sobe.
                rooms.currentRooms.deleteRoom(roomID);
                io.to(roomID).emit("room:update:end", { room });
                return;
            }
            return;
        }

        if (room.players.length < 2 || room.players.filter(player => player.status === "Online").length < 2) {
            rooms.currentRooms.deleteRoom(roomID);
            return;
        }

        try {
            room.leaveRoom(user, socket.id, 'disconnect');
            io.to(roomID).emit("room:update", { room });
        } catch (error) {
            socket.emit("room:leave:fail", { msg: "Leaving type is wrong:" });
        }
*/
        console.log("This socket left: " + socket.id)
    });
});


server.listen(port, () => {
    console.clear();
    console.log(`Vešala app listening on port ${port}`);
});