import React, { useContext, useEffect, useRef, useState } from 'react'
import { UserContext } from '../../context/UserContext';
import { AvatarContext } from '../../context/AvatarContext';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import LoadingAnimation from '../LoadingAnimation';
import Copy from '../../images/components/Copy';
import SignOutLogo from '../../images/components/SignOutLogo';
import Modal from '../modal/Modal'
import ErrorMsg from '../ErrorMsg';
import ServerMsg from '../ServerMsg';
import EndScreen from './EndScreen';
import { motion, AnimatePresence } from 'framer-motion';

const socket = io();

const Game = () => {
    const { roomID } = useParams();
    const { userData } = useContext(UserContext);
    const { pictures } = useContext(AvatarContext);
    const navigate = useNavigate();

    const [room, setRoom] = useState();
    const [avatarPosition, setAvatarPosition] = useState([
        { profileBlock: { top: 0, left: 0, flexDirection: 'row' }, infoBlock: { marginBottom: "auto" } },
        { profileBlock: { bottom: 0, right: 0, flexDirection: 'row-reverse' }, infoBlock: { marginTop: "auto" } },
        { profileBlock: { top: 0, right: 0, flexDirection: 'row-reverse' }, infoBlock: { marginBottom: "auto" } },
        { profileBlock: { bottom: 0, left: 0, flexDirection: 'row' }, infoBlock: { marginTop: "auto" } }
    ]);

    const [joined, setJoined] = useState(false);
    const [successMsg, setSuccessMsg] = useState(""); //Future implementations for displaying that the move is sent correctly
    const [errorMsg, setErrorMsg] = useState("");

    const [moveInfo, setMoveInfo] = useState(undefined);
    const [move, setMove] = useState("");
    //const [guessDisabled, setGuessDisabled] = useState(false); //Maybe future implementations
    const [validMove, setValidMove] = useState(false);
    const [allTriedLetters, setAllTriedLetters] = useState([]);
    const dropIn = {
        hidden: {
            y: "-70vh",
            opacity: 0.1
        },
        visible: {
            y: "0",
            opacity: 1,
            transition: {
                duration: 0.2,
            }
        },
        exit: {
            opacity: 0.1,
        }
    }

    const queue = useRef(0);
    const isJoining = useRef(false);

    const joinGame = function () {
        if (queue.current > 0) {
            return;
        }
        if (isJoining.current) {
            queue.current++; return;
        }
        isJoining.current = true;
        socket.emit('game:join', { user: { id: userData.user.id, name: userData.user.name }, roomID: roomID });
    }

    const processQueue = function () {
        //Additional check
        if (queue.current === 0) {
            return;
        }
        isJoining.current = true;
        queue.current -= 1;
        socket.emit('game:join', { user: { id: userData.user.id, name: userData.user.name }, roomID: roomID });
    }



    useEffect(() => {
        joinGame();

        socket.on('game:join:fail', ({ msg }) => {
            console.log('game:join:fail, msg:', msg);
            isJoining.current = false;
            if (queue.current > 0) {
                processQueue(); return;
            }
            navigate('/main-menu', { replace: true });
        });

        socket.on('game:join:success', ({ msg, setupInfo }) => {
            console.log("game:join:success, msg:", msg);
            isJoining.current = false;
            if (queue.current > 0) {
                processQueue();
            }
            setAvatarPosition(prev => prev.slice(0, setupInfo.roomPlayerNumber));
        });


        socket.on('game:update', ({ room }) => {
            console.log('game:update');
            setRoom(room);
        });

        socket.on('game:update:move', ({ room, goodMove, move }) => {
            console.log('game:update:move');
            //Display the failled move at the top of the screen
            setRoom(room);
            if (move.guess.length === 1) {
                console.log("When update:move is called we recived a move: ", move.guess, "And proceed to set it in a list of available letters");
                setAllTriedLetters(prev => [...prev, move.guess])
            }
            setMoveInfo({
                goodMove: goodMove,
                info: `${(goodMove ? 'Good move by ' : 'Bad move by ') + move.user}, tried "${move.guess}"`
            });
            setTimeout(() => {
                setMoveInfo(undefined);
            }, 10000);
        });

        socket.on('game:update:end', ({ room, endRoomData }) => {
            //Modal displays based on room state, endRoomData is useless/depricated
            console.log('game:update:end');
            setRoom(room);
        });

        socket.on('game:update:move:err:fatal', ({ msg }) => {
            console.log('game:update:move:err:fatal');
            setErrorMsg(msg);
            navigate('/main-menu', { replace: true, state: { msg: msg } })
        });

        socket.on('game:update:move:err', ({ room, msg }) => {
            console.log('game:update:move:err');
            setErrorMsg(msg);
            setRoom(room);
        });

        socket.on('game:leave:fail', ({ msg }) => {
            console.log('game:leave:fail ' + msg);
            if (msg === 'room-undefined') {
                navigate('/main-menu', { replace: true })
            }
            setMoveInfo({ info: msg, goodMove: false });
        });

        socket.on('game:leave:success', ({ msg }) => {
            console.log('game:leave:success' + msg);
            setMoveInfo({ info: msg, goodMove: false });
            navigate('/main-menu', { replace: true, state: { msg: msg } });
        });

        socket.on('game:update:start', ({room}) => {
            console.log('game:update:start');
            //Currently not in use since addition of event game:update
        })
        socket.on('game:update:start:fail', ({ msg }) => {
            console.log('game:update:start:fail');
            setMoveInfo({ info: msg, goodMove: false });
            navigate('/main-menu', { replace: true, state: { msg: msg } })
        });

        socket.on('game:timeout', ({ msg }) => {
            console.log('game:timeout');
            setMoveInfo({ info: msg, goodMove: false });
            navigate('/main-menu', { replace: true, state: { msg: msg } })
        })

        socket.on('game:update:offline', ({ room, msg }) => {
            console.log('game:update:offline');
            setMoveInfo({ info: msg, goodMove: false });
            setRoom(room);
        })

        socket.on('game:reconnect', ({ msg }) => {
            console.log('game:reconnect');
            navigate('/main-menu', { replace: true, state: { msg: msg } })
        });

        return () => {
            socket.off('game:join:fail');
            socket.off('game:join:success');
            socket.off('game:leave:fail');
            socket.off('game:leave:success');
            socket.off('game:timeout');
            socket.off('game:reconnect');
            socket.off('game:update');
            socket.off('game:update:move');
            socket.off('game:update:start');
            socket.off('game:update:start:fail');
            socket.off('game:update:end');
            socket.off('game:update:offline');
            socket.off('game:update:move:err');
            socket.off('game:update:move:err:fatal');
        };
    }, []);

    useEffect(() => {
        if (room !== undefined && room.players.length !== room.playersNumber) {
            setJoined(true);
        }
    }, [room]);

    const handleLeave = () => {
        socket.emit('game:leave', { user: { id: userData.user.id, name: userData.user.name }, roomID: roomID })
    }

    const displayAvatars = () => {
        return avatarPosition.map((pos, index) => {
            const player = room.players[index];
            return (
                <React.Fragment key={index}>
                    {player ? (
                        <div className='player-info' style={{ position: 'absolute', display: 'flex', gap: "5px", ...(pos.profileBlock) }} >
                            <div className={`avatar ${player.turn ? 'setted' : ''} ${player.status === 'Offline' ? 'offline' : ''}`}>
                                <img className={player.status === 'Offline' ? 'offline' : ''} src={pictures[player.user.picture]} alt='' />
                            </div>
                            {room.roomState !== 'Waiting' && (
                                <div className='info' style={{ minWidth: "85px", minHeight: "85px", textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className='letters'>
                                        {player.guessed.map(letter => letter.char).join(', ')}
                                    </div>
                                    <div className='score' style={{ ...(pos.infoBlock) }}>
                                        {`Score: ${player.points}`}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='player-info' style={{ position: 'absolute', display: 'flex', ...(pos.profileBlock) }} >
                            <div className='avatar' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <div className='avatar waiting'>
                                    <div>Waiting...</div>
                                </div>
                            </div>
                        </div>
                    )}
                </React.Fragment>
            )
        })
    }

    const displayCodenameOrWord = () => {
        if (room.roomState === 'Waiting') {
            return (
                <div className='game-center'>
                    <h1><b>Room code: </b>{room.roomID}</h1>
                    <h4>copy link <Copy height={"18px"} width={"18px"} onClick={() => { handleCopyToClipboard() }} /></h4>
                    <div className='leave-game'><SignOutLogo onClick={() => handleLeave()} style={{ cursor: 'pointer' }} /></div>
                </div>
            );
        } else if (room.roomState === 'Progress') {
            const displayWord = new Array(room.wordLength);
            for (let i = 0; i < displayWord.length; i++) {
                const guessedLetter = room.guessedLetters.find(letter => letter.index === i)
                displayWord[i] = guessedLetter?.letter;
            }

            return (
                <div className='game-center'>
                    <h1 className='letters' style={{ width: "100%", display: "flex", alignItems: 'center', justifyContent: 'center' }}>
                        {displayWord.map((value, index) => {
                            return <p key={index}><u>{value ? value : <>&nbsp;</>}</u>{index !== displayWord.length - 1 ? <>&nbsp;</> : ''}</p>
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

    const handleChange = (e) => {
        const { value } = e.target
        setMove(value);

        if (value.length === 1 && allTriedLetters && !allTriedLetters.includes(value)) {
            setValidMove(true); return;
        }
        if (value.length > 1 && value.length === room.wordLength) {
            setValidMove(true); return;
        }
        setValidMove(false);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validMove) {
            socket.emit('game:move', { userID: userData.user.id, roomID: roomID, moveStr: move });
            setMove("");
            setValidMove(false);
            setSuccessMsg('guess sent!');
            return;
        }

        if (move.length === 0) {
            setErrorMsg('This field cant be empty');
        }
        if (move.length === 1 && allTriedLetters.includes(move)) {
            setErrorMsg('Letter is already guessed');
        }
        if (move.length > 1 && move.length !== room.wordLength) {
            setErrorMsg('Word needs to be ' + room.wordLength + " characters long!")
        } else {
            console.log('nothing launched');
        }
    }


    //move,setMove for dis
    const displayInputField = () => {
        const userWhosTurnItIs = room.players.find(player => player.turn === true);

        //Is that user us?
        if (userWhosTurnItIs?.user.name === userData.user.name && room.roomState !== 'Ended') {
            return (
                <motion.div className='motion-move-input'
                    onClick={(e) => e.stopPropagation()}
                    variants={dropIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <form className='move-input' onSubmit={handleSubmit}>
                        <div className='move-input-wrapper'>
                            <input className={`button ${move !== "" ? ('changed ' + (validMove && 'valid')) : ""}`} type="text" name="name" value={move} onChange={handleChange} placeholder='Enter a letter or word' required />
                            <input className={`button`} type='submit' value="Guess!!" />
                            {errorMsg && <ErrorMsg className='invalid-move-error-msg' msg={errorMsg} />}
                        </div>
                    </form>
                </motion.div>
            )
        }
    }

    const handleClose = () => {
        window.location = '/main-menu'
        //navigate('/main-menu', { replace: true });
    }

    const generateEndRoomData = () => {
        const sortedPlayers = [...(room.players)].sort((a, b) => b.points - a.points);
        const myPosition = sortedPlayers.findIndex(player => player.user.name === userData.user.name);
        const displayWord = new Array(room.wordLength);
        for (let i = 0; i < displayWord.length; i++) {
            const guessedLetter = room.guessedLetters.find(letter => letter.index === i)
            displayWord[i] = guessedLetter?.letter;
        }
        console.log("end room data", {
            playerNumber: room.playerNumber,
            players: sortedPlayers,
            word: displayWord,
            myPosition: myPosition
        })
        return {
            playerNumber: room.playerNumber,
            players: sortedPlayers,
            word: displayWord,
            myPosition: myPosition
        }
    }

    const displayEndModal = () => {
        if (room.roomState === "Ended") {
            const roomData = generateEndRoomData();
            console.log(roomData);
            return (
                <Modal handleClose={handleClose} style={{ padding: "0" }}><EndScreen endRoomData={roomData} /></Modal>
            );
        }
    }

    return (
        <>
            {!joined ? <LoadingAnimation customLoadingText='room' /> :
                <div className="game">
                    {moveInfo ? (moveInfo.goodMove ? <ServerMsg className={`good-move`} msg={moveInfo.info} /> : <ErrorMsg className={`bad-move`} msg={moveInfo.info} />) : ""}
                    {displayAvatars()}
                    {displayCodenameOrWord()}
                    <AnimatePresence
                        initial={false}
                        mode='wait'
                        onExitComplete={() => null}>
                        {displayInputField()}
                        {displayEndModal()}
                    </AnimatePresence>
                </div>
            }
        </>
    )
}

export default Game