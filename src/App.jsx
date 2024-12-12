import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import BuddySystemMemoryAllocator from './BuddySystemMemoryAllocator'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BuddySystemMemoryAllocator />
    </>
  )
}

export default App
