import React from 'react'
import { motion } from 'framer-motion'

const ServerMsg = ({msg, ...props}) => {
    return (
        <motion.div 
        className='msg' 
        style={{alignSelf:"center", ...props.style}}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        {...props}>
            <span style={{color: "greenyellow"}}>
                <b className="msg-text">{msg}</b>
            </span>
        </motion.div>
    );
};

export default ServerMsg