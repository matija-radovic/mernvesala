import React, { useContext, useState } from 'react'
import axios from 'axios';
import { UserContext } from '../context/UserContext'
import ErrorMsg from './ErrorMsg';
import ServerMsg from './ServerMsg';
import LastPageButton from './nav/LastPageButton';

const Settings = () => {
    const { userData, setUserData } = useContext(UserContext);
    const [newUserProperties, setNewUserProperties] = useState({
        oldPassword: "",
        name: userData.user.name,
        password: "",
        passwordAgain: ""
    });
    const [errorMsg, setErrorMsg] = useState();
    const [successMsg, setSuccessMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        try {
            if (newUserProperties.password !== newUserProperties.passwordAgain) {
                setErrorMsg("Password doesnt match");
                return;
            }

            console.log("New user that is parsed", newUserProperties);

            await axios.put('/api/users/profile', {
                name: newUserProperties.name,
                password: newUserProperties.password,
                oldPassword: newUserProperties.oldPassword
            }, { headers: { 'auth-token': userData.token } });

            setUserData({
                ...userData,
                user: {
                    ...userData.user,
                    name: newUserProperties.name
                }
            });

            console.log("Updated user: ", userData);
            setSuccessMsg("Saved changes");
            setNewUserProperties({
                oldPassword: "",
                name: newUserProperties.name,
                password: "",
                passwordAgain: ""
            });
        } catch (err) {
            err.response.data.msg ?
                setErrorMsg(err.response.data.msg) :
                setErrorMsg("Error has occured" + err);
        }

    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setNewUserProperties((oldUser) => {
            return {
                ...oldUser,
                [name]: value
            }
        });
    }


    return (
        <div className='settings'>
            <table>
                <thead>
                    <tr>
                        <th colSpan={"2"}><b>Base info</b></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>uid</td>
                        <td>{userData.user.id}</td>
                    </tr>
                    <tr>
                        <td>username</td>
                        <td>{userData.user.name}</td>
                    </tr>
                    <tr>
                        <td>date of creation</td>
                        <td>{userData.user.date.slice(0, 10) + " " + userData.user.date.slice(11, 19)}</td>
                    </tr>
                </tbody>
            </table>
            <form className="new-user-properties" onSubmit={handleSubmit}>
                <input
                    className="button"
                    type="password" name="oldPassword" value={newUserProperties.oldPassword} required onChange={handleChange} placeholder='Old password' />
                <input
                    className={`button ${newUserProperties.name !== userData.user.name ? 'changed' : ''}`}
                    type="text" name="name" value={newUserProperties.name} onChange={handleChange} placeholder='New username' />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "11px" }}>
                    <input
                        className={`button ${newUserProperties.password !== "" ? 'changed' : ''}`}
                        type="password" name="password" value={newUserProperties.password} onChange={handleChange} placeholder='New password' />
                    <input
                        className={`button ${newUserProperties.password !== "" ? ('changed ' + (newUserProperties.passwordAgain === newUserProperties.password ? 'matched-password' : '')) : ''} `}
                        type="password" name="passwordAgain" value={newUserProperties.passwordAgain} onChange={handleChange} placeholder='Retype new password' />
                </div>
                <input className="button" type="submit" value="Save Changes" />
                {errorMsg && <ErrorMsg style={{ marginRight: "22px" }} msg={errorMsg} />}{successMsg && <ServerMsg style={{ marginRight: "22px" }} msg={successMsg} />}
            </form>
            <LastPageButton/>
        </div>
    )
}

export default Settings