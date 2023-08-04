import React, { useContext, useState } from 'react'
import { UserContext } from '../context/UserContext';
import LastPageButton from './nav/LastPageButton';

const JoinGame = () => {
  const { userData } = useContext(UserContext);
  const [num, setNum] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newNum = num;

    setNum(0);
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setNum(value);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="create-lobby">
        <h1>Enter lobby code:</h1>
        <input className="button" type="number" name="name" value={num} min="100000" max="999999" required
          onChange={handleChange} />
        <input className="button" type="submit" value="Join" />
      </form>
      <LastPageButton/>
    </div>
  )
}

export default JoinGame