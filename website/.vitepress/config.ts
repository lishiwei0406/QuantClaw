import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'QuantClaw',
  description: 'High-performance C++17 implementation of OpenClaw - AI agent framework with persistent memory, browser control, and plugin ecosystem',

  // GitHub Pages configuration
  // Deployed under quantclaw.github.io/QuantClaw/ (main repo Pages)
  base: '/QuantClaw/',
  lang: 'en-US',
  cleanUrls: true,

  // Site metadata
  head: [
    ['meta', { name: 'theme-color', content: '#2d3748' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:image', content: '/logo.png' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    // Logo and branding
    logo: '/logo.svg',

    // Navigation bar
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Features', link: '/guide/features' },
      { text: 'Architecture', link: '/guide/architecture' },
      { text: 'Plugins', link: '/guide/plugins' },
      { text: 'Documentation', link: '/guide/documentation' },
      { text: 'GitHub', link: 'https://github.com/QuantClaw/quantclaw' },
    ],

    // Sidebar
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Quick Start', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Core Features', link: '/guide/features' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'CLI Reference', link: '/guide/cli-reference' },
          ],
        },
        {
          text: 'Development',
          items: [
            { text: 'Plugin Development', link: '/guide/plugins' },
            { text: 'Building from Source', link: '/guide/building' },
            { text: 'Contributing', link: '/guide/contributing' },
          ],
        },
      ],
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/QuantClaw/quantclaw' },
      { icon: 'discord', link: '#' },
      { icon: 'twitter', link: 'https://twitter.com' },
    ],

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 QuantClaw Contributors',
    },

    // Search
    search: {
      provider: 'local',
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/QuantClaw/quantclaw/edit/main/website/:path',
      text: 'Edit this page',
    },
  },

  markdown: {
    lineNumbers: false,
  },
})
