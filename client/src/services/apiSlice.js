import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    timeout: 120000,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Analysis', 'Lead', 'BlogTopic', 'TopicCluster'],
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
      query: () => ({ url: '/admin/stats', headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }),
    }),
    getAdminTools: builder.query({
      query: () => ({ url: '/admin/tools', headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }),
    }),
    updateAdminTool: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/admin/tools/${id}`,
        method: 'PUT',
        body: updates,
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      }),
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
  }),
})

export const {
  useAnalyzeContentMutation,
  useSubmitLeadMutation,
  useRunAuditMutation,
  useGetAuditQuery,
  useResearchKeywordsMutation,
  useCalculateROIMutation,
  useGenerateTopicsMutation,
  useGenerateClustersMutation,
  useGetBlogTopicsQuery,
  useGenerateFaqsMutation,
  useHealthCheckQuery,
  useGetPublicToolsQuery,
  useAdminLoginMutation,
  useGetAdminStatsQuery,
  useGetAdminToolsQuery,
  useUpdateAdminToolMutation,
  useGetAdminLeadsQuery,
  useDeleteAdminLeadMutation,
} = apiSlice
