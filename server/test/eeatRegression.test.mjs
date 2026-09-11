import 'dotenv/config'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { analyzeEeat } from '../src/services/eeatAnalyzer.js'

const crmArticle = `# How to Choose the Right CRM for a Growing Sales Team

Scaling a sales team is one of the most critical inflection points for any B2B company. When your team expands beyond a handful of reps, tracking deals via spreadsheets or informal chats quickly leads to lost opportunities, broken handoffs, and inaccurate revenue forecasts. Choosing the right Customer Relationship Management (CRM) system can make or break your team's ability to hit revenue targets.

## Understand Your Sales Process Before Evaluating Software

The biggest mistake revenue leaders make is purchasing a CRM based on feature checklists rather than process alignment. Before scheduling vendor demos, map out your current sales motions:
- Lead qualification criteria and routing protocols
- Pipeline stages from initial discovery call to closed-won
- Average deal cycle length and stakeholder touchpoints
- Key handoffs between marketing, sales development, account executives, and customer success

If your process is chaotic, putting a CRM on top of it will simply automate chaos. Documenting your ideal buyer journey first ensures you evaluate platforms based on how well they support your actual sales workflow.

## Essential Evaluation Criteria for Fast-Growing Teams

When comparing platforms, focus on six core dimensions rather than fringe features:

### 1. Ease of Adoption and Rep Workflow
A CRM is only as valuable as the data entered into it. If the interface requires 15 clicks to log a call or update deal stages, reps will resist using it. Prioritize systems with intuitive mobile apps, seamless email inbox integration (Gmail/Outlook), and automated activity capture.

### 2. Integration Ecosystem
Your CRM must connect seamlessly with your existing tech stack. Look for native integrations or robust REST/GraphQL APIs for:
- Prospecting and sequencing tools (e.g., Apollo, Outreach, Salesloft)
- Communication channels (Slack, Zoom, Microsoft Teams)
- Marketing automation platforms (HubSpot, Marketo)
- Accounting and contract management (QuickBooks, DocuSign, Stripe)

### 3. Pipeline Visibility and Reporting
Sales managers need real-time visibility into pipeline health. The platform should offer customizable dashboards tracking conversion rates between stages, sales velocity, rep quota attainment, and historical win/loss patterns.

### 4. Customization vs. Maintenance Overhead
Some enterprise platforms require dedicated full-time administrators to build custom fields, automations, and validation rules. For a growing team of 10 to 50 reps, seek a platform that balances deep configurability with low administrative burden.

### 5. Cost Transparency and Tier Progression
Watch out for hidden costs. Beyond base seat licenses, evaluate:
- Storage limits for contacts and document attachments
- Add-on fees for reporting modules, API access, and workflow automation
- Annual contract lock-ins versus monthly flexibility
- Mandatory implementation and onboarding fees

### 6. Data Security and Governance
Protecting customer data is paramount. Ensure the vendor complies with SOC 2 Type II, GDPR, and CCPA standards. Verify role-based permissions so junior reps only see assigned accounts while leadership maintains aggregate visibility.

## Run a Controlled Pilot Program

Never roll out a CRM company-wide on day one. Select a small pilot group of two high-performing reps and one sales development representative. Have them run active deals through the platform for 14 to 21 days. 

Evaluate:
- How much time is spent on administrative data entry vs. active selling
- How easily the pilot team learned the interface
- The quality and responsiveness of vendor customer support during the trial

## Making the Final Decision

Choosing a CRM is not just a software procurement decision; it is an investment in your operational backbone. The right tool aligns with your team's workflow, provides trustworthy forecasting data to leadership, and scales smoothly as headcounts double. Involve your sales reps in the selection process, prioritize adoption over complexity, and ensure your data architecture remains flexible as your go-to-market strategy evolves.`

