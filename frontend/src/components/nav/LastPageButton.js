import React from 'react'
import { useNavigate } from 'react-router-dom';
import BackLogo from '../../images/components/BackLogo'

const LastPageButton = () => {
    const navigate = useNavigate();
    return (
        <BackLogo className="back-button" width={40} height={40}
            onClick={() => navigate(-1)} />
    )
}

export default LastPageButton