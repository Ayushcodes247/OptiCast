import React from 'react'
import { Link } from 'react-router-dom'
import axios from "axios"

const GoogleButton = async () => {

    const response = await axios.get()

  return (
    <div>
        <h1>OAuth with Google</h1>
        <Link to={`${import.meta.env.VITE_BASE_URL}google/auth/google`} className='px-10 py-2 rounded-lg bg-black/90 text-white'>Login with google</Link>
    </div>
  )
}

export default GoogleButton