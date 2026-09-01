export function validateAnalysis(req, res, next) {
  const { content, targetKeyword, secondaryKeywords, contentType, searchIntent } = req.body
  const errors = []

  if (!content || typeof content !== 'string') {
    errors.push('Content is required.')
  } else {
    if (content.length < 100) errors.push('Content must be at least 100 characters.')
    if (content.length > 50000) errors.push('Content must be under 50,000 characters.')
  }

  if (targetKeyword && typeof targetKeyword !== 'string') {
    errors.push('Target keyword must be a string.')
  }

  if (secondaryKeywords && !Array.isArray(secondaryKeywords)) {
    errors.push('Secondary keywords must be an array of strings.')
  }

  const validContentTypes = ['Blog Post', 'Landing Page', 'Product Page', 'Service Page', 'Article', 'Other']
  if (contentType && !validContentTypes.includes(contentType)) {
    errors.push(`Content type must be one of: ${validContentTypes.join(', ')}`)
  }

  const validIntents = ['Informational', 'Commercial', 'Transactional', 'Navigational', 'Auto Detect']
  if (searchIntent && !validIntents.includes(searchIntent)) {
    errors.push(`Search intent must be one of: ${validIntents.join(', ')}`)
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join(' ') })
  }

  // Sanitize: trim strings
  req.body.content = content.trim()
  if (targetKeyword) req.body.targetKeyword = targetKeyword.trim()
  if (secondaryKeywords) req.body.secondaryKeywords = secondaryKeywords.map(k => k.trim()).filter(Boolean)

  next()
}

export function validateLead(req, res, next) {
  const { name, email } = req.body
  const errors = []

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required (minimum 2 characters).')
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('A valid email address is required.')
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join(' ') })
  }

  req.body.name = name.trim()
  req.body.email = email.trim().toLowerCase()
  if (req.body.company) req.body.company = req.body.company.trim()
  if (req.body.website) req.body.website = req.body.website.trim()
  if (req.body.phone) req.body.phone = req.body.phone.trim()

  next()
}
