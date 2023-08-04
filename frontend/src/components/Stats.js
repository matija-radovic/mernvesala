import React, { useContext, useState } from 'react'
import { UserContext } from '../context/UserContext'
import LastPageButton from './nav/LastPageButton';

const Stats = () => {
    const {userData } = useContext(UserContext);
    const [stats, setStats] = useState({
        "games played": `${ userData.user.stats.gamesWon} of ${ userData.user.stats.gamesPlayed}`,
        "win percentage": `${ userData.user.stats.gamesPlayed !== 0 ? (userData.user.stats.gamesWon / userData.user.stats.gamesPlayed) : "0"}%`,
        "current winstreak": `${userData.user.stats.currentWinStreak}`,
        "alltime best winstreak": `${userData.user.stats.winStreak}`,
        "letters guessed": `${userData.user.stats.lettersGuessed}`,
        "words gueseed": `${userData.user.stats.wordsGuessed}`,
        "guessing percentage": `${ userData.user.stats.guessAttempts !== 0 ? ((userData.user.stats.lettersGuessed + userData.user.stats.wordsGuessed) / userData.user.stats.lettersGuessed) : "0"}%`,
        "vowels guessed": `${userData.user.stats.vowelGuessed}`,
        "consonants guessed": `${userData.user.stats.consonantsGuessed}`,
        "last game": `${userData.user.stats.lastGame ? userData.user.stats.lastGame.slice(0, 10) + " " + userData.user.stats.lastGame.slice(11, 19) : "No data"}`
    });


    return (
        <div className="stats">
            <table>
                <thead>
                    <tr>
                        <th colSpan={"2"}><b>Stats</b></th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(stats).map((stat) => {
                        return <tr key={stat}>
                            <td>{stat}</td>
                            <td>{stats[stat]}</td>
                        </tr>
                    })}
                </tbody>
            </table>
            <LastPageButton/>
        </div>
    )
}

export default Stats