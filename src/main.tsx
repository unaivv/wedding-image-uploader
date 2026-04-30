import { createRoot } from 'react-dom/client'
import './index.css'
import 'rsuite/dist/rsuite-no-reset.min.css';
import './rsuite-theme.css';
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />
)
