import { CircleDot, LayoutGrid, Filter, Users, Link2, Download } from 'lucide-react'

const FEATURES = [
  {
    icon: CircleDot,
    title: 'One pillar page',
    text: 'The big guide that anchors the topic, with its title, format and the reason it comes first.',
  },
  {
    icon: LayoutGrid,
    title: '6 to 12 supporting pages',
    text: 'Specific article ideas with click-worthy working titles, grouped so related pages sit together.',
  },
  {
    icon: Filter,
    title: 'Funnel stage for every page',
    text: 'See which pages attract new readers, which help them compare, and which help them buy.',
  },
  {
    icon: Users,
    title: 'Audience and format',
    text: 'Each page says who it is written for and whether it should be a how-to, list, comparison or case study.',
  },
  {
    icon: Link2,
    title: 'Internal linking plan',
    text: 'Anchor text ideas for linking each page to the pillar, plus the paths that lead readers to convert.',
  },
  {
    icon: Download,
    title: 'Export and share',
    text: 'Copy the whole plan as text or download a CSV for your content calendar.',
  },
]

const STEPS = [
  {
    title: 'Type your topic',
    text: 'A keyword is enough. The planner works out who it is for and what kind of business you are.',
  },
  {
    title: 'Get your cluster',
    text: 'The planner chooses the pillar topic and drafts each supporting page with its stage, format and call to action.',
  },
  {
    title: 'Share it with your team',
    text: 'Copy a single page brief, the whole plan, or download the matrix as a spreadsheet.',
  },
]

const FAQS = [
  {
    q: 'What is a content cluster (hub and spoke)?',
    a: 'One big guide, called the pillar or hub, covers a topic from start to finish. Smaller articles, called spokes, each answer one specific question and link back to the guide. Search engines see the group as expertise on the topic, and readers get a clear path from first question to purchase.',
  },
  {
    q: 'What should I type in?',
    a: 'A topic, a keyword or a short brief. If you want to steer the plan, use the optional box to say who it is for, what you sell or what your goal is.',
  },
  {
    q: 'What do ToFu, MoFu and BoFu mean?',
    a: 'They are funnel stages. Awareness (ToFu) pages attract people who are just learning about a problem. Consideration (MoFu) pages help them compare solutions. Decision (BoFu) pages help them choose and buy.',
  },
  {
    q: 'How does it know my audience and goal from one keyword?',
    a: 'It reads the topic the way a strategist would and makes its best judgement. Every guess is labelled "Inferred" in the strategy summary. If you add your own details, the plan follows them and also shows what we would suggest.',
  },
  {
    q: 'I have already written some of these pages. Now what?',
    a: 'Press "I have written these" under the plan, or paste your published titles into the optional box. The planner skips what you have and suggests the next level: deeper pages that move readers toward buying.',
  },
  {
    q: 'Does it work for both products and services?',
    a: 'Yes, and it works out which you are. Product companies get comparison, alternatives, use-case and pricing pages. Service companies get cost guides, process explainers, "how to choose a provider" pages and case studies.',
  },
  {
    q: 'What is on the upgraded plan?',
    a: 'Four things. The planner reads your website, so topics fit what you sell and internal links point at pages you already have. You get a structured outline for any topic, which you can edit, approve and copy for your writer. From an approved outline it writes a full first draft, checked against our content QA checklist, with every statistic, example, image, infographic and video embed it needs marked in place. And you see the strategy summary behind each plan.',
  },
  {
    q: 'How reliable is the plan?',
    a: 'It is an AI-drafted strategy that is strong on structure, intent and angles. Check search volume and difficulty in your keyword tool before you commission the pages.',
  },
]

// Marketing sections below the tool: what you get, how it works, FAQ and the closing call to action.
export default function InfoSections({ ctaUrl }) {
  return (
    <>
      <section className="sec alt" id="features">
        <div className="inner">
          <div className="sechead">
            <p className="eyebrow">What you get</p>
            <h2>A plan your writers can start on today</h2>
            <p>
              Every page in the cluster comes with the decisions a strategist would make for you.
            </p>
          </div>
          <div className="feats">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div className="feat" key={title}>
                <span className="ico">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="how">
        <div className="inner">
          <div className="sechead">
            <p className="eyebrow">How it works</p>
            <h2>Three steps, no SEO background needed</h2>
          </div>
          <ol className="how">
            {STEPS.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sec alt" id="faq">
        <div className="inner">
          <div className="sechead">
            <p className="eyebrow">FAQ</p>
            <h2>Questions people ask</h2>
          </div>
          <div className="faq">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {ctaUrl && (
        <section className="cta" id="cta">
          <div className="inner">
            <div className="box">
              <div>
                <h2>Want this cluster researched, written and published?</h2>
                <p>
                  Our strategists validate the keywords, write the briefs and build the internal
                  links, so the plan turns into pages that rank.
                </p>
              </div>
              <a className="btn lg" href={ctaUrl} target="_blank" rel="noopener noreferrer">
                Book a strategy call
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
