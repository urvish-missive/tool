import { createIssue, findDuplicates, keywordFrequency } from '../../utils/helpers.js'

export function analyzeOnPage(pages, targetKeyword) {
  const issues = []
  const summary = {
    totalPages: pages.length,
    missingTitles: 0, duplicateTitles: 0, shortTitles: 0, longTitles: 0,
    missingDescriptions: 0, duplicateDescriptions: 0, shortDescriptions: 0,
    missingH1: 0, multipleH1: 0,
    imagesWithoutAlt: 0, totalImages: 0,
    thinContentPages: 0, avgWordCount: 0,
  }

  summary.avgWordCount = pages.length > 0 ? Math.round(pages.reduce((s, p) => s + p.wordCount, 0) / pages.length) : 0

  // ── Titles ──
  pages.forEach(p => {
    if (!p.title) {
      summary.missingTitles++
      issues.push(createIssue('onpage', 'HIGH', 'Missing title tag', `Page: ${p.url}`, 'Add a descriptive title tag.'))
    } else if (p.title.length < 20) {
      summary.shortTitles++
      issues.push(createIssue('onpage', 'MEDIUM', 'Very short title tag', `"${p.title}" on ${p.url} is only ${p.title.length} characters.`, 'Expand the title to be more descriptive.'))
    } else if (p.title.length > 65) {
      summary.longTitles++
      issues.push(createIssue('onpage', 'LOW', 'Long title tag', `"${p.title}" on ${p.url} is ${p.title.length} characters.`, 'Consider shortening to prevent truncation in search results.'))
    }
  })

  findDuplicates(pages.map(p => p.title).filter(Boolean)).forEach(([title, count]) => {
    summary.duplicateTitles += count
    issues.push(createIssue('onpage', 'HIGH', 'Duplicate title tag', `"${title}" appears on ${count} pages.`, 'Each page should have a unique, descriptive title.'))
  })

  // ── Meta Descriptions ──
  pages.forEach(p => {
    if (!p.metaDescription) {
      summary.missingDescriptions++
      issues.push(createIssue('onpage', 'HIGH', 'Missing meta description', `Page: ${p.url}`, 'Add a compelling meta description.'))
    } else if (p.metaDescription.length < 50) {
      summary.shortDescriptions++
      issues.push(createIssue('onpage', 'MEDIUM', 'Short meta description', `Page: ${p.url} — ${p.metaDescription.length} characters.`, 'Expand to 120-160 characters for better search snippets.'))
    }
  })

  findDuplicates(pages.map(p => p.metaDescription).filter(Boolean)).forEach(([desc, count]) => {
    summary.duplicateDescriptions += count
    issues.push(createIssue('onpage', 'MEDIUM', 'Duplicate meta description', `Same description on ${count} pages.`, 'Write unique meta descriptions for each page.'))
  })

  // ── H1 ──
  pages.forEach(p => {
    if (p.h1.length === 0) { summary.missingH1++; issues.push(createIssue('onpage', 'HIGH', 'Missing H1 tag', `Page: ${p.url}`, 'Add one clear H1 tag.')) }
    else if (p.h1.length > 1) { summary.multipleH1++; issues.push(createIssue('onpage', 'MEDIUM', 'Multiple H1 tags', `Page: ${p.url} has ${p.h1.length} H1 tags.`, 'Use only one H1 tag per page.')) }
  })

  // ── Images ──
  pages.forEach(p => {
    summary.totalImages += p.totalImages
    summary.imagesWithoutAlt += p.missingAltCount
    if (p.missingAltCount > 0) {
      issues.push(createIssue('onpage', p.missingAltCount > 5 ? 'HIGH' : 'MEDIUM', `${p.missingAltCount} image(s) missing ALT text`, `Page: ${p.url}`, 'Add descriptive ALT text to meaningful images.'))
    }
  })

  // ── Thin Content ──
  pages.forEach(p => {
    if (p.wordCount < 300) {
      summary.thinContentPages++
      issues.push(createIssue('content', 'MEDIUM', 'Thin content', `Page: ${p.url} has only ${p.wordCount} words.`, 'Consider expanding the content to provide more value.'))
    }
  })

  // ── Heading Hierarchy ──
  pages.forEach(p => {
    if (p.h2.length === 0 && p.wordCount > 300) {
      issues.push(createIssue('onpage', 'LOW', 'No subheadings (H2)', `Page: ${p.url} has no H2 tags.`, 'Use H2 tags to organize content into readable sections.'))
    }
  })

  // ── Keyword Usage ──
  if (targetKeyword) {
    pages.forEach(p => {
      const kwLower = targetKeyword.toLowerCase()
      const inTitle = p.title.toLowerCase().includes(kwLower)
      const inH1 = p.h1.some(h => h.toLowerCase().includes(kwLower))
      const { count, density } = keywordFrequency(p.bodyText, targetKeyword)

      if (!inTitle) issues.push(createIssue('onpage', 'MEDIUM', 'Target keyword missing from title', `"${targetKeyword}" not in title of ${p.url}.`, 'Include the target keyword naturally in the title tag.'))
      if (!inH1) issues.push(createIssue('onpage', 'MEDIUM', 'Target keyword missing from H1', `"${targetKeyword}" not in H1 of ${p.url}.`, 'Include the target keyword in the H1 heading.'))
      if (density > 3) issues.push(createIssue('onpage', 'MEDIUM', 'Potential keyword overuse', `"${targetKeyword}" appears ${count} times (${density}%) on ${p.url}.`, 'Use the keyword naturally. Focus on search intent over density.'))
    })
  }

  return { issues, summary }
}
