import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
// Con `--mode http` (usato dalla preview di Claude Code) il server parte in
// HTTP semplice: il certificato self-signed di basicSsl verrebbe rifiutato.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'http' ? [] : [basicSsl()])],
}))
