import { useState } from 'react'
import { Lock } from 'lucide-react'
import Rich, { RichList } from './Rich'
import { PlanTable, PlanCards, ClusterMap } from './PlanViews'
import {
  list,
  stageKey,
  hostOf,
  isExisting,
  spokeText,
  toMarkdown,
  toCsv,
  downloadBlob,
  copyText,
} from '../utils/planHelpers'

const Seg = ({ on, onClick, children }) => (
  <button type="button" aria-pressed={on} onClick={onClick}>
    {children}
  </button>
)

function StrategySummary({ s, hub }) {
  return (
    <section className="panel">
      <p className="eyebrow">Strategy summary</p>
      <dl>
        {s.you_told_us && (
          <>
            <dt>What you told us</dt>
            <dd>{s.you_told_us}</dd>
          </>
        )}
        {list(s.our_suggestions).length > 0 && (
          <>
            <dt>What we would also suggest</dt>
            <dd>
              <RichList items={list(s.our_suggestions)} />
            </dd>
          </>
        )}
        {s.business_type && (
          <>
            <dt>Business type</dt>
            <dd>
              <Rich text={s.business_type} />
            </dd>
          </>
        )}
        <dt>Audience</dt>
        <dd>
          <Rich text={s.target_icp} />
        </dd>
        <dt>Goal</dt>
        <dd>
          <Rich text={s.primary_goal} />
        </dd>
        <dt>Promoting</dt>
        <dd>
          <Rich text={s.product_offer} />
        </dd>
        <dt>What people search for</dt>
        <dd>
          <Rich text={s.core_search_intent} />
        </dd>
        <dt>Why the pillar comes first</dt>
        <dd>{hub.strategic_value}</dd>
        {list(s.assumptions).length > 0 && (
          <>
            <dt>Assumptions</dt>
            <dd>
              <RichList items={list(s.assumptions)} />
            </dd>
          </>
        )}
      </dl>
    </section>
  )
}

function LockedSummary({ upgradeUrl, onUpsell }) {
  const bar = (w) => <span className="sk" style={{ width: `${w}%` }} />
  return (
    <section className="panel sumlock">
      <p className="eyebrow">Strategy summary</p>
      <dl aria-hidden="true">
        <dt>Business type</dt>
        <dd>{bar(28)}</dd>
        <dt>Audience</dt>
        <dd>
          {bar(92)}
          {bar(55)}
        </dd>
        <dt>Goal</dt>
        <dd>{bar(34)}</dd>
        <dt>What people search for</dt>
        <dd>{bar(86)}</dd>
        <dt>Why the pillar comes first</dt>
        <dd>{bar(78)}</dd>
        <dt>What we would also suggest</dt>
        <dd>
          {bar(70)}
          {bar(64)}
          {bar(48)}
        </dd>
      </dl>
      <div className="upsell">
        <span className="lockico">
          <Lock aria-hidden="true" />
        </span>
        <h3>Strategy summary is on the upgraded plan</h3>
        <p className="help">
          See who this cluster is for, the goal behind it, why the pillar comes first and what our
          strategists would add.
        </p>
        {upgradeUrl ? (
          <a className="btn grad" href={upgradeUrl} target="_blank" rel="noopener noreferrer">
            Upgrade to unlock
          </a>
        ) : (
          <button className="btn grad" type="button" onClick={onUpsell}>
            Upgrade to unlock
          </button>
        )}
      </div>
    </section>
  )
}

// Unlock form fields. Name, email and company always show; phone shows when the admin requires it.
const GATE_FIELDS = [
  { key: 'name', label: 'Your name', type: 'text', autoComplete: 'name' },
  { key: 'email', label: 'Work email', type: 'email', autoComplete: 'email' },
  { key: 'company', label: 'Company', type: 'text', autoComplete: 'organization' },
  { key: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', onlyWhenRequired: true },
]

// required: { name, email, company, phone } from the admin panel's "Required Fields"
function LeadGate({ shown, total, showNote, required, onUnlock }) {
  const [lead, setLead] = useState({ name: '', email: '', company: '', phone: '' })
  const [invalid, setInvalid] = useState('')
  const fields = GATE_FIELDS.filter((x) => !x.onlyWhenRequired || required[x.key])
  const set = (k) => (e) => setLead((l) => ({ ...l, [k]: e.target.value }))
  return (
    <section className="gate" id="gate">
      <div>
        <div>
          <p className="eyebrow">
            {shown} of {total} supporting pages shown in full
          </p>
          <h2>Unlock your full plan, free</h2>
          {showNote && <span className="err">Unlock your plan to save topics to a shortlist.</span>}
          <ul>
            <li>Details for all {total} supporting pages</li>
            <li>The internal linking plan</li>
            <li>A shortlist to save topics across plans</li>
            <li>CSV and text export for your team</li>
          </ul>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            const v = Object.fromEntries(fields.map((x) => [x.key, lead[x.key].trim()]))
            const missing = fields.filter((x) => required[x.key] && !v[x.key])
            let error = missing.length
              ? `Please enter your ${missing.map((x) => x.label.replace(/^Your /, '').toLowerCase()).join(', ')}.`
              : ''
            if (!error && v.email && !/^[^s@]+@[^s@]+.[^s@]{2,}$/.test(v.email))
              error = 'Please enter a valid email address.'
            if (!error && !v.name && !v.email && !v.phone)
              error = 'Please enter your name, email or phone.'
            setInvalid(error)
            if (!error) onUnlock(v)
          }}
        >
          {fields.map((x) => (
            <div className="field" key={x.key}>
              <label htmlFor={`l-${x.key}`}>
                {x.label} {!required[x.key] && <small>(optional)</small>}
              </label>
              <input
                id={`l-${x.key}`}
                type={x.type}
                autoComplete={x.autoComplete}
                value={lead[x.key]}
                onChange={set(x.key)}
              />
            </div>
          ))}
          {invalid && <span className="err">{invalid}</span>}
          <button className="btn grad" type="submit">
            Unlock full plan
          </button>
          <span className="help">We may contact you about content strategy. No spam.</span>
        </form>
      </div>
    </section>
  )
}

