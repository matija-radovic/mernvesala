import React, { useContext, useState } from 'react'
import { UserContext } from '../context/UserContext'
import LastPageButton from './nav/LastPageButton';

const CreateLobby = () => {
    const { userData } = useContext(UserContext);
    const [num, setNum] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newNum = num;

        setNum(undefined);
    }

    const handleChange = (e) => {
        const { name, value } = e.target
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
            <LastPageButton/>
        </div>
    )
}

export default CreateLobby