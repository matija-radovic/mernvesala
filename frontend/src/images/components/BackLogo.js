import React from 'react'

const BackLogo = ({ className, style, height, width, stroke, strokeWidth, ...props }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="left" style={style} className={className} fill="#fff" height={height ?? "50px"} width={width ?? "50px"} stroke={stroke ?? "none"} strokeWidth={strokeWidth ?? "none"} {...props}>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"></path>
            <path d="M13.7 8.3c-.4-.4-1-.4-1.4 0l-3 3c-.4.4-.4 1 0 1.4l3 3c.2.2.5.3.7.3s.5-.1.7-.3c.4-.4.4-1 0-1.4L11.4 12l2.3-2.3c.4-.4.4-1 0-1.4z"></path>
        </svg>
    )
}

export default BackLogo