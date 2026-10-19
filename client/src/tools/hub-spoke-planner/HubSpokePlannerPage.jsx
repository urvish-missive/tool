import { useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useGetHubSpokeAccessQuery,
  useGenerateHubSpokeClusterMutation,
  useGenerateHubSpokeOutlineMutation,
  useGenerateHubSpokeDraftMutation,
  useSubmitLeadMutation,
  useGetPublicToolsQuery,
} from '../../services/apiSlice'
import useToolFields from '../../hooks/useToolFields'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import { useLeadPopup } from '../../components/useLeadPopup'
import { hubSpokeSchema, parseHubSpokeForm } from '../../schemas/hubSpoke.schema'
import PlannerForm from './components/PlannerForm'
import PlanResults from './components/PlanResults'
import OutlineEditor from './components/OutlineEditor'
import DraftView from './components/DraftView'
import SavedTopics from './components/SavedTopics'
import UpsellDialog from './components/UpsellDialog'
import InfoSections from './components/InfoSections'
import SAMPLE_PLAN from './data/samplePlan'
import usePersistedState from './utils/usePersistedState'
import {
  BLANK_FIELDS,
  STORE_KEYS,
  store,
  list,
  rowData,
  outlineContext,
  normOutline,
} from './utils/planHelpers'
import './hubSpoke.css'

const TOOL_SLUG = 'blog-topics'

// Page settings
const PLANNER = {
  gateUpgraded: true, // every visitor gets the upgraded features here, so keep the email unlock for them too
  summaryAccess: 'paid', // who sees the strategy summary: 'paid', 'lead' (after unlock) or 'free'
  upgradeUrl: '', // pricing or checkout page for "Upgrade to unlock"
  ctaUrl: 'https://calendly.com/missivedigital/30min',
}

const errorText = (err, fallback) => err?.data?.error || fallback

// Loading copy for the site's shared loader, per request type
const LOADER = {
  plan: {
    title: 'Building Your Content Cluster...',
    subtitle: 'Reading your topic, planning the pillar page and mapping every supporting page.',
    steps: [
      'Reading your topic',
      'Planning the pillar page',
      'Planning supporting pages',
      'Connecting pages with internal links',
    ],
  },
  outline: {
    title: 'Writing Your Page Outline...',
    subtitle: 'Structuring sections, keywords, FAQs and internal links for this page.',
    steps: [
      'Reading the page brief',
      'Choosing keywords and search intent',
      'Structuring sections and key points',
      'Adding FAQs and internal links',
    ],
  },
  draft: {
    title: 'Writing Your First Draft...',
    subtitle: 'A full draft takes 1 to 3 minutes. Keep this tab open.',
    steps: [
      'Researching sources for the outline',
      'Writing every section from the outline',
      'Checking links and placing media briefs',
      'Scoring the draft against the content QA checklist',
    ],
  },
}

