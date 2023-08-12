import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../context/UserContext';
import { AvatarContext } from '../../context/AvatarContext';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import LoadingAnimation from '../LoadingAnimation';
import Copy from '../../images/components/Copy';

const socket = io();

const Game = () => {
    const { roomID } = useParams();
    const { userData } = useContext(UserContext);
    const { pictures } = useContext(AvatarContext);
    const navigate = useNavigate();

    const [room, setRoom] = useState();
    const [avatarPosition, setAvatarPosition] = useState([
        { top: 0, left: 0, alignItems: 'flex-start', justifyContent: 'flex-start' },
        { bottom: 0, right: 0, alignItems: 'flex-end', justifyContent: 'flex-end' },
        { top: 0, right: 0, alignItems: 'flex-start', justifyContent: 'flex-end' },
        { bottom: 0, left: 0, alignItems: 'flex-end', justifyContent: 'flex-start' }
    ]);

    const [joined, setJoined] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");



    //console.log("rendering component, room:", room);

    useEffect(() => {
        console.log("emitted join");
        socket.emit('game:join', { user: { id: userData.user.id, name: userData.user.name }, roomID: roomID });

        socket.on('game:join:fail', ({ msg }) => {
            console.log('game:join:fail, msg:', msg);
            navigate('/main-menu', { replace: true });
        });

        socket.on('game:join:success', ({ msg, setupInfo }) => {
            console.log("game:join:success, msg:", msg);
            setAvatarPosition(prev => prev.slice(0, setupInfo.roomPlayerNumber));
        });


        socket.on('game:update', ({ room }) => {
            console.log('game:update');
            setRoom(room);
        });

        socket.on('game:update:move', ({ room, goodMove, guessedWord }) => {
            console.log('game:update:move');
            setRoom(room);
            if (guessedWord) {
                //display guessedword on screen
            }
        });

        socket.on('game:update:start', () => {
            setSuccessMsg('starting');
        });

        socket.on('game:update:end', ({ room, word }) => {
            //Display modal
            console.log('game:update:end');
            setRoom(room);
        });

        socket.on('game:update:move:err:fatal', ({ msg }) => {
            setErrorMsg(msg);
            //redirect
        });

        socket.on('game:update:move:err', ({ msg }) => {
            setErrorMsg(msg);
        });

        socket.on('game:leave:fail', ({ msg }) => {
            setErrorMsg(msg);
            //redirect posle nekog vremena
        });
        return () => {
            socket.off('game:join:fail');
            socket.off('game:join:success');
            socket.off('game:update');
            socket.off('game:update:start');
            socket.off('game:update:move');
            socket.off('game:update:end');
            socket.off('game:update:move:err');
            socket.off('game:update:move:err:fatal');
        };
    }, []);

    useEffect(() => {
        if (room !== undefined && room.players.length !== room.playersNumber) {
            setJoined(true);
        }
    }, [room]);

    const displayAvatars = () => {
        return avatarPosition.map((pos, index) => {
            const player = room.players[index];
            return (
                <>
                    {player ? (
                        <div className='player-info' style={{ position: 'absolute', display: 'flex', ...pos }} key={index}>
                            <div className={`avatar ${player.turn ? 'setted' : ''} ${player.status==='Offline' ? 'offline' : ''}`}>
                                <img src={pictures[player.user.picture]} alt='' />
                            </div>
                            {room.roomStatus !== 'Waiting' && (
                                <div className='info' style={{minWidth: "85px", minHeight: "85px"}}>
                                    <div className='letters'>
                                        {player.guessedLetters.map(letter => letter.char).join(', ')}
                                    </div>
                                    <div className='score'>
                                        {`Score: ${player.score}`}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='player-info' style={{ position: 'absolute', display: 'flex', ...pos }} key={index}>
                            <div className='avatar' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <div className='avatar waiting'>
                                    <div>Waiting...</div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )
        })
    }

    const displayCodenameOrWord = () => {
        if (room.roomState === 'Waiting') {
            return (
                <div className='game-center'>
                    <h1><b>Room code: </b>{room.roomID}</h1>
                    <h4>copy link <Copy height={"18px"} width={"18px"} onClick={() => { handleCopyToClipboard() }} /></h4>
                </div>
            );
        } else if (room.roomState === 'Progress') {
            const displayWord = new Array(room.wordLength);
            for (let i = 0; i < displayWord.length; i++) {
                const guessedLetter = room.guessedLetters.find(letter => { letter.index === i })
                displayWord[i] = guessedLetter?.letter ?? ' ';
            }
            return (
                <div className='game-center' style={{ top: "45%" }}>
                    <h1>
                        {displayWord.map((value) => {
                            return <p key={value}><u>{value}</u>{` `}</p>
                        })}
                    </h1>
                </div>
            )
        }
    }

    const handleCopyToClipboard = () => {
        const lastSlash = window.location.href.lastIndexOf('/');
        if (lastSlash === -1 || !navigator?.clipboard?.writeText) {
            console.log("couldnt log")
        }
        console.log(`${window.location.href.slice(0, lastSlash + 1) + room.roomID}`)
        navigator.clipboard.writeText(`${window.location.href.slice(0, lastSlash + 1) + room.roomID}`);
    }

    const displayInputField = () => {
        const userWhosTurnItIs = room.players.find(player => player.turn);
        
        //Is that user us?
        if(userWhosTurnItIs.name === userData.user.name){
            //yoooo its uss
            //display the keyboard
        } else {
            //not us bruh
        }

        return "";
    }

    return (
        <>
            {!joined ? <LoadingAnimation customLoadingText='room' /> :
                <div className="game">
                    {displayAvatars()}
                    {displayCodenameOrWord()}
                    {displayInputField()}
                </div>
            }
        </>
    )
}

export default Game