const router = require('express').Router();
const auth = require('../middleware/auth');
const rooms = require('../utils/userArr');

router.post('/create', auth, (req, res) => {
    const playerNumber = req.body.playerNumber;
    if(playerNumber > 4 || playerNumber < 2){
        return res.status(400).json({msg: "Invalid amount of players"});
    }

    const user = req.user;
    const userRoom = rooms.currentRooms.find(room => (room.players.find(player => player.user.id === user._id)));
    if(userRoom){
        return res.status(400).json({msg: `You are already in-game, room code: ${userRoom.roomID}`})
    }

    const roomCode = rooms.createRoom(playerNumber);
    console.log(rooms);
    return res.json({roomCode: roomCode});
});

router.get('/:id', auth, (req, res) => {
    const roomCode = req.params.id;
    if(rooms.currentRooms.find((room) => (room.roomID === roomCode))){
        return res.json({msg: "Room exists"});
    }
});


module.exports = router;