export default function HubSpokePlannerPage() {
  const { data: access } = useGetHubSpokeAccessQuery()
  // Admin panel settings (Tools → Hub & Spoke Planner): input fields, unlock form, lead fields
  const { fields: adminFields, isFieldEnabled } = useToolFields(TOOL_SLUG)
  const { data: toolsData } = useGetPublicToolsQuery()
  const toolConfig = toolsData?.tools?.find((t) => t.slug === TOOL_SLUG)
  const gateOn = adminFields.unlockGate?.enabled !== false
  const freeSpokes = adminFields.unlockGate?.freeSpokes ?? 3
  const leadRequired = {
    name: toolConfig?.requireName ?? true,
    email: toolConfig?.requireEmail ?? true,
    company: toolConfig?.requireCompany ?? false,
    phone: toolConfig?.requirePhone ?? false,
  }
  const shownFields = {
    info: isFieldEnabled('info'),
    url: isFieldEnabled('url'),
    file: isFieldEnabled('file'),
  }
  const pro = !!access?.pro
  const [generateCluster] = useGenerateHubSpokeClusterMutation()
  const [generateOutline] = useGenerateHubSpokeOutlineMutation()
  const [generateDraft] = useGenerateHubSpokeDraftMutation()
  const [submitLead] = useSubmitLeadMutation()
  const { popupEnabled, showPopup, handlePopupClose, handlePopupSubmit, triggerPopup } =
    useLeadPopup(TOOL_SLUG)

  const form = useForm({
    resolver: zodResolver(hubSpokeSchema),
    defaultValues: { input: '', info: '', url: '' },
  })

  const [screen, setScreen] = useState('form') // form | loading | results | outline | draft
  const [loadingMode, setLoadingMode] = useState('plan')
  const [plan, setPlan] = useState(null)
  const [planFields, setPlanFields] = useState(null)
  const [isExample, setIsExample] = useState(false)
  const [srcDoc, setSrcDoc] = useState(null)
  const [runError, setRunError] = useState('')
  const [panelError, setPanelError] = useState('')
  const [gateNote, setGateNote] = useState(false)
  const [upsellOpen, setUpsellOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(() => !!store.get(STORE_KEYS.lead))
  const [history, setHistory] = usePersistedState(STORE_KEYS.history, [])
  const [saved, setSaved] = usePersistedState(STORE_KEYS.saved, [])
  const [outlines, setOutlines] = usePersistedState(STORE_KEYS.outlines, {})
  const [drafts, setDrafts] = usePersistedState(STORE_KEYS.drafts, {})
  const [activeOutline, setActiveOutline] = useState(null) // { key, i }
  const requestRef = useRef(null)
  const pendingRef = useRef(null)
  const appRef = useRef(null)

  const locked = gateOn && !isExample && !unlocked && (PLANNER.gateUpgraded || !pro)
  const summaryOk =
    isExample ||
    pro ||
    PLANNER.summaryAccess === 'free' ||
    (PLANNER.summaryAccess === 'lead' && unlocked)
  const scrollToApp = () => requestAnimationFrame(() => appRef.current?.scrollIntoView())
  const go = (next) => {
    setPanelError('')
    setScreen(next)
    scrollToApp()
  }
  const setFormFields = (f) => {
    form.setValue('input', f.input || '')
    form.setValue('info', f.info || '')
    form.setValue('url', pro ? f.url || '' : '')
  }
  const rowIndex = (title) =>
    plan.hub.working_title === title ? -1 : plan.spokes.findIndex((x) => x.working_title === title)

  /* ---------- plan ---------- */
  const run = async (fields) => {
    const f = {
      ...fields,
      saved: saved
        .map((x) => x.title)
        .join('\n')
        .slice(0, 3000),
    }
    setRunError('')
    setLoadingMode('plan')
    go('loading')
    const req = generateCluster(f)
    requestRef.current = req
    try {
      const data = (await req.unwrap()).plan
      if (!data?.hub || !list(data.spokes).length)
        throw { data: { error: 'The plan came back incomplete. Please try again.' } }
      const kept = { ...f, source: '' } // file text is not kept with the plan
      setPlan(data)
      setPlanFields(kept)
      setIsExample(false)
      setGateNote(false)
      const sig = (x) =>
        JSON.stringify([x.input, x.level, x.industry || '', x.existing, x.url || ''])
      setHistory((h) =>
        [
          { data, fields: kept, at: Date.now() },
          ...h.filter((p) => sig(p.fields) !== sig(kept)),
        ].slice(0, 5)
      )
      go('results')
    } catch (err) {
      setScreen('form')
      if (err?.name !== 'AbortError')
        setRunError(
          errorText(err, 'Something went wrong while building the plan. Please try again.')
        )
    }
  }

  const onValid = (values) => {
    const parsed = parseHubSpokeForm(values, { hasSource: pro && shownFields.file && !!srcDoc })
    if (!parsed.success) {
      form.setError('input', { message: parsed.error })
      return
    }
    const fields = {
      ...BLANK_FIELDS,
      ...parsed.data,
      info: shownFields.info ? parsed.data.info : '',
      url: pro && shownFields.url ? parsed.data.url : '',
      source: pro && shownFields.file && srcDoc ? srcDoc.text.slice(0, 60000) : '',
      source_name: pro && shownFields.file && srcDoc ? srcDoc.name : '',
    }
    if (popupEnabled) {
      pendingRef.current = fields
      triggerPopup()
      return
    }
    run(fields)
  }
  const onSubmit = (e) => form.handleSubmit(onValid)(e)

  const baseFields = () => ({
    ...BLANK_FIELDS,
    input: planFields.input,
    info: planFields.info || '',
    level: planFields.level || 'Balanced',
    existing: planFields.existing || '',
    industry: planFields.industry || '',
  })
  const refine = (kind) => {
    const f = baseFields()
    if (kind === 'simpler') f.level = 'Simpler'
    else if (kind === 'advanced') f.level = 'Advanced'
    else {
      const titles = [plan.hub.working_title, ...plan.spokes.map((x) => x.working_title)].join('\n')
      f.existing = ((f.existing ? f.existing + '\n' : '') + titles).slice(-4000)
    }
    setFormFields(f)
    run(f)
  }
  const tailor = (industry) => {
    const f = { ...baseFields(), industry }
    setFormFields(f)
    run(f)
  }
  const planPillar = (title) => {
    const f = { ...BLANK_FIELDS, info: isExample ? '' : planFields?.info || '', input: title }
    setFormFields(f)
    run(f)
  }
  const showPlan = (data, fields, example) => {
    setPlan(data)
    setPlanFields(fields)
    setIsExample(example)
    go('results')
  }

  /* ---------- shortlist + lead gate ---------- */
  const isSaved = (t) => saved.some((x) => x.title === t)
  const toggleSave = (title) => {
    if (locked) {
      setGateNote(true)
      requestAnimationFrame(() =>
        document.getElementById('gate')?.scrollIntoView({ block: 'center' })
      )
      return
    }
    const d = rowData(plan, rowIndex(title), planFields?.input || '')
    setSaved((s) =>
      s.some((x) => x.title === d.title) ? s.filter((x) => x.title !== d.title) : [...s, d]
    )
  }
  const unlock = (lead) => {
    submitLead({ ...lead, source: TOOL_SLUG }).catch(() => {})
    store.set(STORE_KEYS.lead, { at: Date.now() })
    setUnlocked(true)
    setGateNote(false)
  }

  /* ---------- outline ---------- */
  const openOutline = async (title, force) => {
    if (!pro) return setUpsellOpen(true)
    const i = rowIndex(title)
    const d = rowData(plan, i, planFields?.input || '')
    const key = d.title
    if (outlines[key] && !force) {
      setActiveOutline({ key, i })
      return go('outline')
    }
    setLoadingMode('outline')
    go('loading')
    const req = generateOutline(outlineContext(plan, i, planFields))
    requestRef.current = req
    try {
      const data = (await req.unwrap()).outline
      if (!list(data?.sections).length)
        throw { data: { error: 'The outline came back incomplete. Please try again.' } }
      setOutlines((o) => ({
        ...o,
        [key]: { data: normOutline(data, d), approved: false, at: Date.now() },
      }))
      setActiveOutline({ key, i })
      go('outline')
    } catch (err) {
      setScreen('results')
      if (err?.data?.code === 'upgrade_required') setUpsellOpen(true)
      else if (err?.name !== 'AbortError')
        setPanelError(
          errorText(err, 'Something went wrong while writing the outline. Please try again.')
        )
    }
  }
  const updateOutline = (fn) =>
    setOutlines((o) => ({ ...o, [activeOutline.key]: fn(o[activeOutline.key]) }))

  /* ---------- draft ---------- */
  const openDraft = async (force, feedback) => {
    const key = activeOutline.key
    if (!pro) return setUpsellOpen(true)
    if (drafts[key] && !force) return go('draft')
    setLoadingMode('draft')
    go('loading')
    const req = generateDraft({
      outline: outlines[key].data,
      context: outlineContext(plan, activeOutline.i, planFields),
      feedback: feedback || '',
      previous: feedback ? drafts[key]?.md || '' : '',
    })
    requestRef.current = req
    try {
      const data = (await req.unwrap()).draft
      if (typeof data?.markdown !== 'string' || data.markdown.length < 200)
        throw { data: { error: 'The draft came back incomplete. Please try again.' } }
      setDrafts((all) => {
        const prev = all[key]
        return {
          ...all,
          [key]: {
            md: data.markdown,
            qa: list(data.qa),
            assets: list(data.assets),
            notes: list(data.editor_notes),
            sources: list(data.sources),
            pnotes: list(data.pipeline_notes),
            feedback: feedback ? [...(prev?.feedback || []), feedback] : prev?.feedback || [],
            version: (prev?.version || 0) + 1,
            words: +data.word_count || data.markdown.split(/\s+/).length,
            approved: false,
            at: Date.now(),
          },
        }
      })
      go('draft')
    } catch (err) {
      setScreen(drafts[key] ? 'draft' : 'outline')
      if (err?.data?.code === 'upgrade_required') setUpsellOpen(true)
      else if (err?.name !== 'AbortError')
        setPanelError(
          errorText(err, 'Something went wrong while writing the draft. Please try again.')
        )
    }
  }
  const updateDraft = (fn) =>
    setDrafts((all) => ({ ...all, [activeOutline.key]: fn(all[activeOutline.key]) }))

  /* ---------- header of the app card ---------- */
  const mine = history[0]
  const label =
    screen === 'results'
      ? isExample
        ? 'Sample plan'
        : 'Your content cluster'
      : screen === 'outline'
        ? 'Page outline'
        : screen === 'draft'
          ? 'First draft'
          : 'Content cluster planner'
  const SWAP = {
    results: { text: '← Back to form', to: 'form' },
    outline: { text: '← Back to plan', to: 'results' },
    draft: { text: '← Back to outline', to: 'outline' },
    form: mine ? { text: 'View my last plan →', to: 'mine' } : null,
  }
  const swap = SWAP[screen]
  const onSwap = () => {
    if (swap.to === 'mine') showPlan(mine.data, { ...BLANK_FIELDS, ...mine.fields }, false)
    else go(swap.to)
  }

  return (
    <>
      <div className="hsp">
        <Helmet>
          <title>Hub &amp; Spoke Planner | Free Content Cluster Generator | Missive Digital</title>
          <meta
            name="description"
            content="Free tool: turn one topic or keyword into a complete hub and spoke content cluster with funnel stages, formats, internal links and calls to action."
          />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          />
        </Helmet>

        <section className="hero" id="top">
          <div className="inner">
            <div className="herohead">
              <span className="sitebadge">Missive&apos;s Tools • Missive Digital</span>
              <h1>
                Turn one topic into a <span className="gtext">complete content cluster</span>
              </h1>
              <p className="lede">
                Type a topic. Get a pillar page and supporting pages planned for you in about a
                minute.
              </p>
            </div>

            {screen !== 'loading' && (
              <div className="app" id="app" ref={appRef}>
                <div className="appcard">
                  <div className="apphead">
                    <span className="live">{label}</span>
                    {swap && (
                      <button
                        className={`btn sm${screen === 'form' ? '' : ' dark'}`}
                        type="button"
                        onClick={onSwap}
                      >
                        {swap.text}
                      </button>
                    )}
                  </div>
                  <div className="appbody">
                    {screen === 'form' && (
                      <PlannerForm
                        form={form}
                        onSubmit={onSubmit}
                        pro={pro}
                        shownFields={shownFields}
                        onUpsell={() => setUpsellOpen(true)}
                        srcDoc={srcDoc}
                        setSrcDoc={setSrcDoc}
                        runError={runError}
                        history={history}
                        onOpenHistory={(i) =>
                          showPlan(
                            history[i].data,
                            { ...BLANK_FIELDS, ...history[i].fields },
                            false
                          )
                        }
                        onSample={() => showPlan(SAMPLE_PLAN, null, true)}
                      />
                    )}
                    {screen === 'results' && plan && (
                      <PlanResults
                        key={plan === SAMPLE_PLAN ? 'sample' : JSON.stringify(planFields)}
                        plan={plan}
                        fields={planFields}
                        isExample={isExample}
                        pro={pro}
                        locked={locked}
                        summaryOk={summaryOk}
                        freeSpokes={freeSpokes}
                        leadRequired={leadRequired}
                        upgradeUrl={PLANNER.upgradeUrl}
                        outlines={outlines}
                        isSaved={isSaved}
                        gateNote={gateNote}
                        error={panelError}
                        onToggleSave={toggleSave}
                        onOutline={(title) => openOutline(title)}
                        onRefine={refine}
                        onIndustry={tailor}
                        onPlanPillar={planPillar}
                        onUnlock={unlock}
                        onUpsell={() => setUpsellOpen(true)}
                        onBack={() => go('form')}
                      />
                    )}
                    {screen === 'outline' && activeOutline && outlines[activeOutline.key] && (
                      <OutlineEditor
                        entry={outlines[activeOutline.key]}
                        hasDraft={!!drafts[activeOutline.key]}
                        error={panelError}
                        onChange={updateOutline}
                        onRegenerate={() => openOutline(activeOutline.key, true)}
                        onWriteDraft={() => openDraft(false)}
                        onBack={() => go('results')}
                      />
                    )}
                    {screen === 'draft' && activeOutline && drafts[activeOutline.key] && (
                      <DraftView
                        key={drafts[activeOutline.key].version}
                        draft={drafts[activeOutline.key]}
                        outline={outlines[activeOutline.key]}
                        error={panelError}
                        onChange={updateDraft}
                        onRewrite={(feedback) => openDraft(true, feedback)}
                        onBack={() => go('outline')}
                      />
                    )}
                    {(screen === 'form' || screen === 'results') && (
                      <SavedTopics
                        saved={saved}
                        onRemove={(i) => setSaved((s) => s.filter((_, j) => j !== i))}
                        onClear={() => setSaved([])}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* The site's shared loader, outside .hsp so the planner styles do not restyle it */}
      {screen === 'loading' && (
        <div ref={appRef} className="bg-[#f5f7fb] px-4 pb-16 scroll-mt-24">
          <UnifiedToolLoader
            key={loadingMode}
            title={LOADER[loadingMode].title}
            subtitle={LOADER[loadingMode].subtitle}
            steps={LOADER[loadingMode].steps}
            stepIntervalMs={loadingMode === 'draft' ? 20000 : 6000}
          />
          <div className="text-center">
            <button
              type="button"
              onClick={() => requestRef.current?.abort()}
              className="px-5 py-2 rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="hsp">
        <InfoSections ctaUrl={PLANNER.ctaUrl} />

        <UpsellDialog
          open={upsellOpen}
          onClose={() => setUpsellOpen(false)}
          upgradeUrl={PLANNER.upgradeUrl}
        />
      </div>

      {/* Outside .hsp so the planner styles do not restyle the site's modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={() => {
          handlePopupSubmit()
          const fields = pendingRef.current
          pendingRef.current = null
          if (fields) run(fields)
        }}
        toolSlug={TOOL_SLUG}
      />
    </>
  )
}
