import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { mdToHtml, exportHtml, PLACEHOLDER_RE } from '../utils/markdown'
import { exportDraftPdf } from '../utils/exportDraftPdf'
import {
  list,
  autoFeedback,
  slugOf,
  downloadBlob,
  copyText,
  store,
  STORE_KEYS,
} from '../utils/planHelpers'
import { useSendHubSpokeToWordpressMutation } from '../../../services/apiSlice'

const FEEDBACK_CHIPS = [
  'Not enough depth: it reads as generic advice, not something my reader feels is about them',
  'Thin on E-E-A-T: no first-hand experience, no proof, no sources',
  'No media: add images, infographics, tables and a video where they help',
  "Too explainer-like: drop the 'what this means / the benefit' pattern and write it as one flowing piece",
  'Too long and repetitive: cut filler, keep the substance',
  'Wrong tone for the audience: make it sound like a practitioner talking to a peer',
]

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

// Downloads, Google Docs copy and WordPress for an approved draft.
function PublishPanel({ draft, title, excerpt }) {
  const [status, setStatus] = useState('')
  const [wpUrl, setWpUrl] = useState('')
  const [sendToWordpress] = useSendHubSpokeToWordpressMutation()

  const copyForDocs = async () => {
    const html = exportHtml(draft.md)
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([draft.md], { type: 'text/plain' }),
        }),
      ])
      setStatus('docs')
    } catch {
      setStatus(
        (await copyText(draft.md))
          ? 'Copied as text (formatted copy was blocked in this view).'
          : 'Copy was blocked in this view.'
      )
    }
  }

  const sendWp = async () => {
    setWpUrl('')
    setStatus('Sending to WordPress…')
    try {
      const r = await sendToWordpress({
        title,
        content: exportHtml(draft.md, true),
        excerpt: excerpt || '',
        slug: slugOf(title),
        status: 'draft',
      }).unwrap()
      setWpUrl(r.url || '')
      setStatus('Draft created in WordPress.')
    } catch (err) {
      setStatus(
        err?.data?.error || 'WordPress did not accept the post. Check the connection and try again.'
      )
    }
  }

  return (
    <section className="panel pub">
      <p className="eyebrow">Publish or hand over</p>
      <div className="pubgrid">
        <div>
          <h3>Download</h3>
          <div className="row">
            <button
              className="btn sm"
              type="button"
              onClick={() => {
                try {
                  downloadBlob(slugOf(title) + '.pdf', exportDraftPdf(draft.md, title))
                  setStatus('PDF downloaded.')
                } catch {
                  setStatus('The PDF could not be built. Download the HTML instead.')
                }
              }}
            >
              Download PDF
            </button>
            <button
              className="btn sm"
              type="button"
              onClick={() => {
                downloadBlob(
                  slugOf(title) + '.html',
                  new Blob([exportHtml(draft.md)], { type: 'text/html' })
                )
                setStatus('HTML downloaded.')
              }}
            >
              Download HTML
            </button>
            <button
              className="btn sm"
              type="button"
              onClick={async () =>
                setStatus((await copyText(draft.md)) ? 'Draft copied.' : 'Copy blocked')
              }
            >
              Copy Markdown
            </button>
          </div>
        </div>
        <div>
          <h3>Google Docs</h3>
          <div className="row">
            <button className="btn sm" type="button" onClick={copyForDocs}>
              Copy for Google Docs
            </button>
          </div>
          <span className="help">
            Copies the draft with formatting, to paste into a new Google Doc.
          </span>
        </div>
        <div>
          <h3>WordPress</h3>
          <div className="row">
            <button className="btn sm grad" type="button" onClick={sendWp}>
              Send to WordPress as a draft
            </button>
          </div>
          <span className="help">
            Creates an unpublished draft post in your blog, with the title, meta description as the
            excerpt and a URL slug, so you review it in WordPress before it goes live.
          </span>
        </div>
      </div>
      <span className="status" role="status">
        {status === 'docs' ? (
          <>
            Copied with formatting.{' '}
            <a
              href="https://docs.google.com/document/create"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open a new Google Doc
            </a>{' '}
            and paste.
          </>
        ) : (
          status
        )}
        {wpUrl && (
          <>
            {' '}
            <a href={wpUrl} target="_blank" rel="noopener noreferrer">
              Open it in the editor
            </a>
          </>
        )}
      </span>
    </section>
  )
}

/**
 * The first draft of one page: preview, edit, items to source, QA pointers, rewrite with feedback,
 * approve, then publish.
 * draft: { md, qa, assets, notes, sources, pnotes, feedback, version, approved, at }
 */
