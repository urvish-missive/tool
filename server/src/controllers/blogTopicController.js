import { generateBlogTopics, generateTopicClusters, generateContentCalendar } from '../services/blogTopicGenerator.js'
import prisma from '../utils/prisma.js'

/**
 * Handler for generating blog topics
 * POST /api/blog-topics/generate
 */
export async function generateTopicsHandler(req, res) {
  try {
    const {
      niche,
      targetKeywords,
      audience,
      contentGoal,
      preferredProvider,
      count = 10,
      contentType,
    } = req.body

    // Validation
    if (!niche || typeof niche !== 'string' || niche.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid niche (at least 2 characters).',
      })
    }

    const parsedKeywords = targetKeywords
      ? Array.isArray(targetKeywords)
        ? targetKeywords
        : targetKeywords.split(',').map(k => k.trim()).filter(Boolean)
      : []

    if (parsedKeywords.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Please limit keywords to 20 or fewer.',
      })
    }

    const topicCount = Math.min(Math.max(parseInt(count) || 10, 1), 20)

    // Generate topics
    const result = await generateBlogTopics({
      niche: niche.trim(),
      targetKeywords: parsedKeywords,
      audience: audience?.trim() || '',
      contentGoal: contentGoal || 'educational',
      preferredProvider,
      count: topicCount,
      contentType: contentType || 'blog post',
    })

    // Save to database
    let savedId = null
    try {
      const saved = await prisma.blogTopic.create({
        data: {
          niche: niche.trim(),
          targetKeywords: parsedKeywords.length ? JSON.stringify(parsedKeywords) : null,
          audience: audience?.trim() || null,
          contentGoal: contentGoal || 'educational',
          contentType: contentType || 'blog post',
          topicsJson: JSON.stringify(result.topics),
          strategy: result.strategy,
        },
      })
      savedId = saved.id
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    res.json({
      success: true,
      topicsId: savedId,
      pillarTopic: result.pillarTopic,
      clusters: result.clusters,
      topics: result.topics,
      strategy: result.strategy,
      generatedAt: result.generatedAt,
      inputParams: result.inputParams,
    })
  } catch (err) {
    console.error('Blog topic generation error:', err.message)
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate topics. Please try again.',
    })
  }
}

/**
 * Handler for generating topic clusters
 * POST /api/blog-topics/clusters
 */
export async function generateClustersHandler(req, res) {
  try {
    const {
      niche,
      mainKeyword,
      audience,
      preferredProvider,
      clusterCount = 5,
      topicsPerCluster = 4,
    } = req.body

    // Validation
    if (!niche || typeof niche !== 'string' || niche.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid niche.',
      })
    }

    if (!mainKeyword || typeof mainKeyword !== 'string' || mainKeyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a main keyword for the pillar page.',
      })
    }

    const parsedClusters = Math.min(Math.max(parseInt(clusterCount) || 5, 1), 10)
    const parsedTopicsPerCluster = Math.min(Math.max(parseInt(topicsPerCluster) || 4, 1), 10)

    const result = await generateTopicClusters({
      niche: niche.trim(),
      mainKeyword: mainKeyword.trim(),
      audience: audience?.trim() || '',
      preferredProvider,
      clusterCount: parsedClusters,
      topicsPerCluster: parsedTopicsPerCluster,
    })

    // Save to database
    let savedId = null
    try {
      const saved = await prisma.topicCluster.create({
        data: {
          niche: niche.trim(),
          mainKeyword: mainKeyword.trim(),
          audience: audience?.trim() || null,
          pillarPageJson: JSON.stringify(result.pillarPage),
          clustersJson: JSON.stringify(result.clusters),
          interlinkingStrategy: result.interlinkingStrategy || null,
        },
      })
      savedId = saved.id
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    res.json({
      success: true,
      clusterId: savedId,
      pillarPage: result.pillarPage,
      clusters: result.clusters,
      interlinkingStrategy: result.interlinkingStrategy,
    })
  } catch (err) {
    console.error('Topic cluster generation error:', err.message)
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate topic clusters. Please try again.',
    })
  }
}

/**
 * Handler for generating content calendar
 * POST /api/blog-topics/calendar
 */
export async function generateCalendarHandler(req, res) {
  try {
    const { topics, postsPerWeek = 2, startDate } = req.body

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of topics to schedule.',
      })
    }

    const calendar = generateContentCalendar(
      topics,
      Math.min(Math.max(parseInt(postsPerWeek) || 2, 1), 7),
      startDate || new Date().toISOString()
    )

    res.json({
      success: true,
      calendar: calendar.calendar,
      summary: calendar.summary,
    })
  } catch (err) {
    console.error('Calendar generation error:', err.message)
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate calendar. Please try again.',
    })
  }
}

/**
 * Get saved topics by ID
 * GET /api/blog-topics/:id
 */
export async function getTopicsHandler(req, res) {
  try {
    const { id } = req.params

    const saved = await prisma.blogTopic.findUnique({
      where: { id: parseInt(id) },
    })

    if (!saved) {
      return res.status(404).json({
        success: false,
        error: 'Topics not found.',
      })
    }

    res.json({
      success: true,
      topicsId: saved.id,
      niche: saved.niche,
      targetKeywords: saved.targetKeywords ? JSON.parse(saved.targetKeywords) : [],
      audience: saved.audience,
      contentGoal: saved.contentGoal,
      contentType: saved.contentType,
      topics: JSON.parse(saved.topicsJson),
      strategy: saved.strategy,
      createdAt: saved.createdAt,
    })
  } catch (err) {
    console.error('Get topics error:', err.message)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve topics.',
    })
  }
}