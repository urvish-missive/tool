import ScoreRing from './ScoreRing'

const SCORE_LABELS = {
  overall_score: 'Overall',
  seo_score: 'SEO',
  intent_score: 'Search Intent',
  depth_score: 'Content Depth',
  readability_score: 'Readability',
  structure_score: 'Structure',
  usefulness_score: 'Usefulness',
}

function PriorityBadge({ priority }) {
  const p = priority?.toUpperCase()
  const colors = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-green-100 text-green-700',
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colors[p] || 'bg-gray-100 text-gray-700'}`}
    >
      {p}
    </span>
  )
}

export default function AnalysisReport({ report }) {
  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Overall Score
        </h3>
        <ScoreRing score={report.overall_score} size={140} strokeWidth={10} />
        <p className="mt-4 text-lg font-medium text-gray-700 max-w-lg mx-auto">
          {report.overall_score >= 80
            ? 'Excellent'
            : report.overall_score >= 60
              ? 'Good'
              : report.overall_score >= 40
                ? 'Needs Improvement'
                : 'Significant Issues'}
        </p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(SCORE_LABELS)
          .slice(1)
          .map(([key, label]) => (
            <div
              key={key}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center"
            >
              <ScoreRing score={report[key]} size={70} strokeWidth={5} label={label} />
            </div>
          ))}
      </div>

      {/* Executive Summary */}
      {report.summary && (
        <Section title="Executive Summary">
          <p className="text-gray-600 leading-relaxed">{report.summary}</p>
        </Section>
      )}

      {/* Strengths */}
      {report.strengths?.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Critical Issues */}
      {report.critical_issues?.length > 0 && (
        <Section title="Critical Issues" accent="red">
          <div className="space-y-4">
            {report.critical_issues.map((issue, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-500">🔴</span>
                  <span className="font-semibold text-red-800">{issue.issue}</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  <strong>Why it matters:</strong> {issue.why_it_matters}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  <strong>How to fix:</strong> {issue.action}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Warnings */}
      {report.warnings?.length > 0 && (
        <Section title="Warnings" accent="amber">
          <ul className="space-y-2">
            {report.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-amber-500 mt-0.5 shrink-0">🟡</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Recommendations */}
      {report.recommendations?.length > 0 && (
        <Section title="Recommendations">
          <div className="space-y-4">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PriorityBadge priority={rec.priority} />
                  <span className="font-semibold text-gray-900">{rec.title}</span>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Why:</strong> {rec.why}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>How to improve:</strong> {rec.how}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Missing Topics */}
      {report.missing_topics?.length > 0 && (
        <Section title="Potential Missing Topics">
          <ul className="space-y-2">
            {report.missing_topics.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Heading Recommendations */}
      {report.heading_recommendations && (
        <Section title="Heading Recommendations">
          <div className="grid sm:grid-cols-2 gap-6">
            {report.heading_recommendations.current?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Current
                </h4>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {report.heading_recommendations.current.map((h, i) => (
                    <li key={i} className="bg-gray-50 rounded px-3 py-1.5">
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.heading_recommendations.suggested?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Suggested
                </h4>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {report.heading_recommendations.suggested.map((h, i) => (
                    <li key={i} className="bg-blue-50 rounded px-3 py-1.5">
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* FAQ Opportunities */}
      {report.faq_opportunities?.length > 0 && (
        <Section title="Potential FAQ Questions">
          <ol className="space-y-2 list-decimal list-inside text-gray-700">
            {report.faq_opportunities.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
          <button
            disabled
            className="mt-4 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
          >
            Generate FAQ Schema — Coming Soon
          </button>
        </Section>
      )}

      {/* Quick Wins */}
      {report.quick_wins?.length > 0 && (
        <Section title="Quick Wins">
          <ol className="space-y-2 list-decimal list-inside text-gray-700">
            {report.quick_wins.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ol>
        </Section>
      )}

      {/* Action Plan */}
      {report.action_plan?.length > 0 && (
        <Section title="SEO Content Action Plan">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-semibold text-gray-500">Priority</th>
                  <th className="text-left py-2 pr-4 font-semibold text-gray-500">Action</th>
                  <th className="text-left py-2 font-semibold text-gray-500">Reason</th>
                </tr>
              </thead>
              <tbody>
                {report.action_plan.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 pr-4">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-gray-900">{item.task}</td>
                    <td className="py-2.5 text-gray-600">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Programmatic Metrics */}
      {report.programmatic_metrics && (
        <Section title="Content Metrics">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              ['Words', report.programmatic_metrics.wordCount],
              ['Characters', report.programmatic_metrics.charCount.toLocaleString()],
              ['Sentences', report.programmatic_metrics.sentenceCount],
              ['Paragraphs', report.programmatic_metrics.paragraphCount],
              ['Headings', report.programmatic_metrics.totalHeadings],
              ['Links', report.programmatic_metrics.linkCount],
              ['Reading Time', `${report.programmatic_metrics.readingTimeMinutes} min`],
              ['Readability', report.programmatic_metrics.readabilityScore],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children, accent }) {
  const borderColors = { red: 'border-red-200', amber: 'border-amber-200' }
  return (
    <div
      className={`bg-white rounded-2xl border ${borderColors[accent] || 'border-gray-200'} shadow-sm p-6 sm:p-8`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}
