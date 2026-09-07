import { useState, useEffect, useMemo } from 'react'
import { useGetAdminToolsQuery, useUpdateAdminToolMutation } from '../../services/apiSlice'
import { ChevronDown, Search, X } from 'lucide-react'

// Default field definitions per tool slug
const TOOL_FIELDS = {
  'content-analyzer': [
    { key: 'content', label: 'Content', icon: '📝' },
    { key: 'keyword', label: 'Primary Keyword', icon: '🎯' },
    { key: 'secondaryKeywords', label: 'Secondary Keywords', icon: '🏷️' },
    { key: 'contentType', label: 'Content Type', icon: '📄' },
    { key: 'country', label: 'Country', icon: '🌍' },
  ],
  'seo-audit': [
    { key: 'url', label: 'Website URL', icon: '🌐' },
    { key: 'html', label: 'Paste HTML', icon: '📋' },
    { key: 'keyword', label: 'Target Keyword', icon: '🎯' },
  ],
  'keyword-research': [
    { key: 'seedKeyword', label: 'Seed Keyword', icon: '🔑' },
    { key: 'websiteUrl', label: 'Website URL', icon: '🌐' },
    { key: 'country', label: 'Country', icon: '🌍' },
    { key: 'businessType', label: 'Business Type', icon: '💼' },
  ],
  'seo-roi': [
    { key: 'currency', label: 'Currency', icon: '💱' },
    { key: 'traffic', label: 'Monthly Traffic', icon: '📈' },
    { key: 'leads', label: 'Monthly Leads', icon: '🎯' },
    { key: 'custValue', label: 'Customer Value', icon: '💰' },
    { key: 'custRate', label: 'Lead → Customer Rate', icon: '📊' },
    { key: 'convRate', label: 'Organic → Lead Rate', icon: '📊' },
    { key: 'investment', label: 'Monthly Investment', icon: '💵' },
    { key: 'months', label: 'Campaign Duration', icon: '📅' },
    { key: 'growthPreset', label: 'Growth Scenario', icon: '🚀' },
  ],
  'blog-topics': [
    { key: 'niche', label: 'Niche / Industry', icon: '🏭' },
    { key: 'targetKeywords', label: 'Target Keywords', icon: '🔑' },
    { key: 'audience', label: 'Target Audience', icon: '👥' },
    { key: 'contentGoal', label: 'Content Goal', icon: '🎯' },
    { key: 'contentType', label: 'Content Type', icon: '📄' },
    { key: 'topicCount', label: 'Topic Count', icon: '🔢' },
  ],
  'ai-content-writer': [
    { key: 'keyword', label: 'Topic / Primary Keyword', icon: '🎯' },
    { key: 'contentType', label: 'Content Type', icon: '📄' },
    { key: 'tone', label: 'Tone', icon: '🎨' },
    { key: 'wordCount', label: 'Word Count', icon: '🔢' },
    { key: 'targetAudience', label: 'Target Audience', icon: '👥' },
    { key: 'secondaryKeywords', label: 'Secondary Keywords', icon: '🏷️' },
  ],
  'logo-maker': [
    { key: 'brandName', label: 'Brand Name', icon: '✏️' },
    { key: 'description', label: 'Description', icon: '📝' },
    { key: 'industry', label: 'Industry', icon: '🏭' },
    { key: 'style', label: 'Style', icon: '🎨' },
    { key: 'primaryColor', label: 'Primary Color', icon: '🔴' },
    { key: 'secondaryColor', label: 'Secondary Color', icon: '🔵' },
  ],
  'content-qa': [
    { key: 'content', label: 'Content', icon: '📝' },
    { key: 'title', label: 'Title', icon: '📰' },
    { key: 'targetKeyword', label: 'Target Keyword', icon: '🎯' },
    { key: 'metaDescription', label: 'Meta Description', icon: '📄' },
    { key: 'urlSlug', label: 'URL Slug', icon: '🌐' },
  ],
  'xml-sitemap-generator': [
    { key: 'websiteUrl', label: 'Website URL', icon: '🌐' },
    { key: 'maxPages', label: 'Max URLs', icon: '🔢' },
    { key: 'crawlDepth', label: 'Crawl Depth', icon: '📊' },
    { key: 'includeImages', label: 'Include Images', icon: '🖼️' },
    { key: 'changefreq', label: 'Change Frequency', icon: '⏱️' },
    { key: 'priority', label: 'Priority', icon: '⭐' },
  ],
  'google-rank-checker': [
    { key: 'domain', label: 'Domain / Website', icon: '🌐' },
    { key: 'keyword', label: 'Target Keyword', icon: '🎯' },
    { key: 'country', label: 'Country', icon: '🌍' },
    { key: 'device', label: 'Device', icon: '📱' },
  ],
  'website-content-extractor': [
    { key: 'url', label: 'Website URL', icon: '🌐' },
    { key: 'extractAIOverview', label: 'AI Overview', icon: '✨' },
  ],
  'website-image-extractor': [
    { key: 'url', label: 'Website URL', icon: '🌐' },
  ],
  'website-tech-inspector': [
    { key: 'url', label: 'Website URL', icon: '🌐' },
  ],
  'geo-analyzer': [
    { key: 'url', label: 'Website URL', icon: '🌐' },
    { key: 'content', label: 'Content Draft', icon: '📝' },
    { key: 'targetQuery', label: 'Target Search Query', icon: '🎯' },
    { key: 'targetEngine', label: 'AI Search Focus', icon: '🤖' },
  ],
  'faq-generator': [
    { key: 'topic', label: 'Topic / Keyword', icon: '❓' },
    { key: 'count', label: 'Question Count', icon: '🔢' },
    { key: 'tone', label: 'Tone', icon: '🎨' },
  ],
  'competitor-analyzer': [
    { key: 'url', label: 'Your Website URL', icon: '🌐' },
    { key: 'competitorUrl', label: 'Competitor URL', icon: '⚔️' },
    { key: 'targetKeyword', label: 'Target Keyword', icon: '🎯' },
  ],
}

