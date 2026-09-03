import UnifiedToolLoader from './UnifiedToolLoader'

const DEFAULT_STEPS = [
  'Reading content & structure',
  'Checking on-page SEO optimization',
  'Evaluating search intent alignment',
  'Scanning readability & E-E-A-T signals',
  'Generating recommendations report',
]

const STEP_KEY_MAP = {
  reading: 0,
  structure: 1,
  seo: 2,
  intent: 3,
  recs: 4,
  report: 4,
}

export default function LoadingProgress({
  currentStep,
  title = 'Analyzing your content...',
  subtitle,
}) {
  const currentStepIdx =
    typeof currentStep === 'string' ? (STEP_KEY_MAP[currentStep] ?? 0) : undefined

  return (
    <UnifiedToolLoader
      title={title}
      subtitle={
        subtitle || 'Deep scanning SEO structure, readability, keywords, and search intent.'
      }
      steps={DEFAULT_STEPS}
      currentStepIdx={currentStepIdx}
    />
  )
}
