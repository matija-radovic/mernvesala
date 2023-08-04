import React from 'react'

const SoundOn = ({className, style ,height, width, stroke, strokeWidth, ...props}) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="volume-up" style={style} className={className} fill="#fff" height={height ?? "50px"} width={width ?? "50px"}  stroke={stroke ?? "none"} strokeWidth={strokeWidth ?? "none"} {...props}>
            <path d="M5 16.4h1.2l2.3 1.8c.9.7 1.9 1.2 2.9 1.6.4.1.8.2 1.2.2.7 0 1.4-.2 2-.6.9-.6 1.4-1.6 1.4-2.7V7.3c0-1.1-.5-2-1.4-2.7-.9-.6-2.1-.8-3.1-.4-1.1.4-2.1.9-2.9 1.6L6.2 7.6H5c-1.7 0-3 1.3-3 3v2.9c0 1.6 1.3 2.9 3 2.9zm2.5-7.3 2.2-1.7c.7-.6 1.5-1 2.4-1.3.4-.2.9-.1 1.3.2.3.2.5.6.5 1v9.4c0 .4-.2.8-.6 1-.4.3-.9.3-1.3.2-.9-.3-1.7-.8-2.4-1.3l-2.2-1.7V9.1zM4 10.6c0-.6.4-1 1-1h.5v4.9H5c-.6 0-1-.4-1-1v-2.9zm14.7 4.1c.7-.7 1-1.6 1-2.7s-.4-2-1-2.7c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4.3.3.5.8.5 1.3s-.2 1-.5 1.3c-.4.4-.4 1 0 1.4.2.2.4.3.7.3.3 0 .5-.1.7-.3z"></path>
            <path d="M19.4 6.1c-.5-.2-1.1 0-1.3.5-.2.5 0 1.1.5 1.3C20 8.5 21 10.1 21 12s-1 3.5-2.4 4.1c-.5.2-.8.8-.5 1.3.2.4.5.6.9.6.1 0 .3 0 .4-.1C21.5 17 23 14.7 23 12s-1.5-5-3.6-5.9z"></path>
        </svg>
    )
}

export default SoundOn