class Lobby {
    constructor(lobbyID, playerNumber) {
        this.lobbyID = lobbyID;
        this.roomState = "Waiting"; //"Progress" "Ended"
        this.playerNumber = playerNumber;
        this.players = new Array(playerNumber);
    }

    joinRoom(player) {
        if (this.roomState !== "Waiting") {
            throw new Error("Lobby is in progress");
        }

        for (let i = 0; i < this.playerNumber; i++) {
            if (!this.players[i]) {
                players[i] = player;
                return;
            }
        }

        throw new Error("Lobby is full");
    }

}

class RoomCodeManager {
    constructor(codeLength = 4) {
        this.codeLength = codeLength;
        this.usedCodes = new Set();
    }

    static randInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    generateCode() {
        const min = 0;
        const max = Math.pow(10, this.codeLength);
        let code = randInt(min, max);

        if (this.usedCodes.size >= max) {
            throw new Error("No room available");
        }

        while (this.usedCodes.has(code)) {
            code = (code + 1) % max;
        }
        this.usedCodes.add(code);
        return code;
    }

    releaseCode(code) {
        this.usedCodes.delete(code)
    }
}

class Rooms {
    constructor() {
        this.roomCodeManager = new RoomCodeManager;
        this.currentRooms = [];
    }

    createLobby(playerNumber) {
        this.currentRooms.push(new Lobby(this.roomCodeManager.generateCode(), playerNumber));
    }

    deleteLobby(lobbyID){
        this.currentRooms.filter(lobby => lobby.lobbyID !== lobbyID)
    }
}

module.exports = new Rooms;