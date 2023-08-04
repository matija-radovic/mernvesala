import React, { useContext, useState } from 'react';
import axios from 'axios';
import { AvatarContext } from '../context/AvatarContext';
import { UserContext } from '../context/UserContext'
import ErrorMsg from './ErrorMsg';
import ServerMsg from './ServerMsg'



const ChoosePicture = () => {
    const { userData, setUserData } = useContext(UserContext);
    const { pictures } = useContext(AvatarContext);
    const [currentPicture, setCurrentPicture] = useState(userData.user.picture);///Koja god da je vrednost unutar userData treba da bude pocetna
    const [errorMsg, setErrorMsg] = useState();
    const [successMsg, setSuccessMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/users/profile', { picture: currentPicture }, { headers: { 'auth-token': userData.token } });
            setUserData({
                ...userData,
                user: {
                    ...(userData.user),
                    picture: currentPicture
                }
            });
            console.log(userData);
            setSuccessMsg("Saved changes");
        } catch (err) {
            err.response.data.msg ?
                setErrorMsg(err.response.data.msg) :
                setErrorMsg("Error has occured" + err);
        }
    }

    const handleChange = (pic) => {
        if (pictures[currentPicture] === pic) return;
        if (successMsg) { setSuccessMsg(""); setErrorMsg(undefined);};
        setCurrentPicture(pictures.indexOf(pic));
    }

    const isSelected = (pic) => {
        return (pic === pictures[currentPicture] ? " selected" : "") + (pic === pictures[userData.user.picture] ? " setted" : "");

    }

    return (
        <form className="modal-choose-picture" onSubmit={handleSubmit}>
            <div className='choose-picture'>
                {pictures.map((pic) => {
                    return (
                        <div key={pic} className={"avatar" + isSelected(pic)} style={{ cursor: "pointer" }} onClick={() => handleChange(pic)}>
                            <img src={pic} alt="" />
                        </div>
                    )
                })}
            </div>
            <div className='choose-picture-submit'>
                <input className="button" type="submit" value="Save changes" style={{ cursor: "pointer" }} />
                {errorMsg && <ErrorMsg style={{marginRight: "22px"}} msg={errorMsg} />}{successMsg && <ServerMsg style={{marginRight: "22px"}} msg={successMsg}/>}
            </div>
        </form>
    )
}

export default ChoosePicture