/**
 * The plan screen. All plan actions are handled by the page; this renders them.
 */
export default function PlanResults({
  plan,
  fields,
  isExample,
  pro,
  locked,
  summaryOk,
  freeSpokes,
  leadRequired,
  upgradeUrl,
  outlines,
  isSaved,
  gateNote,
  error,
  onToggleSave,
  onOutline,
  onRefine,
  onIndustry,
  onPlanPillar,
  onUnlock,
  onUpsell,
  onBack,
}) {
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('table')
  const [sel, setSel] = useState(-1)
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState('')

  const d = plan
  const s = d.summary || {}
  const h = d.hub || {}
  const sp = list(d.spokes)
  const l = d.linking || {}
  const mp = list(d.more_pillars)
  const counts = { tofu: 0, mofu: 0, bofu: 0 }
  sp.forEach((x) => {
    const k = stageKey(x.funnel_stage)
    if (k in counts) counts[k]++
  })
  const rows = sp
    .map((x, i) => ({ x, i, k: stageKey(x.funnel_stage), lock: locked && i >= freeSpokes }))
    .filter((r) => filter === 'all' || filter === r.k)
  const nEx = sp.filter(isExisting).length
  const audit = !isExample && !!d.site?.url
  const prof = d.site_profile
  const gaps = list(d.gap_summary)

  const ctx = {
    plan: d,
    rows,
    isExample,
    pro,
    outlines,
    audit,
    isSaved,
    onToggleSave,
    onOutline,
    onCopy: (i) => copyText(spokeText(sp[i], i)),
  }

  const submitIndustry = () => {
    const v = industry.trim().slice(0, 80)
    if (v) onIndustry(v)
  }

  return (
    <div className="results">
      {error && <p className="err">{error}</p>}
      {!isExample && fields?.source_name && (
        <p className="banner ok">
          Topics drawn from <b>{fields.source_name}</b>. Each page shows which part of the file it
          comes from.
        </p>
      )}
      {!isExample && d.site_error && (
        <p className="banner">
          We could not read that website, so this plan is based on your topic alone and may not
          match what the business sells. Check the address and try again.
        </p>
      )}
      {!isExample && d.site?.url && (prof || gaps.length > 0) && (
        <section className="panel found">
          <p className="eyebrow">
            What we found on {hostOf(d.site.url)} · {d.site.count || list(d.site.pages).length}{' '}
            pages read
          </p>
          {prof?.business && <h3>{prof.business}</h3>}
          {list(prof?.offerings).length > 0 && (
            <div className="chips">
              {list(prof.offerings).map((x) => (
                <span className="chip" key={x}>
                  {x}
                </span>
              ))}
            </div>
          )}
          {(prof?.confidence === 'low' || d.site.weak) && (
            <p className="banner">
              We could read very little of this site, so treat this profile with care. Describe the
              business in &quot;Anything else we should know&quot; and rebuild.
            </p>
          )}
          {gaps.length > 0 && (
            <ul className="gaps">
              {gaps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
          <p className="help">
            Not right? Go back, describe the business in &quot;Anything else we should know&quot;,
            and build again.
          </p>
        </section>
      )}
      {isExample && (
        <p className="banner">
          This is a sample plan for the keyword &quot;employee onboarding software&quot;. Go back to
          the form to build your own.
        </p>
      )}

      <section>
        <div className="rhead" style={{ marginBottom: 14 }}>
          <div>
            <p className="eyebrow">
              Content cluster · <Rich text={s.hub_concept || ''} />
              {!isExample && fields?.industry ? ` · Tailored to ${fields.industry}` : ''}
            </p>
            <h2>
              {audit && (nEx || isExisting(h))
                ? `${sp.length - nEx + (isExisting(h) ? 0 : 1)} pages to write · ${nEx + (isExisting(h) ? 1 : 0)} already on your site`
                : `1 pillar page + ${sp.length} supporting pages`}
            </h2>
          </div>
          {!locked && (
            <div className="row">
              <button
                className="btn sm"
                type="button"
                onClick={async () =>
                  setStatus(
                    (await copyText(toMarkdown(d, summaryOk))) ? 'Plan copied.' : 'Copy blocked'
                  )
                }
              >
                Copy whole plan
              </button>
              <button
                className="btn sm"
                type="button"
                onClick={() =>
                  downloadBlob('content-cluster.csv', new Blob([toCsv(d)], { type: 'text/csv' }))
                }
              >
                Download CSV
              </button>
              <span className="status" role="status">
                {status}
              </span>
            </div>
          )}
        </div>
        <div className="rhead" style={{ marginBottom: 14 }}>
          <div className="seg">
            <Seg on={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </Seg>
            <Seg on={filter === 'tofu'} onClick={() => setFilter('tofu')}>
              Awareness {counts.tofu}
            </Seg>
            <Seg on={filter === 'mofu'} onClick={() => setFilter('mofu')}>
              Consideration {counts.mofu}
            </Seg>
            <Seg on={filter === 'bofu'} onClick={() => setFilter('bofu')}>
              Decision {counts.bofu}
            </Seg>
          </div>
          <div className="seg">
            <Seg on={view === 'table'} onClick={() => setView('table')}>
              Table
            </Seg>
            <Seg on={view === 'cards'} onClick={() => setView('cards')}>
              Cards
            </Seg>
            <Seg on={view === 'map'} onClick={() => setView('map')}>
              Map
            </Seg>
          </div>
        </div>
        {view === 'cards' ? (
          <PlanCards ctx={ctx} />
        ) : view === 'map' ? (
          <ClusterMap spokes={sp} sel={sel} onSelect={(i) => setSel((v) => (v === i ? -1 : i))} />
        ) : (
          <PlanTable ctx={ctx} />
        )}
        <p className="legend">
          <span className="d-tofu">Awareness (ToFu): learning about the problem</span>
          <span className="d-mofu">Consideration (MoFu): comparing solutions</span>
          <span className="d-bofu">Decision (BoFu): ready to choose and buy</span>
        </p>
      </section>

      {!isExample && (
        <section className="refine">
          <div>
            <h3>Want different topics?</h3>
            <p className="help">
              Already covered these, or need a different level? Rebuild the plan in one click.
            </p>
          </div>
          <div className="row">
            <button className="btn sm" type="button" onClick={() => onRefine('simpler')}>
              Simpler topics
            </button>
            <button className="btn sm" type="button" onClick={() => onRefine('advanced')}>
              More advanced topics
            </button>
            <button className="btn sm dark" type="button" onClick={() => onRefine('next')}>
              I&apos;ve written these. Show next-level topics
            </button>
          </div>
          <div className="indrow">
            <b>Tailor to an industry:</b>
            {list(d.industries)
              .slice(0, 3)
              .map((x) => (
                <button className="btn sm" type="button" key={x} onClick={() => onIndustry(x)}>
                  {x}
                </button>
              ))}
            <input
              type="text"
              placeholder="or type one, e.g. healthcare"
              aria-label="Industry"
              maxLength={80}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitIndustry()
                }
              }}
            />
            <button className="btn sm dark" type="button" onClick={submitIndustry}>
              Tailor
            </button>
            {fields?.industry && (
              <button className="btn sm" type="button" onClick={() => onIndustry('')}>
                Remove {fields.industry} focus
              </button>
            )}
          </div>
        </section>
      )}

      {summaryOk ? (
        <StrategySummary s={s} hub={h} />
      ) : (
        <LockedSummary upgradeUrl={upgradeUrl} onUpsell={onUpsell} />
      )}

      {locked ? (
        <LeadGate
          shown={Math.min(freeSpokes, sp.length)}
          total={sp.length}
          showNote={gateNote}
          required={leadRequired}
          onUnlock={onUnlock}
        />
      ) : (
        <section>
          <p className="eyebrow">Connect the pages</p>
          <h2 style={{ marginBottom: 16 }}>Internal linking plan</h2>
          <div className="linkplan">
            <div className="panel">
              <h3>Supporting pages to pillar</h3>
              <RichList items={list(l.spoke_to_hub)} />
            </div>
            <div className="panel">
              <h3>Between supporting pages</h3>
              <RichList items={list(l.cross_spoke)} />
            </div>
            <div className="panel">
              <h3>Paths to conversion</h3>
              <RichList items={list(l.bofu_paths)} />
            </div>
          </div>
        </section>
      )}

      {mp.length > 0 && (
        <section>
          <p className="eyebrow">Build next</p>
          <h2 style={{ marginBottom: 16 }}>More pillar pages for your site</h2>
          <div className="feats">
            {mp.map((x, i) => (
              <div className="feat" key={i}>
                <h3>{x.working_title}</h3>
                <p>{x.why}</p>
                <div>
                  <button
                    className="btn sm"
                    type="button"
                    onClick={() => onPlanPillar(x.working_title)}
                  >
                    Plan this cluster →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="endrow">
        <button className="btn grad" type="button" onClick={onBack}>
          ← Plan another topic
        </button>
        {!isExample && (
          <span className="help">
            Your plan stays saved in this browser. Use &quot;View my last plan&quot; on the form to
            reopen it.
          </span>
        )}
      </div>
    </div>
  )
}
