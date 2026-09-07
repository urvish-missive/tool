import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL } from '../utils/apiUrl'
import { getOrCreateDeviceId } from '../utils/deviceId'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: 120000,
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json')
    const deviceId = getOrCreateDeviceId()
    if (deviceId) {
      headers.set('x-device-id', deviceId)
    }
    return headers
  },
})

const baseQueryWithDeviceLimit = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error?.data && typeof window !== 'undefined') {
    if (result.error.data.deviceBlocked) {
      window.dispatchEvent(
        new CustomEvent('seo:device-blocked', { detail: result.error.data })
      )
    } else if (result.error.data.deviceLimitReached) {
      window.dispatchEvent(
        new CustomEvent('seo:device-limit-reached', { detail: result.error.data })
      )
    }
  }
  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithDeviceLimit,
  tagTypes: ['Analysis', 'Lead', 'BlogTopic', 'TopicCluster', 'Device'],
  endpoints: (builder) => ({


    // POST /api/content/analyze
    analyzeContent: builder.mutation({
      query: (payload) => ({
        url: '/content/analyze',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Analysis'],
    }),

    // POST /api/leads
    submitLead: builder.mutation({
      query: (payload) => ({
        url: '/leads',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Lead'],
    }),

    // POST /api/leads/send-pdf — Email PDF report & capture lead
    sendPdfReport: builder.mutation({
      query: (payload) => ({
        url: '/leads/send-pdf',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Lead', 'Device'],
    }),

    // POST /api/audit
    runAudit: builder.mutation({
      query: (payload) => ({
        url: '/audit',
        method: 'POST',
        body: payload,
      }),
    }),

    // GET /api/audit/:id
    getAudit: builder.query({
      query: (id) => `/audit/${id}`,
    }),

    // POST /api/keywords/research
    researchKeywords: builder.mutation({
      query: (payload) => ({
        url: '/keywords/research',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/seo-roi/calculate
    calculateROI: builder.mutation({
      query: (payload) => ({
        url: '/seo-roi/calculate',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/blog-topics/generate
    generateTopics: builder.mutation({
      query: (payload) => ({
        url: '/blog-topics/generate',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['BlogTopic'],
    }),

    // POST /api/blog-topics/clusters
    generateClusters: builder.mutation({
      query: (payload) => ({
        url: '/blog-topics/clusters',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['TopicCluster'],
    }),

    // GET /api/blog-topics/:id
    getBlogTopics: builder.query({
      query: (id) => `/blog-topics/${id}`,
    }),

    // POST /api/faqs/generate
    generateFaqs: builder.mutation({
      query: (payload) => ({
        url: '/faqs/generate',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/competitors/analyze
    analyzeCompetitor: builder.mutation({
      query: (payload) => ({
        url: '/competitors/analyze',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/content-qa/analyze
    analyzeContentQa: builder.mutation({
      query: (payload) => ({
        url: '/content-qa/analyze',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/logo/variations
    generateLogoVariations: builder.mutation({
      query: (payload) => ({
        url: '/logo/variations',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/content-qa/polish
    polishContentQa: builder.mutation({
      query: (payload) => ({
        url: '/content-qa/polish',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/content-qa/import
    importContentQa: builder.mutation({
      query: (payload) => ({
        url: '/content-qa/import',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/sitemap/generate
    generateSitemap: builder.mutation({
      query: (payload) => ({
        url: '/sitemap/generate',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/sitemap/validate
    validateSitemap: builder.mutation({
      query: (payload) => ({
        url: '/sitemap/validate',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/rank/check
    checkRank: builder.mutation({
      query: (payload) => ({
        url: '/rank/check',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/extractor/extract
    extractWebsiteContent: builder.mutation({
      query: (payload) => ({
        url: '/extractor/extract',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/extractor/ask
    askWebsiteQuestion: builder.mutation({
      query: (payload) => ({
        url: '/extractor/ask',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/image-extractor/extract
    extractWebsiteImages: builder.mutation({
      query: (payload) => ({
        url: '/image-extractor/extract',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/tech-inspector/inspect
    inspectWebsiteTech: builder.mutation({
      query: (payload) => ({
        url: '/tech-inspector/inspect',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/content-writer/generate
    generateContent: builder.mutation({
      query: (payload) => ({
        url: '/content-writer/generate',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/content-writer/rewrite
    rewriteContent: builder.mutation({
      query: (payload) => ({
        url: '/content-writer/rewrite',
        method: 'POST',
        body: payload,
      }),
    }),

    // POST /api/content-writer/meta-tags
    generateMetaTags: builder.mutation({
      query: (payload) => ({
        url: '/content-writer/meta-tags',
        method: 'POST',
        body: payload,
      }),
    }),

    // GET /api/health
    healthCheck: builder.query({
      query: () => '/health',
    }),

    // GET /api/tools/public
    getPublicTools: builder.query({
      query: () => '/tools/public',
    }),

    // ─── Admin endpoints ────────────────────────
    adminLogin: builder.mutation({
      query: (payload) => ({ url: '/admin/login', method: 'POST', body: payload }),
    }),
    getAdminStats: builder.query({
      query: () => ({
        url: '/admin/stats',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
    }),
    getAdminTools: builder.query({
      query: () => ({
        url: '/admin/tools',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
    }),
    updateAdminTool: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/admin/tools/${id}`,
        method: 'PUT',
        body: updates,
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
      async onQueryStarted({ id, ...updates }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getAdminTools', undefined, (draft) => {
            if (draft?.tools) {
              const tool = draft.tools.find((t) => t.id === id)
              if (tool) {
                const serializedUpdates = { ...updates }
                if (updates.formFields && typeof updates.formFields === 'object') {
                  serializedUpdates.formFields = JSON.stringify(updates.formFields)
                }
                if (updates.popupFields && typeof updates.popupFields === 'object') {
                  serializedUpdates.popupFields = JSON.stringify(updates.popupFields)
                }
                Object.assign(tool, serializedUpdates)
              }
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
    getAdminLeads: builder.query({
      query: (params = {}) => ({
        url: `/admin/leads?${new URLSearchParams(params)}`,
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
    }),
    deleteAdminLead: builder.mutation({
      query: (id) => ({
        url: `/admin/leads/${id}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
    }),
    getAdminActivity: builder.query({
      query: (params = {}) => ({
        url: `/admin/activity?${new URLSearchParams(params)}`,
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
    }),

    // ─── Device Limits Management ──────────────────────
    getAdminDevices: builder.query({
      query: (params = {}) => {
        const q = new URLSearchParams()
        if (params.search) q.append('search', params.search)
        if (params.tool) q.append('tool', params.tool)
        if (params.status) q.append('status', params.status)
        if (params.page) q.append('page', params.page)
        if (params.limit) q.append('limit', params.limit)
        return {
          url: `/admin/devices?${q.toString()}`,
          headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
        }
      },
      providesTags: ['Device'],
    }),

    resetDeviceLimit: builder.mutation({
      query: (id) => ({
        url: `/admin/devices/${id}/reset`,
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
      invalidatesTags: ['Device'],
    }),

    setDeviceCustomLimit: builder.mutation({
      query: ({ id, customLimit }) => ({
        url: `/admin/devices/${id}/limit`,
        method: 'PATCH',
        body: { customLimit },
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
      invalidatesTags: ['Device'],
    }),

    toggleBlockDevice: builder.mutation({
      query: (id) => ({
        url: `/admin/devices/${id}/block`,
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
      invalidatesTags: ['Device'],
    }),

    deleteDevice: builder.mutation({
      query: (id) => ({
        url: `/admin/devices/${id}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
      invalidatesTags: ['Device'],
    }),

    // Public device linking
    linkDeviceEmail: builder.mutation({
      query: (body) => ({
        url: '/devices/link-email',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Device'],
    }),

    getDeviceStatus: builder.query({
      query: (toolSlug) => `/devices/status?toolSlug=${encodeURIComponent(toolSlug)}`,
      providesTags: ['Device'],
    }),
  }),
})

export const {
  useAnalyzeContentMutation,
  useSubmitLeadMutation,
  useSendPdfReportMutation,
  useRunAuditMutation,
  useGetAuditQuery,
  useResearchKeywordsMutation,
  useCalculateROIMutation,
  useGenerateTopicsMutation,
  useGenerateClustersMutation,
  useGetBlogTopicsQuery,
  useGenerateFaqsMutation,
  useAnalyzeCompetitorMutation,
  useAnalyzeContentQaMutation,
  usePolishContentQaMutation,
  useImportContentQaMutation,
  useGenerateLogoVariationsMutation,
  useGenerateSitemapMutation,
  useValidateSitemapMutation,
  useCheckRankMutation,
  useExtractWebsiteContentMutation,
  useAskWebsiteQuestionMutation,
  useExtractWebsiteImagesMutation,
  useInspectWebsiteTechMutation,
  useGenerateContentMutation,
  useRewriteContentMutation,
  useGenerateMetaTagsMutation,
  useHealthCheckQuery,
  useGetPublicToolsQuery,
  useAdminLoginMutation,
  useGetAdminStatsQuery,
  useGetAdminToolsQuery,
  useUpdateAdminToolMutation,
  useGetAdminLeadsQuery,
  useDeleteAdminLeadMutation,
  useGetAdminActivityQuery,
  useGetAdminDevicesQuery,
  useResetDeviceLimitMutation,
  useSetDeviceCustomLimitMutation,
  useToggleBlockDeviceMutation,
  useDeleteDeviceMutation,
  useLinkDeviceEmailMutation,
  useGetDeviceStatusQuery,
} = apiSlice


export const useGenerateBlogTopicsMutation = useGenerateTopicsMutation
export const useGenerateWrittenContentMutation = useGenerateContentMutation
