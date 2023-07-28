import React, { useContext, useState } from 'react';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import { ErrorMsg } from '../utils/ErrorMsg'

const Login = () => {
    const { userData, setUserData } = (UserContext);
    const [errorMsg, setErrorMsg] = useState();
    const [user, setUser] = useState({
        name: "",
        password: "",
    });

    //TO DO: napisati redirect ako si log-inovan isto i za registrovanje stranicu
    const handleSubmit = async (e) => {
        e.preventDefault();

    }

    return (
        <div>
            {errorMsg && <ErrorMsg msg={errorMsg}/>}
            <h1>Log in { } </h1>
            <form onSubmit={handleSubmit}>
                <label>User name:</label>
                <input type="text" name="name" value={user.name} required
                    onChange={handleChange} /><br />
                <label>Password:</label>
                <input type="password" name="password" value={user.password}
                    onChange={handleChange} /><br />
                <input type="submit" value="Login User!" />
            </form>
        </div>
    )
}

export default Login