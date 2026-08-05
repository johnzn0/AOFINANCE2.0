import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
          cleanupOutdatedCaches: true
        },
        manifest: {
          short_name: "AO FINANCE",
          name: "AO FINANCE - Gestão Financeira Inteligente",
          description: "Sistema completo de Gestão Financeira Pessoal com Relatórios, Investimentos e Controle de Contas",
          id: "/",
          lang: "pt-BR",
          start_url: "/",
          scope: "/",
          display: "standalone",
          display_override: ["standalone", "minimal-ui", "window-controls-overlay"],
          orientation: "portrait-primary",
          background_color: "#020617",
          theme_color: "#020617",
          categories: ["finance", "productivity"],
          prefer_related_applications: false,
          icons: [
            {
              src: "/icons/icon-192.png?v=2",
              type: "image/png",
              sizes: "192x192",
              purpose: "any"
            },
            {
              src: "/icons/icon-512.png?v=2",
              type: "image/png",
              sizes: "512x512",
              purpose: "any"
            },
            {
              src: "/icons/icon-maskable-192.png?v=2",
              type: "image/png",
              sizes: "192x192",
              purpose: "maskable"
            },
            {
              src: "/icons/icon-maskable-512.png?v=2",
              type: "image/png",
              sizes: "512x512",
              purpose: "maskable"
            }
          ],
          shortcuts: [
            {
              name: "Visão Geral",
              short_name: "Resumo",
              description: "Acessar o resumo financeiro",
              url: "/",
              icons: [{ src: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" }]
            }
          ]
        }
      })
    ],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        process.env.VITE_SUPABASE_URL || 'https://juavorsfoscbtxsiudvv.supabase.co'
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.VITE_SUPABASE_ANON_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YXZvcnNmb3NjYnR4c2l1ZHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjY0NDgsImV4cCI6MjA5OTAwMjQ0OH0.cYOO5gIrwgp5pbC1zJZYn-GQ3IKjDuxE-H8ky1f4iOs'
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
