import React, { useContext } from 'react'
import { UserContext } from '../context/UserContext';
import LoadingAnimation from './LoadingAnimation';
import { Navigate, Outlet } from 'react-router-dom';
/**
 * This element is used as a redirection for routes. Depending on login information and type of restriction specified in `params.auth` variable user will be redirected to specific page.
 * @param {string} params.auth - type of restrictrion
 * @example
 * const authStates = {
 *     "auth-required": "/login",
 *     "guest-access": "/main-menu",
 *     "public": "/"
 * }
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