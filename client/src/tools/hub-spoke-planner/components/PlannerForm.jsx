import { useRef, useState } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { readSourceFile } from '../utils/readSourceFile'
import { hostOf } from '../utils/planHelpers'

const EXAMPLES = [
  { label: 'Payroll software', value: 'payroll software for small businesses' },
  { label: 'Technical SEO audits', value: 'technical SEO audit services for ecommerce brands' },
  { label: 'Home solar', value: 'rooftop solar installation for homeowners' },
]

const ProBadge = ({ pro }) => (
  <span className="probadge">
    {pro ? (
      'Included in your plan'
    ) : (
      <>
        <Lock className="lk" aria-hidden="true" />
        Upgraded plan
      </>
    )}
  </span>
)

/**
 * The brief form: topic, extra details, website (upgraded) and source file (upgraded),
 * each of the optional fields can be hidden in the admin panel (shownFields),
 * plus the visitor's recent plans.
 */
export default function PlannerForm({
  form,
  onSubmit,
  pro,
  shownFields,
  onUpsell,
  srcDoc,
  setSrcDoc,
  runError,
  history,
  onOpenHistory,
  onSample,
}) {
  const {
    register,
    setValue,
    reset,
    formState: { errors },
  } = form
  const fileRef = useRef(null)
  const [reading, setReading] = useState('')
  const [fileError, setFileError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const takeFile = async (file) => {
    if (!file) return
    if (!pro) return onUpsell()
    setReading(file.name)
    setFileError('')
    try {
      setSrcDoc(await readSourceFile(file))
    } catch (err) {
      setSrcDoc(null)
      setFileError(err?.message || 'That file could not be read.')
    }
    setReading('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const pickFile = () => (pro ? fileRef.current?.click() : onUpsell())

  return (
    <form
      onSubmit={onSubmit}
      onReset={(e) => {
        e.preventDefault()
        reset()
        setSrcDoc(null)
        setFileError('')
      }}
      noValidate
    >
      <div className="grid2">
        <div className="field full">
          <label htmlFor="f-input">
            Topic, keyword or brief <span className="req">*</span>
          </label>
          <textarea
            id="f-input"
            rows={4}
            placeholder="e.g. payroll software for small businesses, or paste a short brief"
            {...register('input')}
          />
          <span className="help">
            That is all we need. The planner works out the audience, the goal and the right kind of
            pages on its own.
          </span>
          <div className="tries">
            Try an example:
            {EXAMPLES.map((x) => (
              <button
                key={x.label}
                type="button"
                onClick={() => setValue('input', x.value, { shouldValidate: false })}
              >
                {x.label}
              </button>
            ))}
          </div>
          {errors.input && <span className="err">{errors.input.message}</span>}
        </div>

        {shownFields.info && (
          <div className="field full">
            <label htmlFor="f-info">
              Anything else we should know? <small>(optional)</small>
            </label>
            <textarea
              id="f-info"
              rows={2}
              placeholder="e.g. who it is for, what you sell, your goal, or pages you have already published"
              {...register('info')}
            />
            <span className="help">
              If you add details, the plan follows them and also shows what we would suggest.
            </span>
          </div>
        )}

        {shownFields.url && (
          <div className={`field full${pro ? '' : ' lockd'}`} id="url-field">
            <label htmlFor="f-url">
              Your website <small>(optional)</small> <ProBadge pro={pro} />
            </label>
            <input
              id="f-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="https://www.yourwebsite.com"
              readOnly={!pro}
              onFocus={(e) => {
                if (!pro) {
                  e.target.blur()
                  onUpsell()
                }
              }}
              {...register('url')}
            />
            <span className="help">
              {pro
                ? 'We read your site to learn what you sell, skip topics you already cover, and suggest internal links to your real pages. With a website you can leave the topic box empty.'
                : 'On the upgraded plan we read your site to learn what you sell, skip topics you already cover, and suggest internal links to your real pages.'}
            </span>
            {errors.url && <span className="err">{errors.url.message}</span>}
          </div>
        )}

        {shownFields.file && (
          <div
            className={`field full${pro ? '' : ' lockd'}`}
            id="file-field"
            onClick={(e) => {
              if (!pro && !e.target.closest('button')) onUpsell()
            }}
          >
            <label htmlFor="f-file">
              Have a deck, PDF or document? <small>(optional)</small> <ProBadge pro={pro} />
            </label>
            <div
              className={`drop${dragOver ? ' over' : ''}`}
              onClick={(e) => {
                if (e.target === e.currentTarget && !srcDoc) pickFile()
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                takeFile(e.dataTransfer.files[0])
              }}
            >
              <input
                id="f-file"
                ref={fileRef}
                type="file"
                accept=".pdf,.pptx,.docx,.txt,.md,.csv"
                hidden
                onChange={(e) => takeFile(e.target.files[0])}
              />
              {srcDoc ? (
                <span>
                  <b>{srcDoc.name}</b> <span>· {srcDoc.meta}</span>{' '}
                  <button type="button" className="mini" onClick={() => setSrcDoc(null)}>
                    Remove
                  </button>
                </span>
              ) : reading ? (
                <span>Reading {reading}…</span>
              ) : (
                <span>
                  Drop a webinar deck, PDF, Word file or text here, or{' '}
                  <button type="button" className="linkbtn" onClick={pickFile}>
                    choose a file
                  </button>
                  . We read it and draw the cluster topics from what it already says.
                </span>
              )}
            </div>
            <span className="help">
              {pro
                ? 'PDF, PowerPoint (.pptx), Word (.docx) or text, up to 15 MB. The file is read in your browser; only its text is used.'
                : 'On the upgraded plan, upload a webinar deck, whitepaper or report and the planner turns what it already says into a cluster.'}
            </span>
            {fileError && <span className="err">{fileError}</span>}
          </div>
        )}
      </div>

      <div className="formfoot">
        <button className="btn" type="reset">
          Reset
        </button>
        <button className="btn grad" id="go" type="submit">
          <Sparkles aria-hidden="true" />
          Build my content cluster
        </button>
        {runError && <span className="err">{runError}</span>}
        <button className="btn" type="button" style={{ marginLeft: 'auto' }} onClick={onSample}>
          See a sample plan
        </button>
      </div>

      {history.length > 0 && (
        <div id="history">
          <p className="eyebrow">Recent plans</p>
          <div className="hist">
            {history.map((h, i) => (
              <button type="button" className="hrow" key={h.at} onClick={() => onOpenHistory(i)}>
                <b>{(h.fields.input || h.fields.url || '').slice(0, 80)}</b>
                <span>
                  {[
                    h.fields.input && h.fields.url ? hostOf(h.fields.url) : '',
                    h.fields.industry,
                    h.fields.level !== 'Balanced' ? h.fields.level : '',
                    h.fields.existing ? 'Next level' : '',
                    h.data.spokes.length + 1 + ' pages',
                    new Date(h.at).toLocaleDateString(),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  )
}
