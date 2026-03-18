import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ExplorationGrid from '../components/ExplorationGrid'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#EEECE6] font-mono flex flex-col">
    <Navbar />
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
      <Hero />
      <ExplorationGrid />
    </main>
    <Footer />
  </div>
  )
}