import React, { useContext } from 'react'
import { UserContext } from '../context/UserContext';
import LoadingAnimation from './LoadingAnimation';
import { Navigate, Outlet } from 'react-router-dom';
/*
const authStates = {
    "auth-required": "/login",
    "guest-access": "/main-menu",
    "public": "/"
}
*/
const RequireAuthLayout = (params) => {
    const { userData } = useContext(UserContext);
    const authRequirement = params.auth;
    return (
        <div className="wrapper">
            {userData?.authProgress ? <LoadingAnimation />  
            : (authRequirement === "auth-required" ? (userData.user ? <Outlet/> : <Navigate to='/login'/>) 
            : (authRequirement === "guest-access" ? (userData.user ? <Navigate to='/main-menu'/> : <Outlet/>)
            : <Outlet/>))}
        </div>
    )
}

export default RequireAuthLayout