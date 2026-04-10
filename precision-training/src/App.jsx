import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Home from './pages/Home'
import PlanView from './pages/PlanView'
import Impressum from './pages/Impressum'
import Privacy from './pages/Privacy'
import FormTraining from './pages/FormTraining'
import FormNutrition from './pages/FormNutrition'
import FormGLP1 from './pages/FormGLP1'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan/:slug" element={<PlanView />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/form/training" element={<FormTraining />} />
        <Route path="/form/nutrition" element={<FormNutrition />} />
        <Route path="/form/glp1" element={<FormGLP1 />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
