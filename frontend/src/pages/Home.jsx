import Hero from '../components/Hero'
import PromiseSection from '../components/PromiseSection'
import AboutProject from '../components/AboutProject'
import HowItWorks from '../components/HowItWorks'
import ResultShowcase from '../components/ResultShowcase'

const Divider = () => (
  <div style={{
    height: '1px',
    margin: '0 48px',
    background: 'linear-gradient(90deg, transparent, var(--wif-border), transparent)',
  }} />
)

export default function Home() {
  return (
    <>
      <Hero />

      <Divider />

      <PromiseSection />

      <Divider />

      <AboutProject />

      <Divider />

      <HowItWorks />

      <Divider />

      <ResultShowcase />

    </>
  )
}
