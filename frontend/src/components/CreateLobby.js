import React, { useContext, useState } from 'react'
import axios from 'axios';
import { UserContext } from '../context/UserContext'
import LastPageButton from './nav/LastPageButton';
import ErrorMsg from './ErrorMsg'
import { useNavigate } from 'react-router-dom';


const CreateLobby = () => {
    const { userData } = useContext(UserContext);
    const navigate = useNavigate();
    const [num, setNum] = useState(2);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(undefined);
        try {
            const response = await axios.post('/api/games/create', { 
                playerNumber: num
            }, { headers: { 'auth-token': userData.token } });
            if(response.data.roomCode){
                navigate(`/game/${response.data.roomCode}`, {replace: true});
            }
        } catch (err) {
            console.log(err);
            err.response.data.msg ?
                setErrorMsg(err.response.data.msg) :
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
                <h1>Number of people:</h1>
                <input className="button" type="number" name="name" value={num} min="2" max="4" required
                    onChange={handleChange} />
                <input className="button"type="submit" value="Create" />
            </form>
                {errorMsg && <ErrorMsg msg={errorMsg} />}
            <LastPageButton/>
        </div>
    )
}

export default CreateLobby