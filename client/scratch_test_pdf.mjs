import { generateQaPdf } from './src/utils/generateQaPdf.js'
import fs from 'fs'

const sampleReport = {
  overall: 82,
  passed: 23,
  total: 34,
  quickStats: {
    emDashesCount: 4,
    aiPhrasesCount: 3,
    fleschScore: -10,
  },
  ai: {
    summary: "The content is structurally solid with comprehensive coverage of AI vs traditional softphones, but it suffers from sales-forward brand positioning, generic E-E-A-T signals, cliché usage, and an opening that delays insight with backstory. The Tragofone section reads as a product pitch rather than a thought leadership piece, and the opening needs to drop setup in favor of a sharp hook.",
    topFixes: [
      "Remove all 4 em dashes and replace with commas or restructure sentences. Found: 'knowledge that supports onboarding, collaboration, product development' (line unclear) — search document for '—' and '--' patterns.",
      "Replace AI clichés: 'revolutionize' appears multiple times, 'transform' is overused, and 'The Future of Business Calling Is Intelligent' is generic. Use specific, observational language instead of marketing-speak.",
      "Strip the Tragofone section to remove sales language: 'stands at the forefront,' 'positioned as a leader,' 'Key differentiators that position Tragofone as a leader' — these make the comparison article feel like a pitch. Replace with 1-2 sentences on what Tragofone prioritizes in its AI-first approach."
    ],
    categories: {
      tone: {
        issues: ["Em dash found: content references 'knowledge that supports onboarding, collaboration, product development' - scan for '--' and '—'"],
        suggestions: ["Find and remove all em dashes, replace with commas or restructure"]
      },
      readAloud: {
        issues: ["'Without AI processing running alongside conversations, traditional softphones generally consume fewer system resources' - too many qualifying clauses"],
        suggestions: ["Split the traditional softphone bullet: 'Lower computing requirements. Traditional softphones don't run AI processing alongside calls, so they use fewer system resources.'"]
      }
    }
  },
  categories: {
    tone: {
      number: 1,
      label: 'Tone, Style, and AI Check',
      items: [
        { id: 't1', label: 'Is the tone human, crisp, and conversational?', auto: true },
        { id: 't2', label: 'No robotic phrases, no fluff, no clichés.', auto: true },
        { id: 't3', label: 'No em dashes.', auto: true },
        { id: 't4', label: 'Sentences clear, complete, not abrupt.', auto: true }
      ]
    },
    readAloud: {
      number: 2,
      label: 'Read Aloud Test',
      items: [
        { id: 'r1', label: 'If read out loud, does it sound natural?', auto: true },
        { id: 'r2', label: 'Does it hold attention, sound confident, and flow smoothly?', auto: false },
        { id: 'r3', label: 'Can any line be shortened without losing meaning?', auto: true }
      ]
    }
  },
  categoryScores: {
    tone: 46,
    readAloud: 61
  },
  statuses: {
    t1: 'pass',
    t2: 'pass',
    t3: 'pass',
    t4: 'pass',
    r1: 'pass',
    r2: 'pass',
    r3: 'pending'
  }
}

const meta = {
  title: 'AI Softphone vs Traditional Softphone: The Next',
  keyword: 'Not specified',
  targetAudience: 'General Audience',
  platform: 'WEBSITE / BLOG',
  score: 82,
  passed: 23,
  total: 34
}

console.log('Generating test PDF...')
const doc = generateQaPdf(sampleReport, meta)
const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
fs.writeFileSync('./scratch_output.pdf', pdfBuffer)
console.log('PDF written successfully, bytes:', pdfBuffer.length, 'pages:', doc.getNumberOfPages())
