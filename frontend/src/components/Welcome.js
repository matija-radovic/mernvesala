import React from 'react'
import { Link } from 'react-router-dom'
import "../App.css"

const Welcome = () => {
  return (
    <div className="welcome">
      <Link to="/login" className="button">Log in</Link>
      <Link to="/register" className="button">Register</Link>
    </div>
  )
}

export default Welcome