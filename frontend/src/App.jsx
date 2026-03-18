import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Market from './pages/Market'
import Price from './pages/Price'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/market" element={<Market />} />
      <Route path="/price" element={<Price />} />
    </Routes>
  )
}
