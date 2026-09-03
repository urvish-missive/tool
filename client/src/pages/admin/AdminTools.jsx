import { useState, useEffect } from 'react'
import { useGetAdminToolsQuery, useUpdateAdminToolMutation } from '../../services/apiSlice'

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
}

export default function AdminTools() {
  const { data, isLoading } = useGetAdminToolsQuery()
  const [updateAdminTool] = useUpdateAdminToolMutation()
  const [localTools, setLocalTools] = useState([])

  useEffect(() => {
    if (data?.tools) {
      setLocalTools(data.tools)
    }
  }, [data?.tools])

  const tools = localTools.length > 0 ? localTools : data?.tools || []

  const updateTool = async (id, updates) => {
    // 1. Optimistic instant local update
    setLocalTools((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next = { ...t, ...updates }
        if (updates.formFields && typeof updates.formFields === 'object') {
          next.formFields = JSON.stringify(updates.formFields)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tool Management</h2>
          <p className="text-sm text-gray-500">
            Enable/disable tools, configure fields, and set rate limits
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tools.map((tool) => {
          let currentFields = {}
          try {
            currentFields = tool.formFields ? JSON.parse(tool.formFields) : {}
          } catch {}
          const fieldDefs = TOOL_FIELDS[tool.slug] || []

          return (
            <div
              key={tool.id}
              className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${tool.enabled ? 'border-gray-200' : 'border-red-200 bg-red-50/30'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{tool.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{tool.description}</p>
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">/{tool.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateTool(tool.id, { enabled: !tool.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${tool.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tool.enabled ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-gray-900">{tool.todayUsage || 0}</p>
                  <p className="text-[10px] text-gray-500">Today</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-gray-900">{tool.totalUsage || 0}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-gray-900">{tool.hourlyLimit}</p>
                  <p className="text-[10px] text-gray-500">Limit/hr</p>
                </div>
              </div>

              {/* Rate Limits */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hourly Limit
                  </label>
                  <input
                    type="number"
                    value={tool.hourlyLimit}
                    onChange={(e) =>
                      updateTool(tool.id, { hourlyLimit: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-[#0C81F3] focus:outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Daily Limit
                  </label>
                  <input
                    type="number"
                    value={tool.dailyLimit}
                    onChange={(e) =>
                      updateTool(tool.id, { dailyLimit: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-[#0C81F3] focus:outline-none"
                    min="1"
                  />
                </div>
              </div>

              {/* Form Field Visibility */}
              {fieldDefs.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-1">Form Fields</p>
                  <p className="text-[10px] text-gray-400 mb-2">
                    Show or hide input fields in the tool form
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fieldDefs.map((field) => {
                      const isEnabled = currentFields[field.key]?.enabled !== false
                      return (
                        <button
                          key={field.key}
                          onClick={() => updateFormField(tool.id, tool.slug, field.key, !isEnabled)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
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
              <div className="border-t border-gray-100 pt-4 space-y-4">
                {/* Required Fields (inline form after results) */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Required Fields (Bottom Form)
                  </p>
                  <p className="text-[10px] text-gray-400 mb-2">
                    Fields shown in the lead form at the bottom of tool results
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'requireEmail', label: 'Email' },
                      { key: 'requireName', label: 'Name' },
                      { key: 'requirePhone', label: 'Phone' },
                      { key: 'requireCompany', label: 'Company' },
                    ].map((field) => (
                      <button
                        type="button"
                        key={field.key}
                        onClick={() => updateTool(tool.id, { [field.key]: !tool[field.key] })}
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
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600">
                        Lead Popup (Before Tool Use)
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Show a popup form before users can access this tool
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateTool(tool.id, { showLeadPopup: !tool.showLeadPopup })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${tool.showLeadPopup ? 'bg-[#0C81F3]' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tool.showLeadPopup ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>

                  {tool.showLeadPopup && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-[10px] text-gray-400 mb-2">Popup Form Fields</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'requireName', label: 'Name', icon: '👤' },
                          { key: 'requireEmail', label: 'Email', icon: '✉️' },
                          { key: 'requirePhone', label: 'Phone', icon: '📞' },
                          { key: 'requireCompany', label: 'Company', icon: '🏢' },
                        ].map((field) => (
                          <button
                            type="button"
                            key={`popup-${field.key}`}
                            onClick={() => updateTool(tool.id, { [field.key]: !tool[field.key] })}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              tool[field.key]
                                ? 'bg-white text-gray-900 border-gray-300 shadow-sm'
                                : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                            }`}
                          >
                            <span>{field.icon}</span>
                            {field.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {tool.requireName && tool.requireEmail
                          ? '✓ Name and Email will be required in the popup'
                          : tool.requireEmail
                            ? '✓ Email will be required in the popup'
                            : tool.requireName
                              ? '✓ Name will be required in the popup'
                              : 'No fields marked as required — all optional'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