export default function DraftView({ draft, outline, error, onChange, onRewrite, onBack }) {
  const [mode, setMode] = useState('preview')
  const [sideHidden, setSideHidden] = useState(() => store.get(STORE_KEYS.side) === 'hidden')
  const [fb, setFb] = useState('')
  const [fbHint, setFbHint] = useState(false)
  const [status, setStatus] = useState('')
  const d = draft
  const title = outline?.data?.title || ''

  const words = d.md.split(/\s+/).filter(Boolean).length
  const ph = (d.md.match(PLACEHOLDER_RE) || []).length
  const html = useMemo(() => mdToHtml(d.md), [d.md])
  const counts = { pass: 0, needs_human: 0, fail: 0 }
  d.qa.forEach((q) => {
    counts[q.status in counts ? q.status : 'needs_human']++
  })
  const todo = d.qa
    .filter((q) => q.status !== 'pass')
    .sort((a, b) => (a.status === 'fail' ? 0 : 1) - (b.status === 'fail' ? 0 : 1))
  const auto = d.approved ? [] : autoFeedback(d.md).split('\n').filter(Boolean)

  const rewrite = () => {
    const text =
      fb.trim() ||
      autoFeedback(d.md) ||
      'Rewrite this from scratch with a different structure and fresh examples. Do not reuse sentences from the previous draft.'
    onRewrite(text.slice(0, 3000))
  }
  const rewriteWithFeedback = () => {
    const text = fb.trim()
    if (!text) return setFbHint(true)
    const extra = autoFeedback(d.md)
    onRewrite((text + (extra ? '\n' + extra : '')).slice(0, 3000))
  }

  const actions = (
    <>
      <button
        className="btn sm"
        type="button"
        onClick={async () => setStatus((await copyText(d.md)) ? 'Draft copied.' : 'Copy blocked')}
      >
        Copy draft
      </button>
      {!d.approved && (
        <button className="btn sm" type="button" onClick={rewrite}>
          Rewrite
        </button>
      )}
      <button
        className={`btn sm ${d.approved ? '' : 'grad'}`}
        type="button"
        onClick={() => onChange((x) => ({ ...x, approved: !x.approved }))}
      >
        {d.approved ? 'Edit again' : 'Approve draft'}
      </button>
    </>
  )

  return (
    <div className="results" id="draft">
      {error && <p className="err">{error}</p>}
      <div className="rhead">
        <div>
          <p className="eyebrow">
            Draft ·{' '}
            <span className={`ostate ${d.approved ? 'ok' : ''}`}>
              {d.approved ? 'Approved' : 'First draft'}
            </span>{' '}
            · {words} words · {ph} items to source
          </p>
          <h2>{title}</h2>
        </div>
        <div className="row">
          {actions}
          <span className="status" role="status">
            {status}
          </span>
        </div>
      </div>

      {(d.version || 1) > 1 && !d.approved && (
        <div className="banner ok">
          <b>
            Version {d.version}, rewritten {new Date(d.at).toLocaleTimeString()}.
          </b>
          {d.notes.length > 0 && (
            <ul className="gaps" style={{ marginTop: 6 }}>
              {d.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {d.approved ? (
        <>
          <p className="banner ok">
            Approved. The highlighted items still need a human: real statistics, examples, quotes
            and visuals.
          </p>
          <PublishPanel draft={d} title={title} excerpt={outline?.data?.meta_description} />
        </>
      ) : (
        <p className="help">
          This is a first draft written from your approved outline. Highlighted items mark where a
          real statistic, example, quote or visual has to be added by a person. Edit the text, then
          approve it.
        </p>
      )}

      <div className="dwrap">
        <div className="dmain">
          <div className="dtabs seg">
            {['preview', 'edit', 'assets'].map((m) => (
              <button type="button" key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
                {m === 'preview'
                  ? 'Preview'
                  : m === 'edit'
                    ? 'Edit text'
                    : `To source (${d.assets.length || ph})`}
              </button>
            ))}
          </div>
          {mode === 'edit' ? (
            <>
              <AutoTextarea
                className="dmd"
                value={d.md}
                disabled={d.approved}
                aria-label="Draft text in Markdown"
                onChange={(e) => onChange((x) => ({ ...x, md: e.target.value }))}
              />
              <span className="help">
                Markdown. Placeholders look like [STAT: ...]; replace each one with the real thing
                or leave it for your editor.
              </span>
            </>
          ) : mode === 'assets' ? (
            <section className="panel">
              <p className="eyebrow">Everything a person still has to add</p>
              {d.assets.length ? (
                <table className="atable">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Section</th>
                      <th>What to source or create</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.assets.map((a, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`ph ph-${a.type}`}>
                            <b>{a.type}</b>
                          </span>
                        </td>
                        <td>{a.section}</td>
                        <td>{a.brief}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="help">No placeholders were listed.</p>
              )}
              {d.notes.length > 0 && (
                <>
                  <p className="eyebrow" style={{ marginTop: 18 }}>
                    Editor notes
                  </p>
                  <ul className="gaps">
                    {d.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ) : (
            <>
              <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
              {list(d.sources).length > 0 && (
                <section className="panel srcs">
                  <p className="eyebrow">Sources cited</p>
                  <ol>
                    {d.sources.map((x) => (
                      <li key={x.url}>
                        <a href={x.url} target="_blank" rel="noopener noreferrer">
                          {x.title || x.url}
                        </a>
                        {x.published && <span className="help"> ({x.published})</span>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="dside">
          <button
            type="button"
            className="dside-toggle"
            aria-expanded={!sideHidden}
            onClick={() => {
              store.set(STORE_KEYS.side, sideHidden ? 'shown' : 'hidden')
              setSideHidden(!sideHidden)
            }}
          >
            <b>Work on these</b>
            <span className="chip todo">{todo.length + auto.length}</span>
          </button>
          <div className="dside-body" hidden={sideHidden}>
            {auto.length > 0 && (
              <>
                <p className="eyebrow">Rewrite first</p>
                <ul className="pts">
                  {auto.map((x, i) => (
                    <li className="p-fail" key={i}>
                      {x.split('. ')[0]}.
                    </li>
                  ))}
                </ul>
              </>
            )}
            {todo.length ? (
              <>
                <p className="eyebrow">Needs a human</p>
                <ul className="pts">
                  {todo.map((q, i) => (
                    <li className={q.status === 'fail' ? 'p-fail' : 'p-human'} key={i}>
                      <b>{q.item.split(':')[0]}</b>
                      {q.note && <span> {q.note}</span>}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="help">
                Nothing flagged. Fill the highlighted placeholders and it is ready.
              </p>
            )}
            {list(d.pnotes).length > 0 && (
              <ul className="pts">
                {d.pnotes.map((x, i) => (
                  <li className="p-human" key={i}>
                    {x}
                  </li>
                ))}
              </ul>
            )}
            {ph > 0 && (
              <p className="pts-foot">
                <button type="button" className="linkbtn" onClick={() => setMode('assets')}>
                  {ph} items to source
                </button>{' '}
                · stats, examples, visuals
              </p>
            )}
            <details className="passed">
              <summary>{counts.pass} checks passed</summary>
              <ul className="pts">
                {d.qa
                  .filter((q) => q.status === 'pass')
                  .map((q, i) => (
                    <li className="p-pass" key={i}>
                      {q.item.split(':')[0]}
                    </li>
                  ))}
              </ul>
            </details>
          </div>
        </aside>
      </div>

      {!d.approved && (
        <section className="panel fb">
          <p className="eyebrow">Not good enough? Tell it what is wrong and it rewrites</p>
          <div className="chips fbchips">
            {FEEDBACK_CHIPS.map((x) => (
              <button
                type="button"
                className="mini"
                key={x}
                onClick={() => setFb((v) => (v.trim() ? v.trim() + '\n' : '') + x)}
              >
                {x.split(':')[0]}
              </button>
            ))}
          </div>
          <AutoTextarea
            rows={3}
            value={fb}
            onChange={(e) => setFb(e.target.value)}
            placeholder={
              fbHint
                ? 'Type what is wrong first, or pick a chip above.'
                : 'e.g. Section 3 has no example, the intro is too long, and nothing here would make a HR manager feel this was written for them.'
            }
          />
          <div className="row">
            <button className="btn grad sm" type="button" onClick={rewriteWithFeedback}>
              Rewrite with this feedback
            </button>
            <span className="help">
              Version {d.version || 1}. &quot;Rewrite&quot; without notes also works: it sends any
              problems the page can detect, or asks for a fresh take.
            </span>
          </div>
          {list(d.feedback).length > 0 && (
            <details className="more">
              <summary>Feedback given so far ({d.feedback.length})</summary>
              <ol className="gaps" style={{ paddingTop: 10 }}>
                {d.feedback.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ol>
            </details>
          )}
        </section>
      )}

      <div className="endrow">
        <button className="btn dark" type="button" onClick={onBack}>
          ← Back to outline
        </button>
        {actions}
      </div>
    </div>
  )
}
