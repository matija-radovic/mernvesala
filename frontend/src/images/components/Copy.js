import React from 'react'

const Copy = ({ className, style, height, width, ...props }) => {
  return (
    
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="copy" style={style} className={className} fill="#fff" height={height ?? "50px"} width={width ?? "50px"}  {...props}>
        <path d="M17 3h-6C8.8 3 7 4.8 7 7c-2.2 0-4 1.8-4 4v6c0 2.2 1.8 4 4 4h6c2.2 0 4-1.8 4-4 2.2 0 4-1.8 4-4V7c0-2.2-1.8-4-4-4zm-2 14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-6c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v6zm4-4c0 1.1-.9 2-2 2v-4c0-2.2-1.8-4-4-4H9c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v6z"></path>
    </svg>
  )
}

export default Copy