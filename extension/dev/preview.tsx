import './chromeMock'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SidePanel from '../src/pages/SidePanel'
import '../src/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="mx-auto max-w-[400px] border-x border-slate-200">
      <SidePanel />
    </div>
  </StrictMode>,
)
