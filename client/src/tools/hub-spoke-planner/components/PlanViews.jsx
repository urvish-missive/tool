import { useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import { list, stageKey, stageLabel, stageShort, pathOf, isExisting } from '../utils/planHelpers'

// Shared cells used by the table and card views.
export function OutlineButton({ title, ctx }) {
  if (ctx.isExample) return null
  const o = ctx.outlines[title]
  return (
    <button className="mini obtn" type="button" onClick={() => ctx.onOutline(title)}>
      {!ctx.pro ? (
        <>
          <Lock className="lk" aria-hidden="true" />
          Outline
        </>
      ) : o ? (
        o.approved ? (
          'Outline approved ✓'
        ) : (
          'Open outline draft'
        )
      ) : (
        'Create outline'
      )}
    </button>
  )
}

function SiteLinks({ row }) {
  return list(row.site_links)
    .filter((l) => /^https?:\/\//i.test(l?.url || ''))
    .slice(0, 2)
    .map((l) => (
      <div className="sitelink" key={l.url}>
        Link from{' '}
        <a href={l.url} target="_blank" rel="noopener noreferrer">
          {pathOf(l.url)}
        </a>
        {l.anchor ? ` with the anchor "${l.anchor}"` : ''}
      </div>
    ))
}

function Status({ row, pillar, audit }) {
  if (!audit) return null
  if (isExisting(row))
    return (
      <div className="stat">
        <span className="chip exist">On your site</span>{' '}
        <a href={row.existing_url} target="_blank" rel="noopener noreferrer">
          {pathOf(row.existing_url)}
        </a>
        {row.action && <span className="act">{row.action}</span>}
      </div>
    )
  return (
    <div className="stat">
      <span className="chip todo">{pillar ? 'Missing: write this first' : 'New: to write'}</span>
    </div>
  )
}

function SaveBox({ title, ctx }) {
  if (ctx.isExample) return null
  return (
    <input
      type="checkbox"
      checked={ctx.isSaved(title)}
      onChange={() => ctx.onToggleSave(title)}
      aria-label="Save this topic"
    />
  )
}

/**
 * ctx: { plan, rows, isExample, pro, outlines, audit, isSaved, onToggleSave, onOutline, onCopy }
 * rows: [{ x, i, k, lock }] after the funnel filter
 */
export function PlanTable({ ctx }) {
  const h = ctx.plan.hub
  const wrapRef = useRef(null)
  const [scrollable, setScrollable] = useState(false)

  useEffect(() => {
    const check = () => {
      const w = wrapRef.current
      if (w) setScrollable(w.scrollWidth > w.clientWidth + 2)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [ctx.rows])

  return (
    <>
      <p className={`scrollhint${scrollable ? ' on' : ''}`}>
        Swipe or scroll sideways to see every column.
      </p>
      <div className="tablewrap" tabIndex={0} ref={wrapRef}>
        <table>
          <thead>
            <tr>
              <th>{ctx.isExample ? '#' : 'Save'}</th>
              <th>Working title</th>
              <th>Stage</th>
              <th>Written for</th>
              <th>Purpose</th>
              <th>Format</th>
              <th>Search intent</th>
              <th>Internal link</th>
              <th>Call to action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="prow">
              <td>
                <label className="pick">
                  {!isExisting(h) && <SaveBox title={h.working_title} ctx={ctx} />}
                  <span className="ptag">Pillar</span>
                </label>
              </td>
              <td className="t">
                {h.working_title}
                <Status row={h} pillar audit={ctx.audit} />
                {!isExisting(h) && (
                  <div>
                    <OutlineButton title={h.working_title} ctx={ctx} />
                  </div>
                )}
              </td>
              <td>
                <span className={`chip ${stageKey(h.funnel_stage)}`}>
                  {stageShort(h.funnel_stage)}
                </span>
              </td>
              <td>{h.reading_level}</td>
              <td>{h.business_goal}</td>
              <td>{h.content_format}</td>
              <td>{h.search_intent || 'Informational'}</td>
              <td>Every supporting page links back to this page</td>
              <td>{h.cta || 'Points readers to the supporting pages'}</td>
            </tr>
            {ctx.rows.map(({ x, i, k, lock }) => (
              <tr key={i}>
                <td>
                  <label className="pick">
                    {!lock && !isExisting(x) && <SaveBox title={x.working_title} ctx={ctx} />}
                    {i + 1}
                  </label>
                </td>
                <td className="t">
                  {x.working_title}
                  {x.from_source && <div className="src">From your file: {x.from_source}</div>}
                  <Status row={x} audit={ctx.audit} />
                  {!lock && !isExisting(x) && (
                    <div>
                      <OutlineButton title={x.working_title} ctx={ctx} />
                    </div>
                  )}
                </td>
                <td>
                  <span className={`chip ${k}`}>{stageShort(x.funnel_stage)}</span>
                </td>
                {lock ? (
                  <td colSpan={6} className="lockline">
                    Unlocks with the full plan
                  </td>
                ) : (
                  <>
                    <td>{x.audience_level}</td>
                    <td>{x.business_purpose}</td>
                    <td>{x.format_angle}</td>
                    <td>{x.search_intent}</td>
                    <td>
                      {x.linking_hook}
                      <SiteLinks row={x} />
                    </td>
                    <td>{x.cta}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function PlanCards({ ctx }) {
  const h = ctx.plan.hub
  const hk = stageKey(h.funnel_stage)
  const [copied, setCopied] = useState(-1)
  return (
    <div className="spokes">
      <section className="hubcard">
        <div>
          <div>
            <p className="eyebrow">Start here · Your pillar page</p>
            <h3 style={{ fontSize: 20 }}>{h.working_title}</h3>
          </div>
          <div className="chips">
            <span className={`chip ${hk}`}>{stageLabel(h.funnel_stage)}</span>
            <span className="chip">For: {h.reading_level}</span>
            <span className="chip">{h.business_goal}</span>
            <span className="chip">{h.content_format}</span>
          </div>
        </div>
      </section>
      {ctx.rows.map(({ x, i, k, lock }) => (
        <article className="spoke" key={i}>
          <span className={`num bg-${k}`}>{i + 1}</span>
          <div className="body">
            {x.group && <span className="group">{x.group}</span>}
            {x.from_source && <span className="src">From your file: {x.from_source}</span>}
            <div className="titleline">
              <div>
                <h3>{x.working_title}</h3>
                <Status row={x} audit={ctx.audit} />
              </div>
              {!lock && (
                <span className="row" style={{ flex: 'none' }}>
                  {!ctx.isExample && (
                    <button
                      className="mini"
                      type="button"
                      onClick={() => ctx.onToggleSave(x.working_title)}
                    >
                      {ctx.isSaved(x.working_title) ? 'Saved ✓' : 'Save'}
                    </button>
                  )}
                  <button
                    className="mini"
                    type="button"
                    onClick={async () => {
                      if (await ctx.onCopy(i)) setCopied(i)
                    }}
                  >
                    {copied === i ? 'Copied' : 'Copy'}
                  </button>
                  <OutlineButton title={x.working_title} ctx={ctx} />
                </span>
              )}
            </div>
            {lock ? (
              <>
                <div className="chips">
                  <span className={`chip ${k}`}>{stageLabel(x.funnel_stage)}</span>
                </div>
                <p className="lockline">
                  Audience, format, internal link and call to action unlock with the full plan.
                </p>
              </>
            ) : (
              <>
                <div className="chips">
                  <span className={`chip ${k}`}>{stageLabel(x.funnel_stage)}</span>
                  <span className="chip">For: {x.audience_level}</span>
                  <span className="chip">{x.format_angle}</span>
                  <span className="chip">{x.search_intent} search</span>
                </div>
                <dl>
                  <dt>Why publish it</dt>
                  <dd>{x.business_purpose}</dd>
                  <dt>Internal link</dt>
                  <dd>
                    {x.linking_hook}
                    <SiteLinks row={x} />
                  </dd>
                  <dt>Call to action</dt>
                  <dd>{x.cta}</dd>
                </dl>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

// Pillar in the middle, supporting pages around it coloured by funnel stage.
function MapSvg({ spokes, sel, onSelect }) {
  const cx = 160
  const cy = 150
  const R = 108
  const n = spokes.length
  const pts = spokes.map((s, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n
    return { s, i, x: +(cx + R * Math.cos(a)).toFixed(1), y: +(cy + R * Math.sin(a)).toFixed(1) }
  })
  return (
    <svg
      viewBox="0 0 320 300"
      role="img"
      aria-label={`Cluster map: pillar page with ${n} supporting pages coloured by funnel stage`}
    >
      <defs>
        <linearGradient id="hg" x1="0" x2="1">
          <stop offset="0" stopColor="#1f7cf2" />
          <stop offset="1" stopColor="#ee8a80" />
        </linearGradient>
      </defs>
      {pts.map((p) => (
        <line key={'l' + p.i} x1={cx} y1={cy} x2={p.x} y2={p.y} />
      ))}
      <circle fill="url(#hg)" cx={cx} cy={cy} r="34" />
      <text className="hubt" x={cx} y={cy + 5} textAnchor="middle">
        PILLAR
      </text>
      {pts.map((p) => (
        <g key={'n' + p.i}>
          <circle
            data-i={p.i}
            className={`${stageKey(p.s.funnel_stage)}${sel === p.i ? ' on' : ''}`}
            cx={p.x}
            cy={p.y}
            r="17"
            onClick={() => onSelect(p.i)}
          />
          <text className="n" x={p.x} y={(p.y + 4).toFixed(1)} textAnchor="middle">
            {p.i + 1}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function ClusterMap({ spokes, sel, onSelect }) {
  return (
    <div className="panel glance">
      <div className="map">
        {spokes.length > 0 && <MapSvg spokes={spokes} sel={sel} onSelect={onSelect} />}
      </div>
      <ol className="glist">
        {spokes.map((x, i) => (
          <li key={i} className={sel === i ? 'on' : ''} onClick={() => onSelect(i)}>
            <span className={`num bg-${stageKey(x.funnel_stage)}`}>{i + 1}</span>
            <div>
              {x.working_title}
              <div className="chips">
                <span className={`chip ${stageKey(x.funnel_stage)}`}>
                  {stageLabel(x.funnel_stage)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