const POPUP_FIELD_DEFS = [
  { key: 'name', label: 'Name', icon: '👤', defaultShow: true, defaultReq: true },
  { key: 'email', label: 'Business Email', icon: '✉️', defaultShow: true, defaultReq: true },
  { key: 'phone', label: 'Phone', icon: '📞', defaultShow: true, defaultReq: false },
  { key: 'company', label: 'Company', icon: '🏢', defaultShow: true, defaultReq: false },
  { key: 'website', label: 'Website', icon: '🌐', defaultShow: true, defaultReq: false },
]

export default function AdminTools() {
  const { data, isLoading } = useGetAdminToolsQuery()
  const [updateAdminTool] = useUpdateAdminToolMutation()
  const [localTools, setLocalTools] = useState([])
  const [expandedTools, setExpandedTools] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (data?.tools) {
      setLocalTools(data.tools)
    }
  }, [data?.tools])

  const tools = localTools.length > 0 ? localTools : data?.tools || []

  const toggleExpand = (toolId) => {
    setExpandedTools((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }))
  }

  const expandAll = () => {
    const all = {}
    tools.forEach((t) => {
      all[t.id] = true
    })
    setExpandedTools(all)
  }

  const collapseAll = () => {
    setExpandedTools({})
  }

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools
    const q = searchQuery.toLowerCase().trim()
    return tools.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    )
  }, [tools, searchQuery])

  const updateTool = async (id, updates) => {
    // 1. Optimistic instant local update
    setLocalTools((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next = { ...t, ...updates }
        if (updates.formFields && typeof updates.formFields === 'object') {
          next.formFields = JSON.stringify(updates.formFields)
        }
        if (updates.popupFields && typeof updates.popupFields === 'object') {
          next.popupFields = JSON.stringify(updates.popupFields)
        }
        return next
      })
    )

    // 2. Persist to API in background
    try {
      await updateAdminTool({ id, ...updates }).unwrap()
    } catch (err) {
      console.error('Update failed, reverting state:', err)
      if (data?.tools) setLocalTools(data.tools)
    }
  }

  const getToolPopupFields = (tool) => {
    let parsed = {}
    try {
      if (tool.popupFields) {
        parsed = typeof tool.popupFields === 'string' ? JSON.parse(tool.popupFields) : tool.popupFields
      }
    } catch {}

    const result = {}
    POPUP_FIELD_DEFS.forEach((def) => {
      const legacyReqMap = {
        name: tool.requireName ?? true,
        email: tool.requireEmail ?? true,
        phone: tool.requirePhone ?? false,
        company: tool.requireCompany ?? false,
        website: false,
      }
      const show = parsed[def.key]?.show !== undefined ? Boolean(parsed[def.key].show) : def.defaultShow
      const required = parsed[def.key]?.required !== undefined ? Boolean(parsed[def.key].required) : legacyReqMap[def.key]
      result[def.key] = { show, required }
    })
    return result
  }

  const updatePopupField = (toolId, fieldKey, propertyToToggle) => {
    const tool = tools.find((t) => t.id === toolId)
    if (!tool) return

    const currentPopupFields = getToolPopupFields(tool)
    const currentVal = currentPopupFields[fieldKey]

    const updatedField = {
      ...currentVal,
      [propertyToToggle]: !currentVal[propertyToToggle],
    }

    const nextPopupFields = {
      ...currentPopupFields,
      [fieldKey]: updatedField,
    }

    const legacySync = {}
    if (fieldKey === 'name') legacySync.requireName = updatedField.required
    if (fieldKey === 'email') legacySync.requireEmail = updatedField.required
    if (fieldKey === 'phone') legacySync.requirePhone = updatedField.required
    if (fieldKey === 'company') legacySync.requireCompany = updatedField.required

    updateTool(toolId, {
      popupFields: nextPopupFields,
      ...legacySync,
    })
  }

  const updateFormField = (toolId, toolSlug, fieldKey, enabled) => {
    const tool = tools.find((t) => t.id === toolId)
    let currentFields = {}
    try {
      currentFields = tool?.formFields ? JSON.parse(tool.formFields) : {}
    } catch {}

    const updatedFields = {
      ...currentFields,
      [fieldKey]: {
        ...(currentFields[fieldKey] || {}),
        enabled,
        label: TOOL_FIELDS[toolSlug]?.find((f) => f.key === fieldKey)?.label || fieldKey,
      },
    }

    updateTool(toolId, { formFields: updatedFields })
  }

  if (isLoading && !tools.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0C81F3] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Expand/Collapse Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Tool Management</h2>
          <p className="text-sm text-gray-500">
            Enable/disable tools, configure fields, rate limits, and lead popups ({tools.length} total tools)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0C81F3] focus:ring-1 focus:ring-[#0C81F3] w-48 sm:w-56 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Expand All / Collapse All buttons */}
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Collapse All
          </button>
        </div>
      </div>

      {filteredTools.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500 text-sm">
          No tools match your search "{searchQuery}".
        </div>
      )}

      {/* 2-Column Grid with items-start to eliminate stretching and blank whitespace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {filteredTools.map((tool) => {
          const isExpanded = Boolean(expandedTools[tool.id])
          let currentFields = {}
          try {
            currentFields = tool.formFields ? JSON.parse(tool.formFields) : {}
          } catch {}
          const fieldDefs = TOOL_FIELDS[tool.slug] || []

          return (
            <div
              key={tool.id}
              className={`bg-white border rounded-xl shadow-xs transition-all ${
                tool.enabled
                  ? isExpanded
                    ? 'border-blue-300 ring-1 ring-blue-100 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                  : 'border-red-200 bg-red-50/25'
              }`}
            >
              {/* Card Header (Clickable to Toggle Expand/Collapse) */}
              <div
                onClick={() => toggleExpand(tool.id)}
                className="p-4 sm:p-5 cursor-pointer select-none hover:bg-gray-50/60 transition-colors rounded-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-bold text-gray-900 leading-tight">
                        {tool.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tool.enabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tool.enabled ? '● Active' : '○ Disabled'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200/60">
                        /{tool.slug}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-1">
                      {tool.description || 'No description provided'}
                    </p>
                  </div>

                  {/* Actions: Enabled Toggle Switch & Expand Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Tool Enabled Toggle Switch */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateTool(tool.id, { enabled: !tool.enabled })
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none shadow-xs ${
                        tool.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                      title={tool.enabled ? 'Click to disable tool' : 'Click to enable tool'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                          tool.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Expand/Collapse Chevron */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(tool.id)
                      }}
                      className={`p-1.5 rounded-lg border text-gray-500 hover:text-gray-800 transition-all cursor-pointer ${
                        isExpanded
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      title={isExpanded ? 'Collapse settings' : 'Expand settings'}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Summary Metrics Bar (Always Visible) */}
                <div className="grid grid-cols-5 gap-1.5 mt-3 pt-3 border-t border-gray-100 text-center">
                  <div className="bg-gray-50/80 rounded-lg p-1.5">
                    <p className="text-xs font-bold text-gray-900">{tool.todayUsage || 0}</p>
                    <p className="text-[9px] text-gray-500 font-medium">Today</p>
                  </div>
                  <div className="bg-gray-50/80 rounded-lg p-1.5">
                    <p className="text-xs font-bold text-gray-900">{tool.totalUsage || 0}</p>
                    <p className="text-[9px] text-gray-500 font-medium">Total</p>
                  </div>
                  <div className="bg-gray-50/80 rounded-lg p-1.5">
                    <p className="text-xs font-bold text-gray-900">{tool.hourlyLimit}</p>
                    <p className="text-[9px] text-gray-500 font-medium">Limit/hr</p>
                  </div>
                  <div className="bg-blue-50/60 rounded-lg p-1.5 border border-blue-100">
                    <p className="text-xs font-bold text-[#0C81F3]">{tool.deviceLimit ?? 3}</p>
                    <p className="text-[9px] text-blue-600 font-medium">Device</p>
                  </div>
                  <div
                    className={`rounded-lg p-1.5 border ${
                      tool.showLeadPopup
                        ? 'bg-amber-50/80 border-amber-200 text-amber-700'
                        : 'bg-gray-50/80 border-gray-100 text-gray-400'
                    }`}
                  >
                    <p className="text-xs font-bold">{tool.showLeadPopup ? 'ON' : 'OFF'}</p>
                    <p className="text-[9px] font-medium">Popup</p>
                  </div>
                </div>
              </div>

              {/* Collapsible Body (Shown only when expanded) */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 space-y-4 border-t border-gray-100 animate-fade-in">
                  {/* Rate & Device Limits */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Usage Limits</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Hourly Limit
                        </label>
                        <input
                          type="number"
                          value={tool.hourlyLimit}
                          onChange={(e) =>
                            updateTool(tool.id, { hourlyLimit: parseInt(e.target.value) || 0 })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#0C81F3] focus:outline-none"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Daily Limit
                        </label>
                        <input
                          type="number"
                          value={tool.dailyLimit}
                          onChange={(e) =>
                            updateTool(tool.id, { dailyLimit: parseInt(e.target.value) || 0 })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#0C81F3] focus:outline-none"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-blue-700 mb-1">
                          Device Limit
                        </label>
                        <input
                          type="number"
                          value={tool.deviceLimit !== undefined ? tool.deviceLimit : 3}
                          onChange={(e) =>
                            updateTool(tool.id, {
                              deviceLimit: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-blue-50/40 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-semibold focus:border-[#0C81F3] focus:outline-none"
                          min="0"
                          title="Max uses per device. Set 0 for unlimited."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Field Visibility */}
                  {fieldDefs.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-0.5">Input Form Fields</p>
                      <p className="text-[10px] text-gray-400 mb-2">
                        Show or hide input fields in the tool page form
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {fieldDefs.map((field) => {
                          const isEnabled = currentFields[field.key]?.enabled !== false
                          return (
                            <button
                              key={field.key}
                              type="button"
                              onClick={() =>
                                updateFormField(tool.id, tool.slug, field.key, !isEnabled)
                              }
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                isEnabled
                                  ? 'bg-[#0C81F3]/10 text-[#0C81F3] border-[#0C81F3]/30'
                                  : 'bg-gray-50 text-gray-400 border-gray-200 line-through'
                              }`}
                            >
                              <span>{field.icon}</span>
                              {field.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lead Capture Settings */}
                  <div className="border-t border-gray-100 pt-3 space-y-3">
                    {/* Required Fields (Bottom Inline Form) */}
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-0.5">
                        Required Fields (Bottom Lead Form)
                      </p>
                      <p className="text-[10px] text-gray-400 mb-2">
                        Fields shown in the lead form below tool results
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: 'requireEmail', label: 'Email' },
                          { key: 'requireName', label: 'Name' },
                          { key: 'requirePhone', label: 'Phone' },
                          { key: 'requireCompany', label: 'Company' },
                        ].map((field) => (
                          <button
                            type="button"
                            key={field.key}
                            onClick={() =>
                              updateTool(tool.id, { [field.key]: !tool[field.key] })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              tool[field.key]
                                ? 'bg-[#0C81F3]/10 text-[#0C81F3] border-[#0C81F3]/30'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {field.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lead Popup Section */}
                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-semibold text-gray-800">
                            Lead Popup (Before Tool Use)
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Show a modal form before users can run this tool
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateTool(tool.id, { showLeadPopup: !tool.showLeadPopup })
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none shadow-xs ${
                            tool.showLeadPopup ? 'bg-[#0C81F3]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                              tool.showLeadPopup ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {tool.showLeadPopup && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-700">Popup Form Fields</p>
                              <p className="text-[10px] text-gray-400">
                                Set field visibility and requirement for the popup modal
                              </p>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              {(() => {
                                const pf = getToolPopupFields(tool)
                                const shownCount = POPUP_FIELD_DEFS.filter((d) => pf[d.key]?.show).length
                                const reqCount = POPUP_FIELD_DEFS.filter(
                                  (d) => pf[d.key]?.show && pf[d.key]?.required
                                ).length
                                return `${shownCount} visible (${reqCount} required)`
                              })()}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {POPUP_FIELD_DEFS.map((field) => {
                              const pf = getToolPopupFields(tool)[field.key]
                              const isShown = pf.show
                              const isRequired = pf.required

                              return (
                                <div
                                  key={`popup-field-${field.key}`}
                                  className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                    isShown
                                      ? 'bg-white border-gray-200 shadow-xs'
                                      : 'bg-gray-100/60 border-gray-200 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{field.icon}</span>
                                    <div>
                                      <span
                                        className={`text-xs font-medium ${
                                          isShown ? 'text-gray-900' : 'text-gray-400 line-through'
                                        }`}
                                      >
                                        {field.label}
                                      </span>
                                      {isShown && isRequired && (
                                        <span className="ml-1 text-[11px] text-red-500 font-bold">
                                          *
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {/* Visibility (Show/Hide) Toggle */}
                                    <button
                                      type="button"
                                      onClick={() => updatePopupField(tool.id, field.key, 'show')}
                                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                                        isShown
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300'
                                      }`}
                                      title={
                                        isShown
                                          ? 'Field is visible in popup'
                                          : 'Field is hidden from popup'
                                      }
                                    >
                                      <span>{isShown ? '👁️ Show' : '🚫 Hidden'}</span>
                                    </button>

                                    {/* Required / Optional Toggle */}
                                    <button
                                      type="button"
                                      disabled={!isShown}
                                      onClick={() =>
                                        isShown && updatePopupField(tool.id, field.key, 'required')
                                      }
                                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                                        !isShown
                                          ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                                          : isRequired
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer'
                                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 cursor-pointer'
                                      }`}
                                      title={
                                        !isShown
                                          ? 'Hidden fields cannot be required'
                                          : isRequired
                                            ? 'Marked as required'
                                            : 'Optional field'
                                      }
                                    >
                                      {isRequired ? '★ Required' : 'Optional'}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Live preview badges */}
                          <div className="pt-1 flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-gray-400 mr-1">Preview:</span>
                            {(() => {
                              const pf = getToolPopupFields(tool)
                              const visibleList = POPUP_FIELD_DEFS.filter((d) => pf[d.key]?.show)
                              if (visibleList.length === 0) {
                                return (
                                  <span className="text-[10px] text-amber-600 font-medium italic">
                                    No fields will be shown in popup
                                  </span>
                                )
                              }
                              return visibleList.map((d) => (
                                <span
                                  key={d.key}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                    pf[d.key]?.required
                                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                                      : 'bg-gray-50 text-gray-600 border-gray-200'
                                  }`}
                                >
                                  {d.icon} {d.label}
                                  {pf[d.key]?.required ? ' *' : ''}
                                </span>
                              ))
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collapse Button at Bottom of Card */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(tool.id)}
                    className="w-full py-2 text-center text-xs text-gray-400 hover:text-gray-700 border border-dashed border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer mt-2"
                  >
                    ▲ Collapse {tool.name} Settings
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


