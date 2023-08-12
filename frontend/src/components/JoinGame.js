import React, { useContext, useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import LastPageButton from './nav/LastPageButton';
import ErrorMsg from './ErrorMsg';

const JoinGame = () => {
    const navigate = useNavigate();
    const { userData } = useContext(UserContext);
    const [errorMsg, setErrorMsg] = useState("");
    const [num, setNum] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newNum = num;
        try {
            await axios.post(`/api/games/join`, {
                roomCode: num
            }, { headers: { 'auth-token': userData.token } });
            navigate(`/game/${newNum}`, { replace: true });
        } catch (err) {
            console.log(err);
            err.response.data.msg ? setErrorMsg(err.response.data.msg) :
                setErrorMsg("Error has occured");
        }
        setNum(0);
    }

    const handleChange = (e) => {
        const { value } = e.target
        setNum(value);
    }

    return (
        <div>
            <form onSubmit={handleSubmit} className="create-lobby">
                <h1>Enter lobby code:</h1>
                <input className="button" type="number" name="name" value={num} min="0" required
                    onChange={handleChange} />
                <input className="button" type="submit" value="Join" />
                {errorMsg && <ErrorMsg msg={errorMsg} />}
            </form>
            <LastPageButton />
        </div>
    )
}

export default JoinGame