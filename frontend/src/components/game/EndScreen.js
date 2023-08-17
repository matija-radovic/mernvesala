import React from 'react'

const EndScreen = ({ endRoomData, ...props }) => {
    const position = [
        { heading: "🎉🏆🏆 WINNER 🏆🏆🎉", alt: "" },
        { heading: "🎉ALMOST A WINNER🎉", alt: "🙁TOO BAAD🙁" },
        { heading: "👍GOOD JOB NOT LAST👍", alt: "🙁🙁YOU ARE BAD🙁🙁" },
        { heading: "♻️🗑️TRASH🗑️♻️", alt: "" }
    ];

    function romanize(num) {
        var lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }, roman = '', i;
        for (i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman;
    }

    const displayHeading = () => {
        console.log("this the endRoomData we got", endRoomData);
        if (endRoomData.playerNumber === 2 && endRoomData.myPosition === 1) {
            return position[endRoomData.myPosition].alt;
        }

        if (endRoomData.playerNumber === 3 && endRoomData.myPosition === 2) {
            return position[endRoomData.myPosition].alt;
        }

        return position[endRoomData.myPosition].heading;
    }

    return (
        <div className={`end-screen`} {...props}>
            <div className='end-screen-heading-wrap'><h1 className='end-screen-heading'>{displayHeading()}</h1></div>
            <div className='end-screen-group'>
                <div className='names-scores'>
                    {endRoomData.players.map((player, index) => { 
                        return (
                            <div className='end-screen-player' key={index}>
                                <p className='player-roman-position'>{romanize(index + 1)}.</p>
                                <p className='player-name'>- {player.user?.name}</p> {/* Use player.user?.name */}
                                <p className='player-points'>{player.points}</p>
                                <p className='points-text'>&nbsp;&nbsp;points</p>
                            </div>
                        );
                    })}
                </div>
                <div className='end-screen-word'>
                    <div className='word-is'><h1>WORD IS:</h1></div>
                    <h1 className='letters' style={{ width: "100%", display: "flex", alignItems: 'center', justifyContent: 'center' }}>
                        {endRoomData.word.map((value, index) => {
                            return <p key={index}><u>{value ? value : <>&nbsp;</>}</u>{index !== endRoomData.word.length - 1 ? <>&nbsp;</> : ''}</p>
                        })}
                    </h1>
                </div>
            </div>
        </div>
    )
}

export default EndScreen