import fs from 'fs'

const content = fs.readFileSync('c:/tools/client/src/tools/blog-topic-generator/BlogTopicGeneratorPage.jsx', 'utf8')
const lines = content.split('\n')

lines.forEach((line, idx) => {
  if (line.includes('button') || line.includes('bg-blue') || line.includes('blue-600') || line.includes('blue-500')) {
    if (line.includes('bg-blue') || line.includes('bg-gradient-to-r from-blue') || (line.includes('button') && line.includes('blue'))) {
      console.log(`${idx + 1}: ${line.trim()}`)
    }
  }
})