const healthArticle = `# Managing Acute Hypertension: Evidence-Based Clinical Guidance

Elevated blood pressure reaching crisis levels (systolic > 180 mmHg or diastolic > 120 mmHg) presents acute risks of end-organ damage including stroke, myocardial infarction, and renal dysfunction.

## Immediate Clinical Assessment Protocols
Emergency department evaluation must distinguish hypertensive urgency from hypertensive emergency:
- Target organ assessment: Fundoscopy for papilledema, serum creatinine for acute kidney injury
- Neurological evaluation for encephalopathy or focal deficits
- Pharmacological management: Intravenous labetalol or nicardipine with careful MAP reduction goals

Self-treatment or reliance on unverified herbal remedies during acute hypertensive crises carries severe morbidity risk. Consult board-certified medical professionals immediately.`

const productReviewArticle = `# Hands-on Benchmark: Keychron Q1 Pro vs Logitech MX Mechanical

We spent 45 days testing both keyboards across programming, typing velocity benchmarks, and long-session ergonomic evaluations.

## Measured Benchmarks
- Keystroke latency: Keychron recorded 4.2ms wired / 8.1ms Bluetooth; Logitech recorded 3.8ms via Bolt receiver.
- Sound profile: Keychron's double-gasket mount produced a 52dB muted thock; Logitech recorded 58dB clicky actuation.
- Actuation force measured with digital gauge: Gateron Jupiter Red registered 45.3g variance +/- 2.1g.

For pure typing feel and custom modding, Keychron wins; for cross-device battery longevity (up to 10 months), Logitech remains unmatched.`

test('E-E-A-T Suite: CRM Regression Test produces complete, typed, multi-dimensional assessment', async () => {
  const result = await analyzeEeat({
    title: 'How to Choose the Right CRM for a Growing Sales Team',
    content: crmArticle,
    contentType: 'auto',
  })

  // 1. Status and types
  assert.equal(result.analysisStatus, 'complete')
  assert.equal(result.isFallback, false)
  assert.equal(typeof result.overallScore, 'number')
  assert.ok(result.overallScore > 40 && result.overallScore <= 85)
  assert.notEqual(result.overallScore, 'N/A')
  assert.equal(typeof result.grade, 'string')
  assert.notEqual(result.grade, 'N/A')

  // 2. Multi-dimensional classification
  assert.ok(result.classification?.contentFormat?.label)
  assert.ok(result.classification?.subjectContext?.label)
  assert.ok(result.classification?.evaluationFramework?.label)
  assert.ok(result.classification?.evaluationFramework?.reason)
  assert.ok(result.classification?.sensitivity?.level)

  // 3. Four Core Pillars
  const pillars = result.eeat.pillars
  for (const pillarName of ['experience', 'expertise', 'authoritativeness', 'trustworthiness']) {
    const p = pillars[pillarName]
    assert.ok(p, `Pillar ${pillarName} must exist`)
    assert.equal(typeof p.score, 'number')
    assert.notEqual(p.score, 'N/A')
    assert.ok(p.score >= 0 && p.score <= 25)
    assert.equal(p.maxScore, 25)
    assert.ok(Array.isArray(p.strengths))
    assert.ok(Array.isArray(p.gaps))
  }

  // 4. AI Search Readiness separated from E-E-A-T
  assert.ok(result.aiSearchReadiness)
  assert.equal(typeof result.aiSearchReadiness.score, 'number')
  assert.ok(result.aiSearchReadiness.score >= 0 && result.aiSearchReadiness.score <= 100)
  assert.ok(result.aiSearchReadiness.citabilityFactors)

  // 5. Claims extracted
  assert.ok(Array.isArray(result.claims))
  assert.ok(result.claims.length > 0)

  // 6. Prioritized recommendations
  assert.ok(Array.isArray(result.recommendations))
  assert.ok(result.recommendations.length > 0)
  assert.ok(['critical', 'high', 'medium', 'low'].includes(result.recommendations[0].priority))

  // 7. Safe Boosters (no fake credentials)
  assert.ok(result.boosters?.recommendedExperienceAddition)
  assert.ok(Array.isArray(result.boosters?.recommendedAuthorBioElements))
  assert.ok(Array.isArray(result.boosters?.citableSourceTypes))
})

