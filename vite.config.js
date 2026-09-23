import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // GDACS (Global Disaster Alert and Coordination System) does not send
      // CORS headers, so cyclone data is fetched through these dev proxies
      // instead of hitting gdacs.org directly from the browser. In
      // production (Vercel) the same paths are served by the serverless
      // functions in /api instead — see api/cyclone.js and
      // api/cyclone-track.js.
      "/api/cyclone-track": {
        target: "https://www.gdacs.org",
        changeOrigin: true,
        rewrite: (path) => path.replace("/api/cyclone-track", "/gdacsapi/api/polygons/getgeometry"),
      },
      "/api/cyclone": {
        target: "https://www.gdacs.org",
        changeOrigin: true,
        rewrite: () => "/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC",
      },
    },
  },
})
