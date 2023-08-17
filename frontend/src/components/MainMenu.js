import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SignOutLogo from '../images/components/SignOutLogo';
import SettingsLogo from '../images/components/SettingsLogo';
import SoundOn from '../images/components/SoundOn';
import SoundOff from '../images/components/SoundOff';
import Modal from './modal/Modal';
import ChoosePicture from './ChoosePicture'
import { AvatarContext } from '../context/AvatarContext';

const MainMenu = () => {
    const { userData, setUserData } = useContext(UserContext);
    const { pictures } = useContext(AvatarContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [sound, setSound] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalRedirect, setModalRedirect] = useState(location.state?.msg);
    const close = () => setModalOpen(false);
    const open = () => setModalOpen(true);
    const closeNavigationoModal = () => {setModalRedirect("");}

    useEffect(()=> {
        if(modalRedirect !== ""){
            window.history.replaceState({}, document.title);
        }
    }, [modalRedirect])

    

    const toggleSound = () => {
        setSound(!sound);
    }

    const logOut = () => {
        setUserData({
            ...userData,
            token: undefined,
            user: undefined,
        });
        localStorage.setItem("auth-token", "");

        navigate('/', { replace: true });
    }

    return (
        <div className='main-menu'>
            <div className='left-main-menu'>
                <SignOutLogo style={{ cursor: "pointer" }} width={40} height={40} onClick={logOut} />
            </div>
            <div className='center-main-menu'>
                <Link to='/create' className='button'>Create lobby</Link>
                <Link to='/join' className='button'>Enter lobby code</Link>
                <Link to='/stats' className='button'>My results</Link>
            </div>
            <div className='right-side-menu'>
                <div className='avatar' style={{ cursor: "pointer" }} onClick={() => modalOpen ? close() : open()}>
                    <img src={pictures[userData.user.picture]} alt="" />
                </div>
                <Link to='/settings'><SettingsLogo style={{ cursor: "pointer" }} width={40} height={40} /></Link>
                {sound ? <SoundOn style={{ cursor: "pointer" }} width={40} height={40} onClick={toggleSound} />
                    : <SoundOff style={{ cursor: "pointer" }} width={40} height={40} onClick={toggleSound} />}
            </div>
            <AnimatePresence
                initial={false}
                mode='wait'
                onExitComplete={() => null}>
                {modalOpen && <Modal modalOpen={modalOpen} handleClose={close}><ChoosePicture /></Modal>}
            </AnimatePresence>
            <AnimatePresence
                initial={false}
                mode='wait'
                onExitComplete={() => null}>
                {modalRedirect && <Modal modelOpen={modalRedirect} handleClose={closeNavigationoModal}>{modalRedirect}</Modal>}
            </AnimatePresence>
        </div>
    )
}

export default MainMenu