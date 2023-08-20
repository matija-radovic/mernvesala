import { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const UserContext = createContext();

function UserContextProvider({ children }) {
    const [userData, setUserData] = useState({
        token: undefined,
        user: undefined,
        authProgress: true,
    });

    useEffect(() => {
        const isLoggedIn = async () => {
            let tempData = {
                token: undefined,
                user: undefined,
                authProgress: false
            }
            let token = localStorage.getItem("auth-token");
            if (token == null) {
                localStorage.setItem("auth-token", "");
                token = "";
            }


            try {
                const tokenResponse = await axios.post('/api/users/tokenIsValid', null, { headers: { "auth-token": token } });

                console.log(tokenResponse);
                console.log(tokenResponse.data);
                if (tokenResponse.data) {
                    const userResponse = await axios.get('/api/users/profile', { headers: { 'auth-token': token } });
                    tempData = {
                        token: token,
                        user: userResponse.data,
                        authProgress: false,
                    }
                } else {
                    tempData = {
                        token: undefined,
                        user: undefined,
                        authProgress: false,
                    }
                }

            } catch (error) {
                console.log("Error with token verification");
                localStorage.setItem("auth-token", "");
                token = "";
                tempData = {
                    token: undefined,
                    user: undefined,
                    authProgress: false,
                }
            }
            setUserData(tempData);
            console.log(tempData);
        }
        isLoggedIn();
    }, []);

    return (
        <UserContext.Provider value={{userData, setUserData}}>
                {children}
        </UserContext.Provider>
    );
}

export default UserContextProvider;
