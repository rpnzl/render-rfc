import './style.css'
import { marked, Renderer, type Tokens } from 'marked'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'neutral' })

const app = document.querySelector<HTMLDivElement>('#app')!

const renderer = new Renderer()
const originalCodeRenderer = renderer.code.bind(renderer)

renderer.code = function (token: Tokens.Code) {
  if (token.lang === 'mermaid') {
    return `<div class="mermaid">${token.text}</div>`
  }
  return originalCodeRenderer(token)
}

marked.setOptions({ renderer })

async function renderApp(content: string | null = null) {
  if (content) {
    const html = await marked.parse(content)
    app.innerHTML = `
      <article class="prose prose-sm prose-slate prose-tight max-w-none p-8 lg:p-12 print:p-0">
        ${html}
      </article>
      <button
        class="print-hidden fixed bottom-6 right-6 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-slate-700 transition-colors"
        id="reset-btn"
      >
        Drop another file
      </button>
    `

    // Set document title from first H1
    const h1 = app.querySelector('h1')
    if (h1) {
      document.title = h1.textContent!
    }

    // Render mermaid diagrams
    await mermaid.run({ querySelector: '.mermaid' })

    document.getElementById('reset-btn')!.addEventListener('click', () => {
      document.title = 'Markdown Renderer'
      renderApp()
    })
  } else {
    app.innerHTML = `
      <div
        id="drop-zone"
        class="drop-zone min-h-screen flex items-center justify-center p-8"
      >
        <div
          class="border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center max-w-lg w-full transition-colors hover:border-slate-400"
        >
          <div class="text-6xl mb-4">📄</div>
          <h1 class="text-2xl font-semibold text-slate-700 mb-2">Drop a Markdown file</h1>
          <p class="text-slate-500">Drag and drop a .md file here to render it for printing</p>
          <input
            type="file"
            id="file-input"
            accept=".md,.markdown,text/markdown"
            class="hidden"
          />
          <button
            id="browse-btn"
            class="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Or click to browse
          </button>
        </div>
      </div>
    `
    setupDropZone()
  }
}

function setupDropZone() {
  const dropZone = document.getElementById('drop-zone')!
  const fileInput = document.getElementById('file-input') as HTMLInputElement
  const browseBtn = document.getElementById('browse-btn')!
  const dropArea = dropZone.querySelector('div')!

  browseBtn.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    if (target.files?.[0]) {
      handleFile(target.files[0])
    }
  })

  ;['dragenter', 'dragover'].forEach(event => {
    dropZone.addEventListener(event, (e) => {
      e.preventDefault()
      dropArea.classList.add('border-slate-500', 'bg-slate-50')
    })
  })

  ;['dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, (e) => {
      e.preventDefault()
      dropArea.classList.remove('border-slate-500', 'bg-slate-50')
    })
  })

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault()
    const file = (e as DragEvent).dataTransfer?.files[0]
    if (file) {
      handleFile(file)
    }
  })
}

function handleFile(file: File) {
  if (!file.name.match(/\.(md|markdown)$/i)) {
    alert('Please drop a Markdown file (.md or .markdown)')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    renderApp(e.target!.result as string)
  }
  reader.readAsText(file)
}

renderApp()
