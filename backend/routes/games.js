const router = require('express').Router();
const auth = require('../middleware/auth');
const rooms = require('../utils/userArr');

//Creates a game with req.body.playerNumber of players
router.post('/create', auth, (req, res) => {
    const playerNumber = parseInt(req.body.playerNumber, 10);
    if (playerNumber > 4 || playerNumber < 2) {
        return res.status(400).json({ msg: "Invalid amount of players" });
    }

    const user = req.user;
    const userRoom = rooms.currentRooms.find(room => (room.players.find(player => player.user.id === user._id)));
    if (userRoom) {
        return res.status(400).json({ msg: `You are already in-game, room code: ${userRoom.roomID}` })
    }

    const roomCode = rooms.createRoom(playerNumber);
    console.log("Created new Room: ");
    return res.json({ roomCode: roomCode });
});

//Checks if the room is available
router.post('/join', auth, (req, res) => {
    const user = req.user;

    const roomCode = parseInt(req.body.roomCode);
    const roomToJoin = rooms.currentRooms.find((room) => room.roomID === roomCode);
    const userRoom = rooms.currentRooms.find(room => (room.players.find(player => player.user.id === user._id)));

    console.log("roomToJoin:", roomToJoin);
    console.log("userRoom:", userRoom);

    if (userRoom && userRoom.roomID !== roomToJoin?.roomID) {
        return res.status(400).json({ msg: `You are already in-game, room code: ${userRoom.roomID}` })
    }

    if (!roomToJoin) {
        return res.status(400).json({ msg: "Such room doesnt exist" });
    }

    return res.json(null);
});


module.exports = router;