import { useState } from 'react'
import { stageKey, stageLabel, savedToCsv, downloadBlob, copyText } from '../utils/planHelpers'

// The visitor's shortlist of saved topics, kept in this browser across plans.
export default function SavedTopics({ saved, onRemove, onClear }) {
  const [clearArmed, setClearArmed] = useState(false)
  const [status, setStatus] = useState('')
  if (!saved.length) return null

  return (
    <div className="panel" id="savedbox">
      <div className="rhead" style={{ marginBottom: 14 }}>
        <div>
          <p className="eyebrow">Your shortlist</p>
          <h3 style={{ fontSize: 20 }}>My saved topics ({saved.length})</h3>
        </div>
        <div className="row">
          <button
            className="btn sm"
            type="button"
            onClick={async () => {
              setClearArmed(false)
              const ok = await copyText(
                saved.map((x, i) => `${i + 1}. ${x.title} (${x.stage}, ${x.format})`).join('\n')
              )
              setStatus(ok ? 'List copied.' : 'Copy blocked')
            }}
          >
            Copy list
          </button>
          <button
            className="btn sm"
            type="button"
            onClick={() => {
              setClearArmed(false)
              downloadBlob('saved-topics.csv', new Blob([savedToCsv(saved)], { type: 'text/csv' }))
            }}
          >
            Download CSV
          </button>
          <button
            className="btn sm"
            type="button"
            onClick={() => {
              if (clearArmed) {
                onClear()
                setClearArmed(false)
              } else setClearArmed(true)
            }}
          >
            {clearArmed ? 'Click again to clear' : 'Clear all'}
          </button>
          <span className="status" role="status">
            {status}
          </span>
        </div>
      </div>
      <ol className="svlist">
        {saved.map((x, i) => (
          <li key={x.title}>
            <span className={`num bg-${stageKey(x.stage)}`}>{i + 1}</span>
            <div>
              <b>{x.title}</b>
              <div className="chips">
                <span className={`chip ${stageKey(x.stage)}`}>{stageLabel(x.stage)}</span>
                <span className="chip">{x.type} page</span>
                {x.topic && <span className="chip">From: {x.topic.slice(0, 40)}</span>}
              </div>
            </div>
            <button
              className="mini"
              type="button"
              onClick={() => {
                setClearArmed(false)
                onRemove(i)
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ol>
      <p className="help" style={{ marginTop: 12 }}>
        Saved in this browser. Saved topics are left out of every new plan you build, so your list
        keeps growing without repeats.
      </p>
    </div>
  )
}
