import React from 'react';
import { motion } from 'framer-motion'

const Backdrop = ({ children, onClick, props}) => {


    return (
        <motion.div
            className='backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...props}
            onClick={onClick}
        >
            {children}
        </motion.div>
    )
}

export default Backdrop