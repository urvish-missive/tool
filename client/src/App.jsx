import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ContentAnalyzerPage from './pages/ContentAnalyzerPage'
import SeoAuditPage from './tools/seo-audit/SeoAuditPage'
import KeywordResearchPage from './tools/keyword-research/KeywordResearchPage'
import SeoRoiPage from './tools/seo-roi/SeoRoiPage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 pt-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/content-analyzer" element={<ContentAnalyzerPage />} />
          <Route path="/seo-audit" element={<SeoAuditPage />} />
          <Route path="/keyword-research" element={<KeywordResearchPage />} />
          <Route path="/seo-roi-calculator" element={<SeoRoiPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
