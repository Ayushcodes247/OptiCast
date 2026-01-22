import React from 'react'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'

const GoogleButton = () => {
  return (
    <GoogleLogin onSuccess={ async (credentialResponse) => {
        const token = credentialResponse.credential;

        const { data , status } = await axios.post(`${import.meta.env.VITE_BASE_URL}google`,{},{
            headers : {
                Authorization : `Bearer ${token}`
            }
        });
        console.log("Response:", data)
        localStorage.setItem("OPticast token", data.token);
    }} onError={() => {
        console.log("Google Login Failed");
    }}/>
  )
}

export default GoogleButton;