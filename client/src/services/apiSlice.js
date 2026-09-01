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

    // GET /api/health
    healthCheck: builder.query({
      query: () => '/health',
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
  useHealthCheckQuery,
} = apiSlice
