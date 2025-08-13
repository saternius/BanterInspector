import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Wraptor Inspector',
  tagline: 'Create VR Experiences in Real-Time',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://inspector.bantervr.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/docs',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'banter', // Usually your GitHub org/user name.
  projectName: 'unity-scene-inspector', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/saternius/BanterInspector/tree/main/docs/site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Wraptor Inspector',
      logo: {
        alt: 'Wraptor Inspector Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/tutorials/hello-vr-world',
          label: 'Tutorials',
          position: 'left',
        },
        {
          to: '/docs/entity-components/',
          label: 'Components',
          position: 'left',
        },
        {
          to: '/docs/scripting/',
          label: 'Scripting',
          position: 'left',
        },
        {
          href: 'https://github.com/saternius/BanterInspector',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Quick Start',
              to: '/docs/quick-start',
            },
            {
              label: 'Core Concepts',
              to: '/docs/core-concepts/',
            },
            {
              label: 'Tutorials',
              to: '/docs/tutorials/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/bantervr',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/saternius/BanterInspector',
            },
            {
              label: 'YouTube',
              href: 'https://youtube.com/@bantervr',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Examples',
              to: '/docs/examples/',
            },
            {
              label: 'API Reference',
              to: '/docs/api/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Banter VR. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['javascript', 'typescript', 'json'],
    },
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'unity_scene_inspector',
      contextualSearch: true,
      searchPagePath: 'search',
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
