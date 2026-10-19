// Sample plan shown by "See a sample plan", for the keyword "employee onboarding software".
const SAMPLE_PLAN = {
  summary: {
    target_icp:
      'HR and People Ops leaders at 50 to 500 person companies who onboard new hires with spreadsheets and email, lose track of tasks, and see slow ramp-up (Inferred)',
    primary_goal: 'Balanced full-funnel (Inferred)',
    product_offer: 'Employee onboarding software, demo and free checklist as offers (Inferred)',
    core_search_intent:
      'How to run a consistent onboarding process that gets new hires productive faster, and which software supports it',
    hub_concept: 'Employee onboarding, from offer letter to day 90',
    business_type: 'Product: software (Inferred)',
    assumptions: [
      'Audience inferred from the keyword: buyers of onboarding software are usually HR leads at growing companies',
      'No goal supplied, so the cluster covers awareness, lead generation and revenue pages',
      'No product named, so calls to action use a generic demo and a checklist download',
    ],
  },
  hub: {
    working_title: 'Employee Onboarding: The Complete Guide from Offer Letter to Day 90',
    funnel_stage: 'ToFu',
    reading_level: 'Beginner',
    business_goal: 'Awareness / Authority',
    content_format: 'Ultimate Guide / Pillar',
    search_intent: 'Informational',
    cta: 'Download the 30-60-90 day checklist',
    intent:
      "HR leaders searching 'employee onboarding process' want a full picture of phases, owners and timelines they can adapt.",
    strategic_value:
      'Covers every phase at summary depth, so each supporting page has a natural section to link from and back to.',
  },
  spokes: [
    {
      group: 'Foundations',
      working_title: 'Onboarding vs Orientation: What Each Covers and Why It Matters',
      funnel_stage: 'ToFu',
      audience_level: 'Beginner',
      business_purpose: 'Awareness',
      format_angle: 'Comparison / Versus / Alternative',
      search_intent: 'Informational',
      linking_hook:
        "Anchor 'full employee onboarding process' in the section on what comes after day one",
      cta: 'Read the complete onboarding guide',
    },
    {
      group: 'Foundations',
      working_title: '12 Onboarding Mistakes That Push New Hires Out in 90 Days',
      funnel_stage: 'ToFu',
      audience_level: 'Beginner',
      business_purpose: 'Awareness',
      format_angle: 'Listicle',
      search_intent: 'Informational',
      linking_hook: "Anchor 'a structured 90-day onboarding plan' after the final mistake",
      cta: 'Download the 30-60-90 day checklist',
    },
    {
      group: 'Execution',
      working_title: 'How to Build a 30-60-90 Day Onboarding Plan (with Template)',
      funnel_stage: 'MoFu',
      audience_level: 'Intermediate',
      business_purpose: 'MQL Generation',
      format_angle: 'Tactical How-To / Step-by-Step',
      search_intent: 'Informational',
      linking_hook: "Anchor 'onboarding phases explained' in the intro",
      cta: 'Gated template download',
    },
    {
      group: 'Execution',
      working_title: 'Onboarding Metrics: Time to Productivity, Retention and What to Track',
      funnel_stage: 'MoFu',
      audience_level: 'Advanced',
      business_purpose: 'Internal Linking / Topical Depth',
      format_angle: 'Tactical How-To / Step-by-Step',
      search_intent: 'Informational',
      linking_hook: "Anchor 'onboarding process benchmarks' where each metric is defined",
      cta: 'Use the ROI calculator',
    },
    {
      group: 'Execution',
      working_title: 'Why Onboarding Belongs to Managers, with HR in Support',
      funnel_stage: 'MoFu',
      audience_level: 'Intermediate',
      business_purpose: 'Awareness',
      format_angle: 'Thought Leadership / Opinionated View',
      search_intent: 'Informational',
      linking_hook: "Anchor 'who owns each onboarding stage' in the argument section",
      cta: 'Subscribe to the People Ops newsletter',
    },
    {
      group: 'Decision',
      working_title: 'Best Employee Onboarding Software Compared: Features, Pricing, Fit',
      funnel_stage: 'BoFu',
      audience_level: 'Intermediate',
      business_purpose: 'SQL / Revenue Generation',
      format_angle: 'Comparison / Versus / Alternative',
      search_intent: 'Commercial Investigation',
      linking_hook: "Anchor 'what a complete onboarding process needs' above the comparison table",
      cta: 'Book a demo',
    },
    {
      group: 'Decision',
      working_title: 'How a 200-Person Company Cut New-Hire Ramp Time by a Third',
      funnel_stage: 'BoFu',
      audience_level: 'Advanced',
      business_purpose: 'SQL / Revenue Generation',
      format_angle: 'Case Study / Playbook',
      search_intent: 'Transactional',
      linking_hook: "Anchor 'the onboarding framework they followed' in the approach section",
      cta: 'Book a demo',
    },
  ],
  industries: ['Healthcare', 'Retail and hospitality', 'Tech startups'],
  more_pillars: [
    {
      working_title: "Employee Onboarding Software: The Complete Buyer's Guide",
      why: 'A product-led pillar for readers ready to compare tools. It anchors comparison, pricing and alternatives pages.',
    },
    {
      working_title: 'Remote Employee Onboarding: How to Welcome Hires You Never Meet in Person',
      why: 'A use-case pillar for a fast-growing segment with its own problems and search demand.',
    },
    {
      working_title: 'Employee Retention: How to Keep New Hires Past Their First Year',
      why: 'The next problem your buyers face, so it extends your reach to the same audience.',
    },
  ],
  linking: {
    spoke_to_hub: [
      'Every supporting page links to the pillar once in the first 200 words and once near the call to action',
      "Vary anchors: 'employee onboarding process', 'onboarding guide', 'onboarding phases'",
    ],
    cross_spoke: [
      'Mistakes listicle links to the 30-60-90 plan as the fix',
      'Metrics post links to the case study as proof',
      'Manager ownership post links to the 30-60-90 plan',
    ],
    bofu_paths: [
      '30-60-90 template thank-you page points to the software comparison',
      'Software comparison and case study both end on the demo request',
      'Pillar links to the comparison from its tools section',
    ],
  },
}

export default SAMPLE_PLAN
