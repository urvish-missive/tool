import { useEffect } from 'react'
import { useGetPublicToolsQuery } from '../services/apiSlice'

const TOOL_SLUG_MAP = {
  '/content-analyzer': 'content-analyzer',
  '/seo-audit': 'seo-audit',
  '/keyword-research': 'keyword-research',
  '/seo-roi-calculator': 'seo-roi',
  '/blog-topic-generator': 'blog-topics',
  '/logo-maker': 'logo-maker',
  '/faq-generator': 'faq-generator',
  '/competitor-analysis': 'competitor-analyzer',
  '/content-qa': 'content-qa',
  '/xml-sitemap-generator': 'xml-sitemap-generator',
}

export default function ToolGuard({ toolPath, children }) {
  const { data, isLoading } = useGetPublicToolsQuery()
  const slug = TOOL_SLUG_MAP[toolPath] || toolPath

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" />
      </div>
    )
  }

  const tool = data?.tools?.find(t => t.slug === slug)
  const enabled = tool?.enabled ?? true

  if (!enabled) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tool Temporarily Unavailable</h2>
          <p className="text-sm text-gray-500 mb-6">
            This tool is currently disabled. Please try again later or contact our team for assistance.
          </p>
          <a href="/" className="inline-flex items-center px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors">
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return children
}
