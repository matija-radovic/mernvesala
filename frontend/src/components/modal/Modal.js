import React from 'react';
import { motion } from 'framer-motion'
import Backdrop from './Backdrop';
import CloseLogo from '../../images/components/CloseLogo';

const dropIn = {
    hidden: {
        y: "-70vh",
        opacity: 0.1
    },
    visible: {
        y: "0",
        opacity: 1,
        transition: {
            duration: 0.2,
        }
    },
    exit: {
        opacity: 0.1,
    }
}

const Modal = ({ children, handleClose, ...props }) => {

    return (
        < Backdrop onClick={handleClose} >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className="modal"
                variants={dropIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                {...props}
            >
                <CloseLogo className="modal-close" style={{cursor: "pointer"}} width={30} height={30} onClick={handleClose}/>
                {children}
            </motion.div>
        </Backdrop >
    )
}

export default Modal