// Turns an uploaded deck, PDF, Word or text file into plain text in the browser (no file reaches
// the server). pdf.js and JSZip load from cdnjs on first use.

const loadLib = (src) =>
  new Promise((ok, no) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok()
    const el = document.createElement('script')
    el.src = src
    el.onload = ok
    el.onerror = () => no(new Error('lib'))
    document.head.append(el)
  })

const xmlText = (xml) =>
  xml
    .replace(/<a:tab\/>/g, '\t')
    .replace(/<\/a:p>|<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

async function extract(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (file.size > 15 * 1024 * 1024)
    throw new Error('That file is over 15 MB. Export a smaller version or paste the text instead.')
  if (['txt', 'md', 'csv'].includes(ext)) return { text: await file.text(), meta: 'text' }
  if (ext === 'pdf') {
    await loadLib('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
    const lib = window.pdfjsLib
    lib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise
    const parts = []
    const n = Math.min(pdf.numPages, 150)
    for (let i = 1; i <= n; i++) {
      const tc = await (await pdf.getPage(i)).getTextContent()
      parts.push(
        `--- Page ${i} ---\n` +
          tc.items
            .map((t) => t.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
      )
    }
    const text = parts.join('\n\n')
    if (text.replace(/--- Page \d+ ---/g, '').trim().length < 50)
      throw new Error(
        'This PDF has no readable text (it may be scanned images). Export it with text, or paste the text instead.'
      )
    return { text, meta: `${pdf.numPages} pages` }
  }
  if (ext === 'pptx' || ext === 'docx') {
    await loadLib('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js')
    const zip = await window.JSZip.loadAsync(await file.arrayBuffer())
    if (ext === 'docx') {
      const x = zip.file('word/document.xml')
      if (!x) throw new Error('That Word file could not be read.')
      const text = xmlText(await x.async('string'))
      return { text, meta: `${text.split(/\s+/).length} words` }
    }
    const slides = Object.keys(zip.files)
      .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
      .sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0])
    if (!slides.length) throw new Error('No slides were found in that file.')
    const parts = []
    for (const k of slides) {
      const n = k.match(/\d+/)[0]
      const body = xmlText(await zip.file(k).async('string'))
      const notes = zip.file(`ppt/notesSlides/notesSlide${n}.xml`)
      const nt = notes
        ? xmlText(await notes.async('string'))
            .replace(/^\d+$/m, '')
            .trim()
        : ''
      parts.push(`--- Slide ${n} ---\n${body}${nt ? `\n[Speaker notes] ${nt}` : ''}`)
    }
    return { text: parts.join('\n\n'), meta: `${slides.length} slides` }
  }
  throw new Error('Use a PDF, PowerPoint (.pptx), Word (.docx) or text file.')
}

// Returns { name, text, meta } or throws an Error with a message for the visitor.
export async function readSourceFile(file) {
  try {
    const r = await extract(file)
    return {
      name: file.name,
      text: r.text.slice(0, 120000),
      meta: r.meta + (r.text.length > 60000 ? ', first part used' : ''),
    }
  } catch (err) {
    if (err?.message === 'lib')
      throw new Error(
        'The file reader could not load. Check your connection and try again, or paste the text instead.',
        { cause: err }
      )
    throw err
  }
}
