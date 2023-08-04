import React from 'react'

const SoundOn = ({ className, style, height, width, stroke, strokeWidth, ...props }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="mute" style={style} className={className} fill="#fff" height={height ?? "50px"} width={width ?? "50px"} stroke={stroke ?? "none"} strokeWidth={strokeWidth ?? "none"} {...props}>
            <path d="M16.6 19.4c.9-.6 1.4-1.6 1.4-2.7V11c0-.6-.4-1-1-1s-1 .4-1 1v5.7c0 .4-.2.8-.6 1-.4.3-.9.3-1.3.2-.9-.3-1.7-.8-2.4-1.3-.4-.3-1.1-.2-1.4.2-.3.4-.2 1.1.2 1.4.9.7 1.9 1.2 2.9 1.6.4.1.8.2 1.2.2.7 0 1.4-.2 2-.6zm1.7-15.1-1 1c-.8-1.1-2.3-1.6-3.8-1.1-1.1.4-2.1.9-2.9 1.6L8.2 7.6H7c-1.7 0-3 1.3-3 3v2.9c0 1.4 1 2.6 2.3 2.9l-1 1c-.4.4-.4 1 0 1.4.2.1.4.2.7.2s.5-.1.7-.3l13-13c.4-.4.4-1 0-1.4s-1-.4-1.4 0zM7.5 14.4H7c-.6 0-1-.4-1-1v-2.9c0-.6.4-1 1-1h.5v4.9zm2-1.4V9l2.2-1.7c.7-.6 1.5-1 2.4-1.3.7-.3 1.4.1 1.7.6L9.5 13z"></path>
        </svg>
    )
}

export default SoundOn