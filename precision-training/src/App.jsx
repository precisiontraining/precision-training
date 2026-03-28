import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PlanView from './pages/PlanView'
import Impressum from './pages/Impressum'
import Privacy from './pages/Privacy'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan/:slug" element={<PlanView />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </BrowserRouter>
  )
}
