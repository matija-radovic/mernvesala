import React, { useState, useContext } from 'react'
import { UserContext } from '../../context/UserContext'
import axios from 'axios'
import ErrorMsg from '../ErrorMsg'
import LastPageButton from '../nav/LastPageButton'
import { useNavigate } from 'react-router-dom'


const Register = () => {
    const { setUserData } = useContext(UserContext);
    const [errorMsg, setErrorMsg] = useState();
    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: "",
        password: "",
        passwordAgain: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const newUser = {
                name: user.name,
                password: user.password,
            }

            if (user.password !== user.passwordAgain) {
                setErrorMsg("Password doesnt match");
                return;
            } else {
                console.log(newUser);
            }
            await axios.post('/api/users/register', newUser);

            const loginResponse = await axios.post('/api/users/login', newUser);
            setUserData({
                token: loginResponse.data.token,
                user: loginResponse.data.user
            });
            localStorage.setItem("auth-token", loginResponse.data.token);

            setUser({
                name: "",
                password: "",
                passwordAgain: "",
            });

            navigate('/main-menu', {replace: true});

        } catch (err) {
            err.response.data.msg ? setErrorMsg(err.response.data.msg) :
                setErrorMsg("We have some error");
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
        <form onSubmit={handleSubmit} className="register">
            <h1>Register here!</h1>
            {errorMsg && <ErrorMsg msg={errorMsg} />}
            <input className="button" type="text" name="name" value={user.name} required
                onChange={handleChange} placeholder='Username' />
            <input className="button" type="text" name="password" value={user.password}
                onChange={handleChange} placeholder='Password'/>
            <input className="button" type="text" name="passwordAgain" value={user.passwordAgain}
                onChange={handleChange} placeholder='Password again'/>
            <input className="button" type="submit" value="Register User!" />
            <LastPageButton/>
        </form>
    )
}

export default Register