/**
 * AI-powered SVG Logo Generator
 * Generates unique, professional SVG logos where the AI creates actual graphic shapes and paths
 */

import { callAI } from '../utils/aiProvider.js'

/**
 * Generate a complete logo using AI
 * The AI creates the actual SVG graphic elements, not just basic shapes
 */
export async function generateLogo({
  brandName,
  description = '',
  industry,
  style = 'modern',
  primaryColor,
  secondaryColor,
  preferredProvider,
}) {
  // Use AI to generate the complete SVG logo design
  const svg = await generateSVGWithAI({
    brandName,
    description,
    industry,
    style,
    primaryColor,
    secondaryColor,
    preferredProvider,
  })

  return {
    svg,
    brandName,
    industry,
    style,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Have AI generate the actual SVG logo with unique graphic elements
 */
async function generateSVGWithAI({
  brandName,
  description,
  industry,
  style,
  primaryColor,
  secondaryColor,
  preferredProvider,
}) {
  // Use custom colors if provided, otherwise use industry-based palettes
  const industryPalettes = {
    tech: {
      modern: { primary: '#0C81F3', secondary: '#67A7FF', accent: '#2563EB', bg: '#EFF6FF' },
      classic: { primary: '#1E40AF', secondary: '#3B82F6', accent: '#60A5FA', bg: '#EFF6FF' },
      playful: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD', bg: '#FAF5FF' },
      bold: { primary: '#1E3A8A', secondary: '#1D4ED8', accent: '#3B82F6', bg: '#EFF6FF' },
      minimal: { primary: '#0C81F3', secondary: '#93C5FD', accent: '#BFDBFE', bg: '#F8FAFC' },
      luxury: { primary: '#1E3A8A', secondary: '#4338CA', accent: '#6366F1', bg: '#FAFAFA' },
    },
    food: {
      modern: { primary: '#EA580C', secondary: '#FB923C', accent: '#FDBA74', bg: '#FFF7ED' },
      classic: { primary: '#C2410C', secondary: '#EA580C', accent: '#F97316', bg: '#FFF7ED' },
      playful: { primary: '#F97316', secondary: '#FDBA74', accent: '#FED7AA', bg: '#FFFBEB' },
      bold: { primary: '#9A3412', secondary: '#C2410C', accent: '#EA580C', bg: '#FFF7ED' },
      minimal: { primary: '#EA580C', secondary: '#FED7AA', accent: '#FFEDD5', bg: '#FFFBEB' },
      luxury: { primary: '#9A3412', secondary: '#B45309', accent: '#D97706', bg: '#FFFBEB' },
    },
    health: {
      modern: { primary: '#16A34A', secondary: '#22C55E', accent: '#86EFAC', bg: '#F0FDF4' },
      classic: { primary: '#15803D', secondary: '#16A34A', accent: '#22C55E', bg: '#F0FDF4' },
      playful: { primary: '#22C55E', secondary: '#4ADE80', accent: '#86EFAC', bg: '#F0FDF4' },
      bold: { primary: '#14532D', secondary: '#15803D', accent: '#16A34A', bg: '#F0FDF4' },
      minimal: { primary: '#16A34A', secondary: '#BBF7D0', accent: '#DCFCE7', bg: '#F0FDF4' },
      luxury: { primary: '#14532D', secondary: '#166534', accent: '#15803D', bg: '#F0FDF4' },
    },
    fashion: {
      modern: { primary: '#DB2777', secondary: '#EC4899', accent: '#F472B6', bg: '#FDF2F8' },
      classic: { primary: '#BE185D', secondary: '#DB2777', accent: '#EC4899', bg: '#FDF2F8' },
      playful: { primary: '#EC4899', secondary: '#F472B6', accent: '#FBCFE8', bg: '#FDF2F8' },
      bold: { primary: '#9D174D', secondary: '#BE185D', accent: '#DB2777', bg: '#FDF2F8' },
      minimal: { primary: '#DB2777', secondary: '#F9A8D4', accent: '#FCE7F3', bg: '#FDF2F8' },
      luxury: { primary: '#9D174D', secondary: '#BE185D', accent: '#DB2777', bg: '#FDF2F8' },
    },
    finance: {
      modern: { primary: '#1E40AF', secondary: '#3B82F6', accent: '#60A5FA', bg: '#EFF6FF' },
      classic: { primary: '#1E3A8A', secondary: '#1E40AF', accent: '#3B82F6', bg: '#EFF6FF' },
      playful: { primary: '#2563EB', secondary: '#3B82F6', accent: '#93C5FD', bg: '#EFF6FF' },
      bold: { primary: '#1E3A8A', secondary: '#1E40AF', accent: '#2563EB', bg: '#EFF6FF' },
      minimal: { primary: '#1E40AF', secondary: '#BFDBFE', accent: '#DBEAFE', bg: '#F8FAFC' },
      luxury: { primary: '#1E3A8A', secondary: '#312E81', accent: '#3730A3', bg: '#FAFAFA' },
    },
    education: {
      modern: { primary: '#7C3AED', secondary: '#8B5CF6', accent: '#A78BFA', bg: '#F5F3FF' },
      classic: { primary: '#6D28D9', secondary: '#7C3AED', accent: '#8B5CF6', bg: '#F5F3FF' },
      playful: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD', bg: '#F5F3FF' },
      bold: { primary: '#5B21B6', secondary: '#6D28D9', accent: '#7C3AED', bg: '#F5F3FF' },
      minimal: { primary: '#7C3AED', secondary: '#DDD6FE', accent: '#EDE9FE', bg: '#FAF5FF' },
      luxury: { primary: '#5B21B6', secondary: '#6D28D9', accent: '#7C3AED', bg: '#F5F3FF' },
    },
    realestate: {
      modern: { primary: '#059669', secondary: '#10B981', accent: '#34D399', bg: '#ECFDF5' },
      classic: { primary: '#047857', secondary: '#059669', accent: '#10B981', bg: '#ECFDF5' },
      playful: { primary: '#10B981', secondary: '#34D399', accent: '#6EE7B7', bg: '#ECFDF5' },
      bold: { primary: '#064E3B', secondary: '#047857', accent: '#059669', bg: '#ECFDF5' },
      minimal: { primary: '#059669', secondary: '#A7F3D0', accent: '#D1FAE5', bg: '#F0FDF4' },
      luxury: { primary: '#064E3B', secondary: '#065F46', accent: '#047857', bg: '#ECFDF5' },
    },
    creative: {
      modern: { primary: '#C026D3', secondary: '#D946EF', accent: '#E879F9', bg: '#FAF5FF' },
      classic: { primary: '#A21CAF', secondary: '#C026D3', accent: '#D946EF', bg: '#FAF5FF' },
      playful: { primary: '#D946EF', secondary: '#E879F9', accent: '#F0ABFC', bg: '#FAF5FF' },
      bold: { primary: '#86198F', secondary: '#A21CAF', accent: '#C026D3', bg: '#FAF5FF' },
      minimal: { primary: '#C026D3', secondary: '#F5D0FE', accent: '#FAE8FF', bg: '#FDF2F8' },
      luxury: { primary: '#86198F', secondary: '#A21CAF', accent: '#C026D3', bg: '#FAF5FF' },
    },
    retail: {
      modern: { primary: '#EA580C', secondary: '#F97316', accent: '#FB923C', bg: '#FFF7ED' },
      classic: { primary: '#C2410C', secondary: '#EA580C', accent: '#F97316', bg: '#FFF7ED' },
      playful: { primary: '#F97316', secondary: '#FB923C', accent: '#FDBA74', bg: '#FFFBEB' },
      bold: { primary: '#9A3412', secondary: '#C2410C', accent: '#EA580C', bg: '#FFF7ED' },
      minimal: { primary: '#EA580C', secondary: '#FED7AA', accent: '#FFEDD5', bg: '#FFFBEB' },
      luxury: { primary: '#9A3412', secondary: '#B45309', accent: '#D97706', bg: '#FFFBEB' },
    },
    fitness: {
      modern: { primary: '#DC2626', secondary: '#EF4444', accent: '#F87171', bg: '#FEF2F2' },
      classic: { primary: '#B91C1C', secondary: '#DC2626', accent: '#EF4444', bg: '#FEF2F2' },
      playful: { primary: '#EF4444', secondary: '#F87171', accent: '#FCA5A5', bg: '#FEF2F2' },
      bold: { primary: '#991B1B', secondary: '#B91C1C', accent: '#DC2626', bg: '#FEF2F2' },
      minimal: { primary: '#DC2626', secondary: '#FECACA', accent: '#FEE2E2', bg: '#FEF2F2' },
      luxury: { primary: '#991B1B', secondary: '#B91C1C', accent: '#DC2626', bg: '#FEF2F2' },
    },
  }

  const palettes = industryPalettes[industry] || industryPalettes.tech
  const styleColors = palettes[style] || palettes.modern

  // Use custom colors if provided, otherwise use industry/style colors
  const primary = primaryColor || styleColors.primary
  const secondary = secondaryColor || styleColors.secondary
  const accent = styleColors.accent
  const bg = styleColors.bg

  // Use AI to generate unique SVG graphic elements
  const graphicElement = await generateAIGraphicElement({
    brandName,
    description,
    industry,
    style,
    primary,
    secondary,
    accent,
    preferredProvider,
  })

  // Get font settings based on style
  const fontSettings = getFontSettings(style, brandName)

  // Build the complete logo SVG
  return buildLogoSVG({
    brandName,
    graphicElement,
    colors: { primary, secondary, accent, bg },
    fontSettings,
    style,
  })
}

/**
 * Have AI generate unique SVG path data for graphic elements
 */
async function generateAIGraphicElement({
  brandName,
  description,
  industry,
  style,
  primary,
  secondary,
  accent,
  preferredProvider,
}) {
  // Different approaches based on style
  const styleApproach = {
    modern: `Create a clean, contemporary geometric symbol. Use abstract shapes, minimal lines, or modern iconography that represents ${industry}.`,
    classic: `Create a timeless, elegant symbol with traditional design elements. Use refined shapes that convey heritage and professionalism.`,
    playful: `Create a fun, energetic symbol with dynamic shapes. Use curves, dots, or friendly geometric forms.`,
    bold: `Create a strong, impactful symbol with thick shapes and high contrast. Make it stand out.`,
    minimal: `Create an ultra-simple, refined symbol with just essential elements. Less is more.`,
    luxury: `Create an elegant, premium symbol with sophisticated shapes. Use refined curves and premium feel.`,
  }

  const prompt = `${styleApproach[style] || styleApproach.modern}

Brand: ${brandName}
${description ? `Description: ${description}` : ''}
Industry: ${industry}

Generate SVG path data for this logo symbol. Return ONLY valid JSON with this exact structure:
{
  "type": "abstract|initials|geometric|text|symbol",
  "paths": ["SVG path commands as strings"],
  "circles": [{"cx": 50, "cy": 50, "r": 30, "fill": "color or gradient"}],
  "rects": [{"x": 0, "y": 0, "width": 100, "height": 100, "rx": 10, "fill": "color"}],
  "gradients": [{"id": "grad1", "stops": [{"offset": "0%", "color": "#color"}, {"offset": "100%", "color": "#color"}]}],
  "symbolSize": 80,
  "description": "brief description of what this symbol represents"
}

Rules:
- Keep SVG coordinates within 0-200 viewBox
- Use the provided colors (primary: ${primary}, secondary: ${secondary}, accent: ${accent})
- Make it unique to ${brandName} - not a generic icon
- SVG paths should use absolute coordinates
- If using gradients, reference them by id in fills
- Make it visually interesting and professional`

  try {
    const messages = [
      { role: 'system', content: 'You are an expert SVG logo designer. Generate unique, professional SVG path data for logo symbols.' },
      { role: 'user', content: prompt },
    ]

    const result = await callAI(messages, {
      preferredProvider,
      temperature: 0.85,
      maxTokens: 2000,
    })

    // Parse the AI response
    let parsed = null
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch {
      // If parsing fails, use fallback
    }

    if (parsed && parsed.paths) {
      return parsed
    }
  } catch (err) {
    console.log('AI graphic generation failed, using fallback:', err.message)
  }

  // Fallback: generate unique abstract shapes based on brand name
  return generateFallbackGraphic(brandName, primary, secondary, accent, style)
}

/**
 * Generate fallback unique graphic based on brand name hash
 */
function generateFallbackGraphic(brandName, primary, secondary, accent, style) {
  // Create deterministic "random" values from brand name
  let hash = 0
  for (let i = 0; i < brandName.length; i++) {
    hash = ((hash << 5) - hash) + brandName.charCodeAt(i)
    hash = hash & hash
  }

  const absHash = Math.abs(hash)
  const pattern = absHash % 6

  const gradients = [
    {
      id: 'gradMain',
      stops: [
        { offset: '0%', color: primary },
        { offset: '100%', color: secondary },
      ],
    },
  ]

  switch (pattern) {
    case 0: // Interconnected circles
      return {
        type: 'abstract',
        circles: [
          { cx: 50, cy: 50, r: 35, fill: 'url(#gradMain)' },
          { cx: 65, cy: 65, r: 25, fill: secondary, opacity: 0.7 },
          { cx: 35, cy: 65, r: 15, fill: accent, opacity: 0.8 },
        ],
        rects: [],
        paths: [
          `M 50 15 L 85 50 L 50 85 L 15 50 Z`,
        ],
        gradients,
        symbolSize: 100,
        description: 'Connected geometric pattern',
      }

    case 1: // Layered arcs
      return {
        type: 'abstract',
        circles: [],
        rects: [],
        paths: [
          `M 50 10 A 40 40 0 0 1 90 50`,
          `M 50 20 A 30 30 0 0 1 80 50`,
          `M 50 30 A 20 20 0 0 1 70 50`,
        ],
        gradients,
        symbolSize: 100,
        description: 'Layered arc composition',
      }

    case 2: // Hexagonal pattern
      return {
        type: 'geometric',
        circles: [],
        rects: [],
        paths: [
          `M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 30 Z`,
          `M 50 25 L 70 37 L 70 63 L 50 75 L 30 63 L 30 37 Z`,
        ],
        gradients,
        symbolSize: 100,
        description: 'Hexagonal layers',
      }

    case 3: // Dot constellation
      return {
        type: 'abstract',
        circles: [
          { cx: 50, cy: 30, r: 12, fill: 'url(#gradMain)' },
          { cx: 75, cy: 45, r: 8, fill: secondary },
          { cx: 65, cy: 70, r: 10, fill: primary },
          { cx: 35, cy: 55, r: 6, fill: accent },
          { cx: 25, cy: 75, r: 5, fill: secondary },
        ],
        rects: [],
        paths: [
          `M 50 30 L 75 45`,
          `M 75 45 L 65 70`,
          `M 65 70 L 35 55`,
        ],
        gradients,
        symbolSize: 100,
        description: 'Connected dots constellation',
      }

    case 4: // Modern slash
      return {
        type: 'geometric',
        circles: [],
        rects: [
          { x: 30, y: 15, width: 12, height: 70, rx: 6, fill: 'url(#gradMain)' },
          { x: 58, y: 15, width: 12, height: 70, rx: 6, fill: secondary },
        ],
        paths: [],
        gradients,
        symbolSize: 100,
        description: 'Modern parallel bars',
      }

    default: // Abstract wave
      return {
        type: 'abstract',
        circles: [],
        rects: [],
        paths: [
          `M 10 50 Q 30 20 50 50 Q 70 80 90 50`,
          `M 10 60 Q 30 35 50 60 Q 70 85 90 60`,
          `M 10 70 Q 30 50 50 70 Q 70 90 90 70`,
        ],
        gradients,
        symbolSize: 100,
        description: 'Abstract wave pattern',
      }
  }
}

/**
 * Get font settings based on style
 */
function getFontSettings(style, brandName) {
  const length = brandName.length

  const settings = {
    modern: {
      family: 'system-ui, -apple-system, sans-serif',
      weight: length > 10 ? 700 : 800,
      size: length > 12 ? 28 : length > 8 ? 36 : 44,
      tracking: 0.05,
      transform: 'none',
    },
    classic: {
      family: 'Georgia, "Times New Roman", serif',
      weight: 600,
      size: length > 12 ? 26 : length > 8 ? 34 : 40,
      tracking: 0.02,
      transform: 'none',
    },
    playful: {
      family: '"Segoe UI", system-ui, sans-serif',
      weight: 600,
      size: length > 12 ? 28 : length > 8 ? 36 : 42,
      tracking: 0.03,
      transform: 'none',
    },
    bold: {
      family: 'system-ui, -apple-system, sans-serif',
      weight: 900,
      size: length > 12 ? 30 : length > 8 ? 38 : 46,
      tracking: 0.08,
      transform: 'uppercase',
    },
    minimal: {
      family: 'system-ui, -apple-system, sans-serif',
      weight: 300,
      size: length > 12 ? 28 : length > 8 ? 36 : 44,
      tracking: 0.1,
      transform: 'uppercase',
    },
    luxury: {
      family: 'Georgia, "Times New Roman", serif',
      weight: 500,
      size: length > 12 ? 28 : length > 8 ? 36 : 42,
      tracking: 0.15,
      transform: 'none',
    },
  }

  return settings[style] || settings.modern
}

/**
 * Build the complete logo SVG
 */
function buildLogoSVG({ brandName, graphicElement, colors, fontSettings, style }) {
  const { primary, secondary, accent, bg } = colors
  const { family, weight, size, tracking, transform } = fontSettings

  const symbolSize = graphicElement.symbolSize || 80
  const padding = 40
  const gap = 24
  const brandNameY = 130
  const brandNameX = symbolSize + padding + gap

  // Build gradient definitions
  let defs = `<defs>
    <linearGradient id="gradMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${secondary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="${primary}" flood-opacity="0.15"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>`

  // Build graphic element SVG
  let graphicSVG = ''

  // Circles
  if (graphicElement.circles) {
    graphicElement.circles.forEach((c) => {
      const fill = c.fill && c.fill.startsWith('url(#')
        ? c.fill
        : c.fill === 'secondary'
        ? 'url(#gradAccent)'
        : c.fill === 'accent'
        ? accent
        : c.fill || primary
      const opacity = c.opacity !== undefined ? ` opacity="${c.opacity}"` : ''
      const filter = style === 'modern' || style === 'luxury' ? ' filter="url(#shadow)"' : ''
      graphicSVG += `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${fill}"${opacity}${filter}/>`
    })
  }

  // Rects
  if (graphicElement.rects) {
    graphicElement.rects.forEach((r) => {
      const fill = r.fill && r.fill.startsWith('url(#') ? r.fill : r.fill === 'secondary' ? 'url(#gradAccent)' : r.fill || primary
      const rx = r.rx !== undefined ? ` rx="${r.rx}"` : ''
      graphicSVG += `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"${rx} fill="${fill}"/>`
    })
  }

  // Paths
  if (graphicElement.paths) {
    graphicElement.paths.forEach((p, i) => {
      const fill = i === 0 ? 'url(#gradMain)' : i === 1 ? secondary : accent
      const stroke = style === 'bold' ? 'none' : fill
      const strokeWidth = style === 'bold' ? 0 : style === 'classic' ? 2 : 3
      const filter = style === 'modern' ? ' filter="url(#shadow)"' : ''
      graphicSVG += `<path d="${p}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${filter}/>`
    })
  }

  // Center the graphic
  const graphicCenterX = 50
  const graphicCenterY = 50
  const graphicTranslate = `translate(${graphicCenterX - 50}, ${graphicCenterY - 50})`

  // Build text
  const displayName = transform === 'uppercase' ? brandName.toUpperCase() : brandName
  const textX = brandNameX
  const textAnchor = 'start'
  const textStyle = style === 'luxury' ? ` font-style: italic;` : ''

  // Accent line for modern style
  const accentLine = style === 'modern' ? `<rect x="${textX}" y="${brandNameY + 8}" width="${Math.min(displayName.length * size * 0.5, 120)}" height="3" rx="1.5" fill="url(#gradAccent)"/>` : ''

  // Text shadow for bold style
  const textShadow = style === 'bold' ? ` filter="url(#shadow)"` : ''

  const textSVG = `
    <text x="${textX}" y="${brandNameY}"
          font-family="${family}"
          font-size="${size}"
          font-weight="${weight}"
          fill="${primary}"
          letter-spacing="${tracking}"
          text-anchor="${textAnchor}"
          ${textShadow}
          style="${textStyle}">${escapeXml(displayName)}</text>
    ${accentLine}
  `

  // Calculate total width
  const textWidthEstimate = displayName.length * size * 0.6 + brandNameX
  const totalWidth = Math.max(textWidthEstimate + padding, 350)
  const totalHeight = 160

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  <!-- Background -->
  <rect width="${totalWidth}" height="${totalHeight}" fill="${bg}" rx="16"/>

  ${defs}

  <!-- Logo Graphic -->
  <g transform="translate(${padding}, ${(totalHeight - symbolSize) / 2})">
    <g transform="${graphicTranslate}">
      ${graphicSVG}
    </g>
  </g>

  <!-- Brand Name -->
  <g transform="translate(0, ${(totalHeight - 160) / 2})">
    ${textSVG}
  </g>
</svg>`

  return svg
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generate multiple logo variations with different styles and color schemes
 */
export async function generateLogoVariations({
  brandName,
  description,
  industry,
  count = 4,
  preferredProvider,
}) {
  const styles = ['modern', 'classic', 'playful', 'bold', 'minimal', 'luxury']
  const selectedStyles = styles.slice(0, count)

  // 6 color palettes to choose from
  const allColorPalettes = [
    { name: 'Ocean Blue', primary: '#0C81F3', secondary: '#67A7FF', accent: '#2563EB', bg: '#EFF6FF' },
    { name: 'Sunset Coral', primary: '#EA580C', secondary: '#FB923C', accent: '#FDBA74', bg: '#FFF7ED' },
    { name: 'Forest Green', primary: '#16A34A', secondary: '#22C55E', accent: '#4ADE80', bg: '#F0FDF4' },
    { name: 'Royal Purple', primary: '#7C3AED', secondary: '#8B5CF6', accent: '#A78BFA', bg: '#F5F3FF' },
    { name: 'Rose Pink', primary: '#DB2777', secondary: '#EC4899', accent: '#F472B6', bg: '#FDF2F8' },
    { name: 'Midnight', primary: '#1E293B', secondary: '#334155', accent: '#475569', bg: '#F8FAFC' },
  ]

  // Map each style to a different color palette
  const styleToPalette = {
    modern: 0,     // Ocean Blue
    classic: 1,    // Sunset Coral
    playful: 2,    // Forest Green
    bold: 3,       // Royal Purple
    minimal: 4,     // Rose Pink
    luxury: 5,     // Midnight
  }

  const variations = []

  for (let i = 0; i < selectedStyles.length; i++) {
    const style = selectedStyles[i]
    const paletteIdx = styleToPalette[style] ?? i
    const colors = allColorPalettes[paletteIdx]

    // Get the graphic element with these specific colors
    const graphicElement = await generateAIGraphicElement({
      brandName,
      description,
      industry,
      style,
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      preferredProvider,
    })

    const fontSettings = getFontSettings(style, brandName)

    const svg = buildLogoSVG({
      brandName,
      graphicElement,
      colors,
      fontSettings,
      style,
    })

    variations.push({
      id: variations.length + 1,
      style,
      colorPalette: colors.name,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      svg,
    })
  }

  return {
    variations,
    brandName,
    industry,
    colorPalettes: allColorPalettes,
    generatedAt: new Date().toISOString(),
  }
}
