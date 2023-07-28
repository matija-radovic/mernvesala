import React from 'react'
import axios from 'axios'
import { createContext, useState, useEffect } from 'react'

export const UserContext = createContext({});

const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState({
        token: undefined,
        user: undefined,
        authProgress: true,
    });

    useEffect(() => {
        const isLoggedIn = async () => {
            let tempData = {
                token: undefined,
                user: undefined,
                authProgress: false,
            }
            let token = locakStorage.getItem("auth-token");
            if (token == null) {
                localStorage.setItem("auth-token", "");
                token = "";
            }

            try {
                const tokenResponse = await axios.post('/api/users/tokenIsValid', null, { headers: { "auth-token": token } });
                if (tokenResponse.data) {
                    const userResponse = await axios.get('/api/users/profile', { headers: { "auth-token": token } });
                    tempData = {
                        token: token,
                        user: userResponse.data,
                        authProgress: false,
                    }
                }else {
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
        }
        isLoggedIn();
    }, []);

    return (
        <div>
            <UserContext.Provider value={{ user, setUser }}>
                {children}
            </UserContext.Provider>
        </div>
    )
}

export default UserContextProvider