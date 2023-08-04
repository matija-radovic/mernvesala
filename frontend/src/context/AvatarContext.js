import React, { createContext, useContext, useState} from 'react'
import alien from '../images/avatars/alien.jfif'
import bananaCat from '../images/avatars/banana-crying-cat.gif'
import catLick from '../images/avatars/cat-lick.png'
import danceDog from '../images/avatars/dance-dog.png'
import explodeCat from '../images/avatars/explode-cat.gif'
import niceEmoji from '../images/avatars/nice-emoji.png'
import racoon from '../images/avatars/racoon.png'
import susDog from '../images/avatars/sus-dog.jpg'
import catThumbsUp from '../images/avatars/thumbs-up-cat.png'

export const usePictures = () => {
    return useContext(AvatarContext).pictures;
}

export const AvatarContext = createContext();

function AvatarContextProvider({ children }) {
    const [pictures, setPictures] = useState([
        alien,
        bananaCat,
        catLick,
        danceDog,
        explodeCat,
        niceEmoji,
        racoon,
        susDog,
        catThumbsUp
    ]);

    return (
        <AvatarContext.Provider value={{pictures, setPictures}}>
                {children}
        </AvatarContext.Provider>
    );
}

export default AvatarContextProvider;
