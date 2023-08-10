import React, { useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'
import { UserContext } from '../../context/UserContext';

const socket = io();

const Game = () => {
    const {userData} = useContext(UserContext);
    const [players, setPlayers] = useState([]);
    const [room, setRoom] = useState(undefined);

    useEffect(()=>{

    }, []);

    return (
        <div>

        </div>
    )
}

export default Game