import { Route, Routes } from 'react-router-dom'
import Layout           from './components/Layout'
import Home             from './pages/Home'
import Market           from './pages/Market'
import Price            from './pages/Price'
import MiniGame         from './pages/MiniGame'
import LeaderboardPage  from './pages/LeaderboardPage'
import GameDatabasePage from './pages/GameDatabasePage'
import GameDetailPage   from './pages/GameDetailPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"            element={<Home />} />
        <Route path="/market"      element={<Market />} />
        <Route path="/price"       element={<Price />} />
        <Route path="/minigame"    element={<MiniGame />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/database"          element={<GameDatabasePage />} />
        <Route path="/database/:appId"   element={<GameDetailPage />} />
      </Route>
    </Routes>
  )
}
