import React from 'react'
import { Routes , Route } from "react-router-dom"
import GoogleButton from './Components/GoogleButton'

const App = () => {
  return (
    <>
    <Routes>
      <Route path='/' element={<GoogleButton/>}/>
    </Routes>
    </>
  )
}

export default App