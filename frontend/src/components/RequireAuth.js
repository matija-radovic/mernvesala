import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const RequireAuth = (params) => {
    /*const userData = useUserContext();
    const[loading, setLoading] = useState(!userData.authProgress);
    useEffect(() => {
        if(userData.authProgress){
            setLoading(false);
        }
    }, [userData.authProgress]);

    return (
        loading ? (<LoadingAnimation/>) : userData.user ? <Outlet/> : <Navigate to ='/login'/>
    )*/
    const {userData} = useContext(UserContext);
    const component = params.comp;
    const loader = params.loader;
    const redirect = params.redirect;
    
    return(
        <div>
            {userData?.authProgress ? loader : (userData.user ? component : <Navigate to={redirect}/>)}
        </div>
    )

}

export default RequireAuth