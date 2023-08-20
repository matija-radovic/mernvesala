import React, { useContext, useState } from 'react'
import axios from 'axios'
import { UserContext } from '../../context/UserContext'

import ErrorMsg from '../ErrorMsg';
import { useNavigate } from 'react-router-dom';
import LastPageButton from '../nav/LastPageButton';


const Login = () => {
    const navigate = useNavigate();
    const { setUserData } = useContext(UserContext);
    const [errorMsg, setErrorMsg] = useState();
    const [user, setUser] = useState({
        name: "",
        password: "",
    })

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newUser = {
                name: user.name,
                password: user.password,
            }

            const loginResponse = await axios.post('/api/users/login', newUser);

            setUserData({
                token: loginResponse.data.token,
                user: loginResponse.data.user
            });
            localStorage.setItem("auth-token", loginResponse.data.token);
            setUser({
                name: "",
                password: "",
            });

            navigate('/main-menu', {replace: true});
        } catch (err) {
            err.response.data.msg ?
                setErrorMsg(err.response.data.msg) :
                setErrorMsg("Error has occured" + err);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setUser(oldUser => {
            return {
                ...oldUser,
                [name]: value
            }
        })
    }



    return (
        <form onSubmit={handleSubmit} className="login">
            <h1>Log in</h1>
            <input className="button" type="text" name="name" value={user.name} required
                onChange={handleChange} placeholder='Username' />
            <input className="button" type="password" name="password" value={user.password}
                onChange={handleChange} placeholder='Password' />
            <input className="button" type="submit" value="Login User!" />
            {errorMsg && <ErrorMsg msg={errorMsg} />}
            <LastPageButton/>
        </form>
    )
}

export default Login