/**
 * Niche and Subject Classifier
 * Classifies input into domain content types to govern all downstream generation rules,
 * angle eligibility, and terminology boundaries.
 */

export const NICHE_TYPES = [
  'B2B SaaS',
  'B2B Services',
  'Consumer Technology',
  'Consumer Product',
  'Ecommerce',
  'Finance',
  'Healthcare',
  'Travel',
  'Entertainment',
  'Gaming',
  'Education',
  'Marketing',
  'Software Development',
  'Local Business',
  'Professional Services',
  'Lifestyle',
  'News / Trending Topic',
  'Legal / YMYL',
  'Other',
]

const CLASSIFICATION_RULES = [
  {
    type: 'Legal / YMYL',
    keywords: [
      'lawyer', 'attorney', 'legal', 'lawsuit', 'injury', 'accident', 'settlement',
      'compensation', 'litigation', 'court', 'divorce', 'defense', 'claimant', 'tort',
    ],
    isYMYL: true,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'Consumer Technology',
    keywords: [
      'iphone', 'ipad', 'android', 'smartphone', 'phone', 'macbook', 'laptop', 'tablet',
      'smartwatch', 'airpods', 'headphones', 'earbuds', 'oled', 'camera', 'gadget',
      'wearable', 'console', 'processor', 'display', 'screen', 'battery life', 'ios',
    ],
    isYMYL: false,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'Travel',
    keywords: [
      'travel', 'bali', 'vacation', 'flight', 'hotel', 'resort', 'itinerary', 'tourism',
      'visit', 'visiting', 'island', 'beach', 'destination', 'backpacking', 'tourist',
      'passport', 'visa', 'trip', 'airline',
    ],
    isYMYL: false,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'Healthcare',
    keywords: [
      'health', 'medical', 'doctor', 'clinic', 'symptom', 'disease', 'surgery', 'therapy',
      'wellness', 'patient', 'hospital', 'medicine', 'dental', 'mental health', 'treatment',
    ],
    isYMYL: true,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'Finance',
    keywords: [
      'finance', 'banking', 'mortgage', 'loan', 'credit card', 'investing', 'investment',
      'stock', 'crypto', 'wealth', 'retirement', 'budget', 'interest rate', 'refinance',
    ],
    isYMYL: true,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'Consumer Product',
    keywords: [
      'shoes', 'running shoes', 'sneakers', 'clothing', 'apparel', 'appliance', 'vacuum',
      'mattress', 'cookware', 'skincare', 'cosmetics', 'backpack', 'luggage', 'furniture',
      'watch', 'gear', 'jacket', 't-shirt',
    ],
    isYMYL: false,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'B2B SaaS',
    keywords: [
      'crm', 'saas', 'software as a service', 'sales crm', 'enterprise software', 'erp',
      'hris', 'martech', 'cloud software', 'subscription software', 'b2b platform',
      'lead management software', 'sales automation tool',
    ],
    isYMYL: false,
    isB2B: true,
    isConsumer: false,
  },
  {
    type: 'Software Development',
    keywords: [
      'software development', 'programming', 'developer', 'api', 'react', 'javascript',
      'typescript', 'python', 'kubernetes', 'docker', 'devops', 'backend', 'frontend',
      'git', 'sql', 'database', 'microservices', 'sdk', 'code',
    ],
    isYMYL: false,
    isB2B: true,
    isConsumer: false,
  },
  {
    type: 'Gaming',
    keywords: [
      'gaming', 'game', 'gamer', 'playstation', 'ps5', 'xbox', 'nintendo', 'steam',
      'gameplay', 'rpg', 'fps', 'esports', 'twitch',
    ],
    isYMYL: false,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'Marketing',
    keywords: [
      'marketing', 'seo', 'content marketing', 'email marketing', 'ppc', 'advertising',
      'social media marketing', 'branding', 'inbound marketing', 'funnel', 'copywriting',
    ],
    isYMYL: false,
    isB2B: true,
    isConsumer: false,
  },
  {
    type: 'Ecommerce',
    keywords: [
      'ecommerce', 'e-commerce', 'shopify', 'woocommerce', 'dropshipping', 'online store',
      'retail', 'cart', 'checkout', 'amazon fba',
    ],
    isYMYL: false,
    isB2B: true,
    isConsumer: true,
  },
  {
    type: 'Education',
    keywords: [
      'education', 'course', 'university', 'college', 'student', 'degree', 'learning',
      'curriculum', 'tutoring', 'certification', 'academy',
    ],
    isYMYL: false,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'Local Business',
    keywords: [
      'plumbing', 'plumber', 'electrician', 'roofing', 'hvac', 'local repair',
      'landscaping', 'pest control', 'locksmith', 'contractor',
    ],
    isYMYL: false,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'Entertainment',
    keywords: [
      'movie', 'movies', 'film', 'cinema', 'tv show', 'series', 'actor', 'streaming',
      'netflix', 'celebrity', 'music', 'album', 'concert',
    ],
    isYMYL: false,
    isB2B: false,
    isConsumer: true,
  },
  {
    type: 'Lifestyle',
    keywords: [
      'lifestyle', 'fitness', 'workout', 'diet', 'home decor', 'gardening', 'parenting',
      'cooking', 'recipe', 'meditation', 'yoga', 'running',
    ],
    isYMYL: false,
    isB2B: false,
    isConsumer: true,
  },
]

/**
 * Classifies a subject, keyword, and audience into a distinct nicheType.
 */
export function classifyNiche(subject = '', primaryKeyword = '', audience = '') {
  const combinedText = `${subject} ${primaryKeyword} ${audience}`.toLowerCase()

  let bestMatch = null
  let highestScore = 0

  for (const rule of CLASSIFICATION_RULES) {
    let score = 0
    for (const kw of rule.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i')
      if (regex.test(combinedText)) {
        // Boost if match is in the subject or keyword directly
        if (new RegExp(`\\b${kw}\\b`, 'i').test(`${subject} ${primaryKeyword}`)) {
          score += 3
        } else {
          score += 1
        }
      }
    }

    if (score > highestScore) {
      highestScore = score
      bestMatch = rule
    }
  }

  if (bestMatch && highestScore >= 2) {
    return {
      nicheType: bestMatch.type,
      confidence: Math.min(0.7 + highestScore * 0.05, 0.98),
      reasoning: `Identified domain patterns in subject and keywords matching ${bestMatch.type}.`,
      isYMYL: bestMatch.isYMYL,
      isB2B: bestMatch.isB2B,
      isConsumer: bestMatch.isConsumer,
    }
  }

  // Fallback heuristic based on B2B audience cues
  const hasB2BAudience = /\b(enterprise|cfo|cto|executives|b2b|leaders|directors|teams|saas)\b/i.test(audience)
  if (hasB2BAudience) {
    return {
      nicheType: 'B2B Services',
      confidence: 0.65,
      reasoning: 'Audience indicates B2B / enterprise operational context.',
      isYMYL: false,
      isB2B: true,
      isConsumer: false,
    }
  }

  return {
    nicheType: 'Other',
    confidence: 0.5,
    reasoning: 'General topic classification.',
    isYMYL: false,
    isB2B: false,
    isConsumer: true,
  }
}
