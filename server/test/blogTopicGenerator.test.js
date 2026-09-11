import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { generateBlogTopics, generateDynamicTopics } from '../src/services/blogTopicGenerator.js'
import { classifyNiche } from '../src/services/nicheClassifier.js'
import { classifySearchIntent, detectEntityLifecycle } from '../src/services/intentClassifier.js'
import { runMissiveQA } from '../src/services/qaService.js'
import { applyEntityCasing } from '../src/constants/entityCasing.js'

describe('SEO Blog Topic Generator Architecture & Semantic Pipeline', () => {

  // ── TEST A: iPhone 18 series + social media users (Consumer Tech & Creator) ──
  test('TEST A: iPhone 18 series for social media users (Consumer Tech & Rumored Device)', async () => {
    const result = generateDynamicTopics({
      niche: 'iphone 18 series',
      targetKeywords: ['iphone 18'],
      audience: 'social media users',
      contentGoal: 'Educational & Authority',
      tone: 'fun',
      count: 6,
    })

    assert.ok(result.topics.length >= 6, 'Should generate at least 6 topics')

    // 1. Classification check
    assert.strictEqual(result.nicheClassification.nicheType, 'Consumer Technology')
    assert.strictEqual(result.lifecycleProfile.lifecycleState, 'rumored')
    assert.strictEqual(result.lifecycleProfile.isUnreleased, true)

    // 2. Terminology check - MUST NOT contain B2B/SaaS jargon or fabricated percentages
    const bannedTerms = [
      'unit economics',
      'high-growth teams',
      'high growth teams',
      'growth lever',
      'tech stack',
      'roi calculation',
      'cfo',
      'ebitda',
      'throughput capacity',
    ]

    for (const topic of result.topics) {
      const fullTopicText = `${topic.title} ${topic.hook} ${JSON.stringify(topic.detailedOutline)}`.toLowerCase()

      for (const banned of bannedTerms) {
        assert.ok(
          !fullTopicText.includes(banned),
          `Topic "${topic.title}" must NOT contain B2B term: "${banned}"`
        )
      }

      // 3. No fabricated percentage statistics
      assert.ok(
        !/\b\d+(\.\d+)?%\b/.test(topic.title),
        `Title "${topic.title}" must not contain fabricated percentage`
      )
      assert.ok(
        !/\b\d+(\.\d+)?%\b/.test(topic.hook),
        `Hook "${topic.hook}" must not contain fabricated percentage`
      )

      // 4. Correct entity casing
      assert.ok(
        !/\biphone\b/.test(topic.title),
        `Title "${topic.title}" must use canonical "iPhone", not lowercase "iphone"`
      )

      // 5. Missive QA hard gate check
      assert.strictEqual(
        topic.missiveQa.passed,
        true,
        `Topic "${topic.title}" should pass Missive QA. Failures: ${JSON.stringify(topic.missiveQa.hardFailures)}`
      )
      assert.ok(topic.missiveQa.score >= 80, 'Score should be >= 80')
    }
  })

  // ── TEST B: CRM software + enterprise sales leaders (B2B SaaS) ──
  test('TEST B: CRM software for enterprise sales leaders (B2B SaaS)', async () => {
    const result = generateDynamicTopics({
      niche: 'CRM software',
      targetKeywords: ['sales CRM'],
      audience: 'enterprise sales leaders',
      contentGoal: 'business',
      tone: 'authoritative',
      count: 5,
    })

    assert.strictEqual(result.nicheClassification.nicheType, 'B2B SaaS')
    assert.strictEqual(result.nicheClassification.isB2B, true)

    // In B2B SaaS, ROI / Implementation / Workflows / Tech Stack are contextually valid
    const allTitles = result.topics.map(t => t.title).join(' ')
    assert.ok(
      /evaluation|roi|implementation|stack|scaling|workflows/i.test(allTitles),
      'B2B SaaS should contain appropriate enterprise workflow or evaluation angles'
    )

    for (const topic of result.topics) {
      assert.strictEqual(topic.missiveQa.passed, true)
    }
  })

  // ── TEST C: Bali travel + first-time international travelers (Travel) ──
  test('TEST C: Bali travel for first-time international travelers (Travel)', async () => {
    const result = generateDynamicTopics({
      niche: 'Bali travel',
      targetKeywords: ['best time to visit Bali'],
      audience: 'first-time international travelers',
      contentGoal: 'educational',
      tone: 'conversational',
      count: 5,
    })

    assert.strictEqual(result.nicheClassification.nicheType, 'Travel')
    assert.strictEqual(result.nicheClassification.isConsumer, true)

    const fullContent = JSON.stringify(result.topics).toLowerCase()
    assert.ok(!fullContent.includes('unit economics'), 'Must not contain unit economics')
    assert.ok(!fullContent.includes('tech stack'), 'Must not contain tech stack')
    assert.ok(!fullContent.includes('growth lever'), 'Must not contain growth lever')
    assert.ok(!fullContent.includes('high-growth teams'), 'Must not contain high-growth teams')
    assert.ok(!fullContent.includes('cfo'), 'Must not contain cfo')

    // Must address travel concerns
    assert.ok(/weather|season|itinerary|budget|etiquette|transportation/i.test(fullContent), 'Must address travel topics')

    for (const topic of result.topics) {
      assert.strictEqual(topic.missiveQa.passed, true)
    }
  })

  // ── TEST D: Personal injury lawyer + accident victims (Legal / YMYL) ──
  test('TEST D: Personal injury lawyer for accident victims (Legal / YMYL)', async () => {
    const result = generateDynamicTopics({
      niche: 'personal injury lawyer',
      targetKeywords: ['car accident lawyer'],
      audience: 'accident victims',
      contentGoal: 'educational',
      tone: 'empathetic',
      count: 5,
    })

    assert.strictEqual(result.nicheClassification.nicheType, 'Legal / YMYL')
    assert.strictEqual(result.nicheClassification.isYMYL, true)

    const fullContent = JSON.stringify(result.topics).toLowerCase()
    assert.ok(!fullContent.includes('100% win rate'), 'Must not make fabricated win rate promises')
    assert.ok(!fullContent.includes('guaranteed settlement'), 'Must not guarantee settlements')
    assert.ok(!fullContent.includes('tech stack'), 'Must not contain tech stack')
    assert.ok(!fullContent.includes('unit economics'), 'Must not contain unit economics')

    for (const topic of result.topics) {
      assert.strictEqual(topic.missiveQa.passed, true)
    }
  })

  // ── TEST E: Running shoes + new runners (Consumer Product) ──
  test('TEST E: Running shoes for new runners (Consumer Product)', async () => {
    const result = generateDynamicTopics({
      niche: 'running shoes',
      targetKeywords: ['best running shoes for beginners'],
      audience: 'new runners',
      contentGoal: 'educational',
      tone: 'conversational',
      count: 5,
    })

    assert.strictEqual(result.nicheClassification.nicheType, 'Consumer Product')
    assert.strictEqual(result.nicheClassification.isConsumer, true)

    const allTitles = result.topics.map(t => t.title).join(' ')
    assert.ok(/buyer|cushioning|trail|mistakes|miles/i.test(allTitles), 'Must generate consumer footwear buying & use-case topics')

    const fullContent = JSON.stringify(result.topics).toLowerCase()
    assert.ok(!fullContent.includes('unit economics'), 'Must not contain unit economics')
    assert.ok(!fullContent.includes('tech stack'), 'Must not contain tech stack')
    assert.ok(!fullContent.includes('growth lever'), 'Must not contain growth lever')

    for (const topic of result.topics) {
      assert.strictEqual(topic.missiveQa.passed, true)
    }
  })

  // ── QA HARD FAILURE TESTS ──
  describe('Missive QA Hard Gates', () => {
    test('Hard Failure: Fabricated statistical claims trigger passed = false', () => {
      const badTopic = {
        id: 'bad-1',
        title: 'How the iPhone 18 Boosts Social Shares by 42%',
        hook: 'Apple reported a 42 percent higher story upload rate in our tests.',
        targetKeyword: 'iPhone 18',
      }

      const qa = runMissiveQA(badTopic, {
        nicheType: 'Consumer Technology',
        lifecycleState: 'rumored',
        primaryKeyword: 'iPhone 18',
      })

      assert.strictEqual(qa.passed, false, 'Must fail QA when fabricated statistics exist')
      assert.ok(qa.hardFailures.length >= 1, 'Should record hard failure for unverified stats')
      assert.strictEqual(qa.badge, 'QA Action Required (Hard Failure)')
    })

    test('Hard Failure: Lowercase brand entity casing triggers passed = false', () => {
      const badTopic = {
        id: 'bad-2',
        title: 'How to use iphone 18 and tiktok for creators',
        hook: 'Essential guide for creators on iphone and ios.',
        targetKeyword: 'iPhone 18',
      }

      const qa = runMissiveQA(badTopic, {
        nicheType: 'Consumer Technology',
        lifecycleState: 'rumored',
        primaryKeyword: 'iPhone 18',
      })

      assert.strictEqual(qa.passed, false, 'Must fail QA on incorrect branded entity casing')
      assert.ok(qa.hardFailures.some(f => f.includes('capitalization')), 'Should record brand casing failure')
    })

    test('Hard Failure: Inappropriate B2B jargon in consumer niche triggers passed = false', () => {
      const badTopic = {
        id: 'bad-3',
        title: 'Calculating the Real ROI of iPhone 18: Unit Economics for Creators',
        hook: 'Here is the modern tech stack and operational cycle velocity for iPhone 18 teams.',
        targetKeyword: 'iPhone 18',
      }

      const qa = runMissiveQA(badTopic, {
        nicheType: 'Consumer Technology',
        lifecycleState: 'rumored',
        primaryKeyword: 'iPhone 18',
      })

      assert.strictEqual(qa.passed, false, 'Must fail QA when B2B terms are injected into consumer topic')
      assert.ok(qa.hardFailures.some(f => f.includes('Inappropriate B2B')), 'Should record B2B terminology violation')
    })

    test('Hard Failure: Future rumored product treated as established product triggers passed = false', () => {
      const badTopic = {
        id: 'bad-4',
        title: 'iPhone 18 Long-Term Test: Our Hands-On Battery Decay Review',
        hook: 'In our testing we found that owners report battery life lasted 2 days.',
        targetKeyword: 'iPhone 18',
      }

      const qa = runMissiveQA(badTopic, {
        nicheType: 'Consumer Technology',
        lifecycleState: 'rumored',
        primaryKeyword: 'iPhone 18',
      })

      assert.strictEqual(qa.passed, false, 'Must fail QA when unreleased product is treated as established')
      assert.ok(qa.hardFailures.some(f => f.includes('Unreleased product')), 'Should record lifecycle violation')
    })

    test('Canonical Entity Casing: Preserves exact trademark casing', () => {
      assert.strictEqual(applyEntityCasing('iphone 18 pro max with ios and tiktok'), 'iPhone 18 Pro Max with iOS and TikTok')
      assert.strictEqual(applyEntityCasing('youtube and linkedin strategies with chatgpt'), 'YouTube and LinkedIn strategies with ChatGPT')
      assert.strictEqual(applyEntityCasing('macbook pro m4 and openai api for b2b saas'), 'MacBook Pro M4 and OpenAI API for B2B SaaS')
    })
  })

  // ── REGRESSION: unrecognized subject with no niche keyword-list match ──
  describe('Subject Affordance & Action-Object Compatibility (Regression)', () => {
    test('REGRESSION: silver jewellery + Commercial & Product Leads goal must not leak process/technical angles', () => {
      const result = generateDynamicTopics({
        niche: 'silver jewellery',
        targetKeywords: [],
        audience: '',
        contentGoal: 'Commercial & Product Leads',
        tone: 'conversational',
        count: 8,
      })

      // Falls through the (intentionally non-exhaustive) niche keyword list,
      // which is exactly the case this regression protects: an unrecognized
      // niche must not fall back to a blind "anything goes" angle set.
      assert.strictEqual(result.nicheClassification.nicheType, 'Other')

      const allText = result.topics.map((t) => `${t.title} ${t.hook}`).join(' ').toLowerCase()

      // No process/technical language: nothing in the input suggests this
      // subject behaves like a system that can be set up, configured, or
      // troubleshot.
      for (const banned of ['troubleshoot', 'troubleshooting', 'configure', 'configuration', 'implement', 'deploy', 'install', 'debug']) {
        assert.ok(!allText.includes(banned), `Must not contain process/technical term "${banned}" for an unrecognized non-technical subject`)
      }

      // No universal 4-slot template leakage — clusters must not be the
      // old blind defaults.
      const clusterNames = result.clusters.map((c) => c.name.toLowerCase())
      for (const generic of ['implementation & best practices', 'reviews & comparisons', 'advanced', 'deep dives']) {
        assert.ok(!clusterNames.some((n) => n.includes(generic)), `Clusters must not contain generic template "${generic}"`)
      }

      // Commercial & Product Leads goal must materially shape the
      // architecture: at least one cluster/angle should be decision- or
      // cost-oriented, not everything TOFU informational.
      assert.ok(
        result.topics.some((t) => t.searchIntent === 'commercial investigation' || t.searchIntent === 'comparison'),
        'Commercial goal should surface decision/comparison-oriented search intents'
      )

      // No trivial token-permutation entities (word reversal, no-space
      // concatenation, exact duplicates).
      const entities = result.topics[0].relatedEntities.map((e) => e.toLowerCase())
      const seenSets = new Set()
      for (const e of entities) {
        const key = e.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).sort().join('')
        assert.ok(!seenSets.has(key), `Entity "${e}" is a trivial permutation of an earlier entity`)
        seenSets.add(key)
      }

      // Title / angle / cluster consistency: each topic's angle and
      // cluster must both trace back to the same affordance as its title
      // (verified indirectly — no topic should carry a comparison title
      // with a non-comparison angle, etc).
      for (const t of result.topics) {
        if (/compared|versus|vs\.|differences explained/i.test(t.title)) {
          assert.match(t.contentAngle, /Comparison/i, `Comparison-style title "${t.title}" must carry a comparison angle, not "${t.contentAngle}"`)
        }
      }

      for (const t of result.topics) {
        assert.strictEqual(t.missiveQa.passed, true, `Topic "${t.title}" should pass Missive QA`)
      }
    })

    test('REGRESSION: unseen subject never referenced anywhere in the codebase generalizes without code changes', () => {
      const result = generateDynamicTopics({
        niche: 'ceramic espresso cups',
        targetKeywords: [],
        audience: '',
        contentGoal: 'Commercial & Product Leads',
        tone: 'conversational',
        count: 6,
      })

      assert.ok(result.topics.length >= 6)
      const allText = result.topics.map((t) => `${t.title} ${t.hook}`).join(' ').toLowerCase()
      for (const banned of ['troubleshoot', 'configure', 'implement', 'deploy', 'install', 'debug']) {
        assert.ok(!allText.includes(banned), `Must not leak process/technical term "${banned}" onto an unseen non-technical subject`)
      }
      for (const t of result.topics) {
        assert.strictEqual(t.missiveQa.passed, true, `Topic "${t.title}" should pass Missive QA`)
      }
    })

    test('CONTRAST: a genuinely technical subject with a how-to signal keeps setup/troubleshoot angles available', () => {
      const result = generateDynamicTopics({
        niche: 'home Wi-Fi mesh router setup',
        targetKeywords: ['mesh router configuration'],
        audience: 'home network enthusiasts',
        contentGoal: 'educational',
        tone: 'authoritative',
        count: 8,
      })

      const allAngles = result.topics.map((t) => t.contentAngle)
      assert.ok(
        allAngles.some((a) => /setup|implementation|troubleshoot|configuration/i.test(a)),
        `A how-to/technical subject should still surface process angles when the signal supports it. Got: ${allAngles.join(', ')}`
      )
    })
  })
})
