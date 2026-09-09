import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ToolGuard from './components/ToolGuard'
import Home from './pages/Home'
import ContentAnalyzerPage from './pages/ContentAnalyzerPage'
import SeoAuditPage from './tools/seo-audit/SeoAuditPage'
import KeywordResearchPage from './tools/keyword-research/KeywordResearchPage'
import SeoRoiPage from './tools/seo-roi/SeoRoiPage'
import BlogTopicGeneratorPage from './tools/blog-topic-generator/BlogTopicGeneratorPage'
import LogoMakerPage from './tools/logo-maker/LogoMakerPage'
import FaqGeneratorPage from './tools/faq-generator/FaqGeneratorPage'
import CompetitorAnalysisPage from './tools/competitor-analysis/CompetitorAnalysisPage'
import ContentQaLandingPage from './pages/ContentQaLandingPage'
import XmlSitemapGeneratorPage from './tools/xml-sitemap-generator/XmlSitemapGeneratorPage'
import GoogleRankCheckerPage from './tools/google-rank-checker/GoogleRankCheckerPage'
import WebsiteContentExtractorPage from './tools/website-content-extractor/WebsiteContentExtractorPage'
import WebsiteImageExtractorPage from './tools/website-image-extractor/WebsiteImageExtractorPage'
import WebsiteTechInspectorPage from './tools/website-tech-inspector/WebsiteTechInspectorPage'
import AiContentWriterPage from './tools/ai-content-writer/AiContentWriterPage'
import BlogIntroGeneratorPage from './tools/blog-intro-generator/BlogIntroGeneratorPage'
import BlogIntroLandingPage from './pages/BlogIntroLandingPage'
import BlogConclusionGeneratorPage from './tools/blog-conclusion-generator/BlogConclusionGeneratorPage'
import BlogConclusionLandingPage from './pages/BlogConclusionLandingPage'
import EeatAuthorityAnalyzerLandingPage from './pages/EeatAuthorityAnalyzerLandingPage'
import BusinessCompetitorPage from './tools/business-competitor-analytics/BusinessCompetitorPage'
import CaseStudyGeneratorPage from './tools/case-study-generator/CaseStudyGeneratorPage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTools from './pages/admin/AdminTools'
import AdminDevices from './pages/admin/AdminDevices'
import AdminLeads from './pages/admin/AdminLeads'
import AdminActivity from './pages/admin/AdminActivity'
import GlobalDeviceLimitModal from './components/GlobalDeviceLimitModal'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ScrollToTop />
      <GlobalDeviceLimitModal />
      <Routes>

        {/* Admin routes — no Navbar/Footer */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="tools" element={<AdminTools />} />
          <Route path="devices" element={<AdminDevices />} />
          <Route path="leads" element={<AdminLeads />} />
        </Route>


        {/* Public routes — with Navbar/Footer */}
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/content-analyzer"
                    element={
                      <ToolGuard toolPath="/content-analyzer">
                        <ContentAnalyzerPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/seo-audit"
                    element={
                      <ToolGuard toolPath="/seo-audit">
                        <SeoAuditPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/keyword-research"
                    element={
                      <ToolGuard toolPath="/keyword-research">
                        <KeywordResearchPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/blog-topic-generator"
                    element={
                      <ToolGuard toolPath="/blog-topic-generator">
                        <BlogTopicGeneratorPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/logo-maker"
                    element={
                      <ToolGuard toolPath="/logo-maker">
                        <LogoMakerPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/faq-generator"
                    element={
                      <ToolGuard toolPath="/faq-generator">
                        <FaqGeneratorPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/competitor-analysis"
                    element={
                      <ToolGuard toolPath="/competitor-analysis">
                        <CompetitorAnalysisPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/seo-roi-calculator"
                    element={
                      <ToolGuard toolPath="/seo-roi-calculator">
                        <SeoRoiPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/content-qa"
                    element={
                      <ToolGuard toolPath="/content-qa">
                        <ContentQaLandingPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/xml-sitemap-generator"
                    element={
                      <ToolGuard toolPath="/xml-sitemap-generator">
                        <XmlSitemapGeneratorPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/google-rank-checker"
                    element={
                      <ToolGuard toolPath="/google-rank-checker">
                        <GoogleRankCheckerPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/website-content-extractor"
                    element={
                      <ToolGuard toolPath="/website-content-extractor">
                        <WebsiteContentExtractorPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/website-image-extractor"
                    element={
                      <ToolGuard toolPath="/website-image-extractor">
                        <WebsiteImageExtractorPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/website-tech-inspector"
                    element={
                      <ToolGuard toolPath="/website-tech-inspector">
                        <WebsiteTechInspectorPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/ai-content-writer"
                    element={
                      <ToolGuard toolPath="/ai-content-writer">
                        <AiContentWriterPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/blog-intro-generator"
                    element={
                      <ToolGuard toolPath="/blog-intro-generator">
                        <BlogIntroLandingPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/blog-conclusion-generator"
                    element={
                      <ToolGuard toolPath="/blog-conclusion-generator">
                        <BlogConclusionLandingPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/eeat-analyzer"
                    element={
                      <ToolGuard toolPath="/eeat-analyzer">
                        <EeatAuthorityAnalyzerLandingPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/business-competitor-analytics"
                    element={
                      <ToolGuard toolPath="/business-competitor-analytics">
                        <BusinessCompetitorPage />
                      </ToolGuard>
                    }
                  />
                  <Route
                    path="/case-study-generator"
                    element={
                      <ToolGuard toolPath="/case-study-generator">
                        <CaseStudyGeneratorPage />
                      </ToolGuard>
                    }
                  />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </div>
  )
}