test('E-E-A-T Suite: Forced Fallback Test returns clean partial status without N/A strings', async () => {
  // Pass forceModelFailure to intentionally simulate complete AI provider downtime
  const result = await analyzeEeat({
    title: 'How to Choose the Right CRM for a Growing Sales Team',
    content: crmArticle,
    contentType: 'auto',
    forceModelFailure: true,
  })

  assert.equal(result.analysisStatus, 'partial')
  assert.equal(result.isFallback, true)
  assert.equal(result.overallScore, null)
  assert.equal(result.grade, null)
  assert.notEqual(result.overallScore, 'N/A')
  assert.notEqual(result.grade, 'N/A')

  // Check pillar scores are null, not N/A
  for (const pillar of ['experience', 'expertise', 'authoritativeness', 'trustworthiness']) {
    assert.equal(result.eeat.pillars[pillar].score, null)
    assert.notEqual(result.eeat.pillars[pillar].score, 'N/A')
  }

  // Check diagnostic metadata
  assert.ok(result.diagnostic)
  assert.equal(result.diagnostic.modelCallSucceeded, false)
  assert.ok(result.diagnostic.fallbackReason)

  // Check heuristics and input limitations remain useful
  assert.ok(result.heuristics.wordCount > 500)
  assert.ok(result.inputLimitations.length > 0)
  assert.ok(result.recommendations.length > 0)
})

test('E-E-A-T Suite: Contrasting Content - High Sensitivity Medical/Health Content', async () => {
  const result = await analyzeEeat({
    title: 'Managing Acute Hypertension: Evidence-Based Clinical Guidance',
    content: healthArticle,
    contentType: 'auto',
  })

  assert.equal(result.analysisStatus, 'complete')
  assert.ok(['high', 'critical'].includes(result.classification.sensitivity.level.toLowerCase()))
  assert.ok(
    result.classification.evaluationFramework.label.toLowerCase().includes('medical') ||
    result.classification.evaluationFramework.label.toLowerCase().includes('ymyl') ||
    result.classification.evaluationFramework.label.toLowerCase().includes('clinical') ||
    result.classification.evaluationFramework.label.toLowerCase().includes('health') ||
    result.classification.evaluationFramework.reason.toLowerCase().includes('health')
  )
})

test('E-E-A-T Suite: Contrasting Content - Hands-on Hardware Product Review', async () => {
  const result = await analyzeEeat({
    title: 'Hands-on Benchmark: Keychron Q1 Pro vs Logitech MX Mechanical',
    content: productReviewArticle,
    contentType: 'auto',
  })

  assert.equal(result.analysisStatus, 'complete')
  assert.ok(
    result.classification.contentFormat.label.toLowerCase().includes('review') ||
    result.classification.contentFormat.label.toLowerCase().includes('benchmark') ||
    result.classification.contentFormat.label.toLowerCase().includes('comparison')
  )
  // Hands-on test data should result in experience points and identified strengths
  assert.ok(result.eeat.pillars.experience.score >= 10)
  assert.ok(result.eeat.pillars.experience.strengths.length > 0)
})

test('E-E-A-T Suite: Zero Niche Hardcoding Audit', () => {
  const code = fs.readFileSync(path.resolve('src/services/eeatAnalyzer.js'), 'utf8')

  // Disallowed hardcoding checks
  assert.equal(code.includes('topic === "CRM"'), false, 'Should not check topic === "CRM"')
  assert.equal(code.includes('niche === "SaaS"'), false, 'Should not check niche === "SaaS"')
  assert.equal(code.includes('if (title.includes("CRM"))'), false, 'Should not check title.includes("CRM")')
  assert.equal(code.includes('if (article.includes("sales"))'), false, 'Should not check article.includes("sales")')
  assert.equal(code.includes('CRM -> B2B SaaS'), false, 'Should not hardcode CRM -> B2B SaaS')
})
