import Hero from '../components/Hero'
import PromiseSection from '../components/PromiseSection'
import AboutProject from '../components/AboutProject'
import HowItWorks from '../components/HowItWorks'
import ResultShowcase from '../components/ResultShowcase'
import Divider from '../components/Divider'

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
