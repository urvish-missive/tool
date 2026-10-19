/**
 * Standardized tone profiles with rich prompt directives, shared by the blog intro, blog conclusion
 * and case study generators.
 */
export const TONE_PROFILES = {
  conversational: {
    id: 'conversational',
    label: 'Conversational & Engaging',
    directive:
      'Write in a friendly, engaging, approachable voice like an experienced peer chatting over coffee. Use second-person perspective ("you"), natural conversational hooks, relatable analogies, and clear, human storytelling.',
  },
  authoritative: {
    id: 'authoritative',
    label: 'Authoritative & Thought-Leadership',
    directive:
      'Write with executive authority, deep industry credibility, strategic foresight, and authoritative conviction. Eliminate fluff, use confident language, and frame insights as definitive strategic principles.',
  },
  bold: {
    id: 'bold',
    label: 'Bold & Disruptive',
    directive:
      'Use contrarian, pattern-interrupting framing that boldly challenges conventional wisdom, busts sacred cows in the industry, and takes an unapologetic stance that demands attention.',
  },
  empathetic: {
    id: 'empathetic',
    label: 'Empathetic & Supportive',
    directive:
      "Demonstrate profound empathy for the reader's real pain points, decision fatigue, and operational challenges. Use an encouraging, warm, and highly supportive tone that validates their struggle and offers reassurance.",
  },
  witty: {
    id: 'witty',
    label: 'Witty & Energetic',
    directive:
      'Inject clever metaphors, sharp energetic pacing, vibrant wordplay, and intelligent humor while keeping the takeaways deeply actionable and memorable.',
  },
  'data-driven': {
    id: 'data-driven',
    label: 'Analytical & Data-Driven',
    directive:
      'Adopt a rigorous, objective, metric-focused analytical lens. Emphasize verified benchmarks, statistical realities, measurable outcomes, frameworks, and empirical rigor without inventing fabricated numbers.',
  },
  storytelling: {
    id: 'storytelling',
    label: 'Storytelling & Narrative',
    directive:
      'Ground the content in immersive storytelling, narrative tension, relatable real-world anecdotes, and vivid scene-setting that hooks human curiosity and makes the reader feel part of an unfolding journey.',
  },
  fun: {
    id: 'fun',
    label: 'Fun & Playful',
    directive:
      'Keep it lighthearted, playful, and delightfully fun. Use casual upbeat phrasing, lively analogies, and an entertaining, high-vibe voice that makes reading effortless and smile-worthy.',
  },
}
