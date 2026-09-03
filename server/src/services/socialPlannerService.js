import { callAIAndParseJSON } from '../utils/aiProvider.js'

const DEFAULT_PLATFORMS = ['linkedin', 'twitter', 'instagram']

/**
 * Generate comprehensive social media posts, calendar schedule, viral hooks, and hashtag clusters
 */
export async function generateSocialPlan({
  topic,
  platforms = DEFAULT_PLATFORMS,
  planType = 'single', // 'single' | 'sprint_7d' | 'calendar_30d'
  tone = 'thought_leadership',
  audience = 'B2B Founders, Marketers & Creators',
  ctaType = 'engagement',
  preferredProvider,
}) {
  const cleanTopic = (topic || '').trim()
  if (!cleanTopic) {
    throw new Error('Please provide a topic, concept, or article summary to plan social content.')
  }

  const selectedPlatforms = Array.isArray(platforms) && platforms.length > 0 ? platforms : DEFAULT_PLATFORMS

  const systemMessage = `You are a world-class Social Media Content Strategist and Viral Copywriter who has helped top LinkedIn Top Voices, Twitter/X creators (100k+ followers), and Instagram brand accounts scale organic reach.

Your goal is to transform any topic into high-converting, engagement-driven social media posts tailored to each platform's unique algorithm, formatting rules, and audience culture.

Formatting & Platform Standards:
1. LINKEDIN:
   - Must have a killer first 2 lines (before "see more" cutoff).
   - Generous whitespace between sentences (1-2 sentences per paragraph).
   - Engaging storytelling structure: Hook -> Conflict/Insight -> 3-5 Bulleted Takeaways -> Strong Discussion Question CTA.
   - Include 3-5 curated industry hashtags at bottom.
   - Provide a 4-5 slide Carousel Outline concept.

2. TWITTER / X:
   - Must provide a viral single tweet (<280 characters).
   - Also provide a 5-tweet Thread breakdown with numbers (1/5, 2/5, etc.) and a final CTA tweet.

3. INSTAGRAM:
   - Punchy first line hook that works as a reel/carousel cover headline.
   - Conversational caption with line breaks and subtle emojis.
   - Clear Save/Share CTA.
   - 3-tier hashtag cluster: 3 high-volume (1M+), 5 mid-tail (100k+), 5 ultra-niche (10k+).

4. FACEBOOK:
   - Conversational community tone, relatable opening, questions that encourage comments in the algorithm.

5. VIRAL HOOKS:
   - For every post, generate 5 distinct hook variants:
     a) Question Hook
     b) Contrarian Hook (challenges common wisdom)
     c) Statistic / Proof Hook
     d) Story / "I learned this the hard way" Hook
     e) How-To / Actionable Value Hook

6. CALENDAR SCHEDULE (If planType is 'sprint_7d' or 'calendar_30d'):
   - Provide day-by-day scheduled posts mapped across 7 core content pillars:
     1. Educational / How-To
     2. Thought Leadership / Opinion
     3. Case Study / Proof / Results
     4. Contrarian / Myth Busting
     5. Storytelling / Personal Experience
     6. Community Engagement / Question
     7. Soft Promotion / Lead Magnet
   - Include recommended posting times (e.g., "Tuesday 8:30 AM EST").

Return ONLY valid JSON matching the requested structure.`

  const userMessage = `Create an advanced Social Media Content Plan for:
Topic: "${cleanTopic}"
Platforms: ${selectedPlatforms.join(', ')}
Plan Type: ${planType} (single post per platform, 7-day sprint, or 30-day calendar)
Tone: ${tone}
Target Audience: ${audience}
Primary CTA Goal: ${ctaType}

Return a JSON object with this EXACT structure:
{
  "strategySummary": "2-3 sentence strategic rationale for this campaign, explaining why this angle will succeed on these platforms.",
  "contentPillars": [
    { "name": "Pillar name", "percentage": 30, "description": "Why this pillar builds authority" }
  ],
  "posts": [
    {
      "platform": "linkedin|twitter|instagram|facebook",
      "platformLabel": "LinkedIn",
      "bestTimeToPost": "Tuesday at 8:30 AM (Audience peak active window)",
      "characterCount": 1150,
      "hook": "The opening 1-2 lines that stop the scroll",
      "content": "Full post text with line breaks, bullets, and emojis ready to copy-paste",
      "hookVariants": {
        "question": "Did you know that...",
        "contrarian": "Stop doing X. Here is what actually works in 2026...",
        "statistic": "92% of creators make this mistake...",
        "story": "3 years ago I had zero followers. Here is what shifted...",
        "howTo": "How to master X in 5 simple steps:"
      },
      "hashtags": ["#SEO", "#ContentMarketing", "#Growth"],
      "mediaRecommendation": {
        "type": "carousel|image|video_short|text_only",
        "description": "Visual direction for graphic designer or Canva template",
        "slides": ["Slide 1: Hook headline", "Slide 2: The Problem", "Slide 3: The Framework", "Slide 4: Results", "Slide 5: Save & Share"]
      },
      "threadTweets": [
        "1/5 Tweet 1...",
        "2/5 Tweet 2...",
        "3/5 Tweet 3...",
        "4/5 Tweet 4...",
        "5/5 Tweet 5 (CTA)..."
      ]
    }
  ],
  "calendar": [
    {
      "dayNumber": 1,
      "dayName": "Monday",
      "contentPillar": "Educational / How-To",
      "platform": "linkedin",
      "time": "08:30 AM",
      "headline": "Post title or core hook",
      "draftSnippet": "Brief draft summary of what to post",
      "mediaType": "Carousel",
      "status": "Ready to Post"
    }
  ]
}`

  try {
    const parsed = await callAIAndParseJSON(
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      { preferredProvider, temperature: 0.7, maxTokens: 4000 }
    )

    if (parsed && Array.isArray(parsed.posts) && parsed.posts.length > 0) {
      return {
        topic: cleanTopic,
        planType,
        platforms: selectedPlatforms,
        tone,
        audience,
        strategySummary: parsed.strategySummary || `Strategic multi-platform plan tailored for ${audience}.`,
        contentPillars: parsed.contentPillars || getDefaultContentPillars(),
        posts: parsed.posts.map((p, idx) => ({
          id: `post-${idx + 1}`,
          platform: (p.platform || 'linkedin').toLowerCase(),
          platformLabel: p.platformLabel || capitalize(p.platform || 'linkedin'),
          bestTimeToPost: p.bestTimeToPost || 'Tuesday at 8:30 AM EST',
          characterCount: p.characterCount || (p.content ? p.content.length : 500),
          hook: p.hook || (p.content ? p.content.split('\n')[0] : 'Stop scrolling:'),
          content: p.content || '',
          hookVariants: p.hookVariants || generateDefaultHookVariants(cleanTopic),
          hashtags: Array.isArray(p.hashtags) ? p.hashtags : ['#Marketing', '#Growth', '#Strategy'],
          mediaRecommendation: p.mediaRecommendation || {
            type: 'image',
            description: `Minimalist branded card highlighting "${cleanTopic}"`,
            slides: [],
          },
          threadTweets: Array.isArray(p.threadTweets) ? p.threadTweets : [],
        })),
        calendar: Array.isArray(parsed.calendar) && parsed.calendar.length > 0
          ? parsed.calendar
          : generateDefaultCalendar(cleanTopic, selectedPlatforms, planType),
        generatedAt: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.warn('AI social plan generation failed or timed out. Using high-quality deterministic fallback:', error.message)
  }

  // Fallback generation
  return generateDeterministicSocialPlan(cleanTopic, selectedPlatforms, planType, tone, audience)
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getDefaultContentPillars() {
  return [
    { name: 'Actionable Value & How-To', percentage: 35, description: 'Step-by-step guides that solve immediate audience pain points.' },
    { name: 'Thought Leadership & Insights', percentage: 25, description: 'Bold industry perspectives and contrarian takes.' },
    { name: 'Social Proof & Case Studies', percentage: 20, description: 'Real numbers, client transformations, and screenshots.' },
    { name: 'Community Discussion & Polls', percentage: 20, description: 'Engaging open-ended questions that trigger comments.' },
  ]
}

function generateDefaultHookVariants(topic) {
  return {
    question: `Are you still approaching ${topic} the traditional way in 2026?`,
    contrarian: `Most advice on ${topic} is completely outdated. Here's why:`,
    statistic: `91% of teams struggle with ${topic}. Here is the exact framework the top 1% use:`,
    story: `3 years ago, I had no clue how to tackle ${topic}. A $10,000 mistake changed everything:`,
    howTo: `How to master ${topic} in 5 actionable steps (Bookmark this):`,
  }
}

function generateDefaultCalendar(topic, platforms, planType) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const pillars = [
    { pillar: 'Educational / How-To', media: 'Multi-Slide Carousel', time: '08:30 AM' },
    { pillar: 'Thought Leadership', media: 'Bold Text Graphic', time: '12:15 PM' },
    { pillar: 'Case Study / Proof', media: 'Metrics Screenshot', time: '09:00 AM' },
    { pillar: 'Contrarian Take', media: 'Text-Only Story', time: '04:30 PM' },
    { pillar: 'Personal Story', media: 'Behind-The-Scenes Photo', time: '08:00 AM' },
    { pillar: 'Community Question', media: 'Engagement Poll', time: '11:00 AM' },
    { pillar: 'Weekly Recap & CTA', media: 'Infographic Summary', time: '10:00 AM' },
  ]

  const count = planType === 'calendar_30d' ? 30 : 7
  const schedule = []

  for (let i = 0; i < count; i++) {
    const dayIdx = i % 7
    const dayInfo = pillars[dayIdx]
    const platform = platforms[i % platforms.length]

    schedule.push({
      dayNumber: i + 1,
      dayName: days[dayIdx],
      contentPillar: dayInfo.pillar,
      platform,
      time: dayInfo.time,
      headline: `${dayInfo.pillar}: Mastering ${topic} (Part ${i + 1})`,
      draftSnippet: `Share a focused lesson about ${topic} highlighting key workflows, pitfalls to avoid, and a clear prompt for comments.`,
      mediaType: dayInfo.media,
      status: i === 0 ? 'Ready to Post' : 'Draft',
    })
  }

  return schedule
}

function generateDeterministicSocialPlan(topic, platforms, planType, tone, audience) {
  const hooks = generateDefaultHookVariants(topic)
  const posts = []

  if (platforms.includes('linkedin')) {
    posts.push({
      id: 'post-1',
      platform: 'linkedin',
      platformLabel: 'LinkedIn',
      bestTimeToPost: 'Tuesday & Thursday at 8:30 AM EST',
      characterCount: 1240,
      hook: hooks.contrarian,
      content: `${hooks.contrarian}

Most people think success with ${topic} requires massive budgets and endless hours.

In reality, the top 1% follow a simple 4-step framework:

1️⃣ Clarify the North Star: Stop trying to do everything at once. Focus on the single highest-leverage lever.
2️⃣ Standardize the Process: Document what works before trying to scale it.
3️⃣ Leverage Modern AI & Automation: Automate repetitive tasks so you can focus on creative strategy.
4️⃣ Ruthless Consistency: 30 days of focused effort beats 6 months of sporadic sprints.

💡 The Key Takeaway:
Complexity is the enemy of execution. When you simplify ${topic}, consistency follows naturally.

What is your biggest bottleneck when it comes to ${topic}? Drop your thoughts below—I reply to every comment! 👇`,
      hookVariants: hooks,
      hashtags: ['#Strategy', '#Growth', '#Productivity', '#Leadership', '#Business'],
      mediaRecommendation: {
        type: 'carousel',
        description: `Clean 5-slide PDF carousel with bold typography breaking down the 4 steps of ${topic}.`,
        slides: [
          `Slide 1: Why 90% Fail at ${topic}`,
          'Slide 2: Step 1 - Clarify the North Star',
          'Slide 3: Step 2 - Standardize the Process',
          'Slide 4: Step 3 - AI & Modern Systems',
          'Slide 5: Save this for your team',
        ],
      },
      threadTweets: [],
    })
  }

  if (platforms.includes('twitter')) {
    posts.push({
      id: 'post-2',
      platform: 'twitter',
      platformLabel: 'Twitter / X',
      bestTimeToPost: 'Wednesday at 9:00 AM & 5:00 PM EST',
      characterCount: 265,
      hook: `Most people overcomplicate ${topic}.`,
      content: `Most people overcomplicate ${topic}.

Here is the 4-step framework that actually moves the needle:

• Focus on 1 metric
• Automate routine tasks
• Document daily wins
• Iterate every 7 days

Simple systems scale. Complex ones break. 🧵👇`,
      hookVariants: hooks,
      hashtags: ['#buildinpublic', '#growth', '#tech'],
      mediaRecommendation: {
        type: 'text_only',
        description: 'Single punchy tweet with strong whitespace or high-contrast 16:9 infographic card.',
        slides: [],
      },
      threadTweets: [
        `1/5 Most people overcomplicate ${topic}. Here's the 4-step framework the top 1% use:`,
        `2/5 Step 1: Pick one primary constraint. Trying to optimize 5 metrics at once guarantees zero momentum. Focus on the core bottleneck.`,
        `3/5 Step 2: Build feedback loops. If you can't measure whether your changes to ${topic} worked in 48 hours, your cycle time is too slow.`,
        `4/5 Step 3: Remove friction with smart tooling. Replace 4 hours of manual busywork with structured systems.`,
        `5/5 That's a wrap! If you found this valuable:\n1. Retweet the first tweet to help others.\n2. Follow for more actionable frameworks on ${topic}.`,
      ],
    })
  }

  if (platforms.includes('instagram')) {
    posts.push({
      id: 'post-3',
      platform: 'instagram',
      platformLabel: 'Instagram',
      bestTimeToPost: 'Monday & Wednesday at 11:30 AM EST',
      characterCount: 920,
      hook: `Stop doing ${topic} the hard way. Swipe for the blueprint ➡️`,
      content: `Stop doing ${topic} the hard way. Swipe for the blueprint ➡️

When you look at anyone winning with ${topic}, they aren't working twice as hard. They have a smarter system.

Here are 3 rules we swear by:
✨ Rule #1: Consistency > Intensity
✨ Rule #2: Simplicity > Over-engineering
✨ Rule #3: Track proof, not opinions

Save this post so you have it ready for your next strategy session! 💾

Double tap if this resonated, and share your perspective in the comments below! 👇`,
      hookVariants: hooks,
      hashtags: [
        '#growthmindset',
        '#contentstrategy',
        '#digitalmarketing',
        '#businessgrowth',
        '#entrepreneurship',
        '#dailytips',
        '#creatorlife',
        '#learnandgrow',
      ],
      mediaRecommendation: {
        type: 'carousel',
        description: `Modern 1080x1350 vertical carousel with dark mode background and vibrant accent highlights.`,
        slides: [
          `Slide 1: Cover - The ${topic} Blueprint`,
          'Slide 2: Mistake #1 to avoid',
          'Slide 3: The 3 Golden Rules',
          'Slide 4: Example in action',
          'Slide 5: Share & Save reminder',
        ],
      },
      threadTweets: [],
    })
  }

  if (platforms.includes('facebook')) {
    posts.push({
      id: 'post-4',
      platform: 'facebook',
      platformLabel: 'Facebook',
      bestTimeToPost: 'Thursday at 1:00 PM EST',
      characterCount: 850,
      hook: `Quick question for everyone working on ${topic}:`,
      content: `Quick question for everyone working on ${topic}:

What has been your single biggest win (or biggest frustration) this month?

We’ve been analyzing what actually drives repeatable results in ${topic}, and one trend stands out clearly:

The creators and businesses seeing 3x faster progress are focusing on depth rather than chasing every new trend. They pick a clear strategy, stick to it for 90 days, and refine based on real data.

Tell us in the comments: Are you prioritizing speed or depth right now? Let's discuss! 👇`,
      hookVariants: hooks,
      hashtags: ['#Community', '#Discussion', '#Strategy'],
      mediaRecommendation: {
        type: 'image',
        description: 'Authentic behind-the-scenes photo or branded quote card with clean typography.',
        slides: [],
      },
      threadTweets: [],
    })
  }

  return {
    topic,
    planType,
    platforms,
    tone,
    audience,
    strategySummary: `Tailored multi-platform organic social strategy designed to maximize engagement, authority, and discussion for ${audience}.`,
    contentPillars: getDefaultContentPillars(),
    posts,
    calendar: generateDefaultCalendar(topic, platforms, planType),
    generatedAt: new Date().toISOString(),
  }
}
