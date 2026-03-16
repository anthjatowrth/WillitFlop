import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

const data = [
  { genre: 'RPG', successRate: 68 },
  { genre: 'FPS', successRate: 45 },
  { genre: 'Puzzle', successRate: 72 },
  { genre: 'Strategy', successRate: 55 },
  { genre: 'Platformer', successRate: 61 },
]

export default function App() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ padding: '2rem', fontFamily: 'Arial Black', background: '#0D0D1A', minHeight: '100vh', color: '#F4F2EE' }}
    >
      <h1 style={{ color: '#E8005A' }}>Will it Flop? 🎮</h1>
      <p>Taux de succès par genre</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <Bar dataKey="successRate" fill="#E8005A" radius={[4, 4, 0, 0]} />
          <XAxis dataKey="genre" stroke="#F4F2EE" />
          <YAxis stroke="#F4F2EE" />
          <Tooltip
            contentStyle={{ background: '#0D0D1A', border: '1px solid #E8005A' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}