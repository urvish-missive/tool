import { useLayoutEffect, useRef, useState } from 'react'
import { outlineMd, copyText } from '../utils/planHelpers'

// Textarea that grows with its content.
function AutoTextarea(props) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 4 + 'px'
  }, [props.value])
  return <textarea ref={ref} {...props} />
}

/**
 * Edit, approve and copy the outline of one page. Changes save as you type (the page persists them).
 * entry: { data, approved }
 */
export default function OutlineEditor({
  entry,
  hasDraft,
  error,
  onChange,
  onRegenerate,
  onWriteDraft,
  onBack,
}) {
  const [regenArmed, setRegenArmed] = useState(false)
  const [status, setStatus] = useState('')
  const d = entry.data
  const approved = entry.approved
  const S = d.sections

  const setField = (k) => (e) =>
    onChange((o) => ({ ...o, data: { ...o.data, [k]: e.target.value } }))
  const setSections = (fn) =>
    onChange((o) => ({ ...o, data: { ...o.data, sections: fn([...o.data.sections]) } }))
  const setSection = (k, f) => (e) =>
    setSections((s) => {
      s[k] = { ...s[k], [f]: e.target.value }
      return s
    })
  const move = (k, to) =>
    setSections((s) => {
      ;[s[k], s[to]] = [s[to], s[k]]
      return s
    })

  const actions = (
    <>
      {approved && (
        <button className="btn sm grad" type="button" onClick={onWriteDraft}>
          {hasDraft ? 'Open the draft' : 'Write the draft'}
        </button>
      )}
      <button
        className="btn sm"
        type="button"
        onClick={async () => {
          setRegenArmed(false)
          setStatus((await copyText(outlineMd(d))) ? 'Outline copied.' : 'Copy blocked')
        }}
      >
        Copy outline
      </button>
      {!approved && (
        <button
          className="btn sm"
          type="button"
          onClick={() => {
            if (!regenArmed) return setRegenArmed(true)
            setRegenArmed(false)
            onRegenerate()
          }}
        >
          {regenArmed ? 'Click again to replace' : 'Regenerate'}
        </button>
      )}
      <button
        className={`btn sm ${approved ? '' : 'grad'}`}
        type="button"
        onClick={() => {
          setRegenArmed(false)
          onChange((o) => ({ ...o, approved: !o.approved }))
        }}
      >
        {approved ? 'Edit again' : 'Approve outline'}
      </button>
    </>
  )

  const input = (k, label, cls = '') => (
    <div className={`field ${cls}`}>
      <label htmlFor={`o-${k}`}>{label}</label>
      <input id={`o-${k}`} type="text" value={d[k]} onChange={setField(k)} disabled={approved} />
    </div>
  )
  const area = (k, label, rows, help = '') => (
    <div className="field full">
      <label htmlFor={`o-${k}`}>{label}</label>
      <AutoTextarea
        id={`o-${k}`}
        rows={rows}
        value={d[k]}
        onChange={setField(k)}
        disabled={approved}
      />
      {help && <span className="help">{help}</span>}
    </div>
  )

  return (
    <div className="results" id="outline">
      {error && <p className="err">{error}</p>}
      <div className="rhead">
        <div>
          <p className="eyebrow">
            Outline ·{' '}
            <span className={`ostate ${approved ? 'ok' : ''}`}>
              {approved ? 'Approved' : 'Draft'}
            </span>
          </p>
          <h2>{d.title}</h2>
        </div>
        <div className="row">
          {actions}
          <span className="status" role="status">
            {status}
          </span>
        </div>
      </div>
      {approved ? (
        <p className="banner ok">
          Approved. Copy it for your writer, or press &quot;Edit again&quot; to change it.
          {!hasDraft &&
            ' Press "Write the draft" to turn it into a full first draft, checked against our content QA checklist.'}
        </p>
      ) : (
        <p className="help">
          Review each part and edit anything you like. Changes save as you type. Approve it when it
          is ready to hand over.
        </p>
      )}
      <section className="panel">
        <p className="eyebrow">Page details</p>
        <div className="grid2">
          {input('title', 'Page title (H1)', 'full')}
          {input('meta_title', 'Meta title')}
          {input('primary_keyword', 'Primary keyword')}
          {area('meta_description', 'Meta description', 2)}
          {input('secondary_keywords', 'Secondary keywords')}
          {input('search_intent', 'Search intent')}
          {input('word_count', 'Suggested length (words)')}
          {input('cta', 'Call to action')}
        </div>
      </section>
      <section>
        <p className="eyebrow">Structure</p>
        <ol className="osecs">
          {S.map((x, k) => (
            <li key={k}>
              <div className="osechead">
                <span className="num bg-tofu">{k + 1}</span>
                <input
                  type="text"
                  value={x.heading}
                  onChange={setSection(k, 'heading')}
                  aria-label={`Section ${k + 1} heading`}
                  disabled={approved}
                />
                {!approved && (
                  <span className="row" style={{ flex: 'none' }}>
                    <button
                      className="mini"
                      type="button"
                      aria-label="Move section up"
                      disabled={!k}
                      onClick={() => move(k, k - 1)}
                    >
                      ↑
                    </button>
                    <button
                      className="mini"
                      type="button"
                      aria-label="Move section down"
                      disabled={k >= S.length - 1}
                      onClick={() => move(k, k + 1)}
                    >
                      ↓
                    </button>
                    <button
                      className="mini"
                      type="button"
                      onClick={() => setSections((s) => s.filter((_, j) => j !== k))}
                    >
                      Remove
                    </button>
                  </span>
                )}
              </div>
              <AutoTextarea
                value={x.points}
                onChange={setSection(k, 'points')}
                rows={Math.max(3, x.points.split('\n').length + 1)}
                aria-label={`Section ${k + 1} key points, one per line`}
                disabled={approved}
              />
            </li>
          ))}
        </ol>
        {!approved && (
          <>
            <button
              className="btn sm"
              type="button"
              onClick={() => setSections((s) => [...s, { heading: 'New section', points: '' }])}
            >
              + Add a section
            </button>{' '}
            <span className="help">
              One key point per line. Start a line with &quot;H3:&quot; to make it a sub-heading.
            </span>
          </>
        )}
      </section>
      <section className="panel">
        <div className="grid2">
          {area('faqs', 'FAQs to answer', 4, 'One question per line.')}
          {area(
            'internal_links',
            'Internal links',
            4,
            'One per line, written as: anchor text -> page to link to.'
          )}
        </div>
      </section>
      <div className="endrow">
        <button className="btn dark" type="button" onClick={onBack}>
          ← Back to plan
        </button>
        {actions}
      </div>
    </div>
  )
}
