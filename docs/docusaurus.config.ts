import type * as Preset from "@docusaurus/preset-classic"
import type { Config } from "@docusaurus/types"
import { themes as prismThemes } from "prism-react-renderer"

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Track Player",
  tagline: "A modular and extensible audio player library with advanced features",
  favicon: "img/favicon.ico",
  // Set the production url of your site here
  url: "https://itslhuis.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/track-player/",
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "ItsLhuis", // Usually your GitHub org/user name.
  projectName: "track-player", // Usually your repo name.
  trailingSlash: false,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"]
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/ItsLhuis/track-player/tree/main/docs/"
        },
        theme: {
          customCss: "./src/css/custom.css"
        }
      } satisfies Preset.Options
    ]
  ],
  themeConfig: {
    navbar: {
      hideOnScroll: true,
      title: "Track Player",
      logo: {
        alt: "Track Player Logo",
        src: "img/logo.svg"
      },
      items: [
        {
          type: "doc",
          docId: "web/introduction",
          position: "left",
          label: "Introduction"
        },
        {
          href: "https://github.com/ItsLhuis/track-player",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository"
        }
      ]
    },
    footer: {
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Introduction",
              to: "/docs/"
            },
            {
              label: "Getting Started",
              to: "/docs/web/installation"
            },
            {
              label: "API Reference",
              to: "/docs/web/api"
            }
          ]
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/ItsLhuis/track-player"
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Track Player. All rights reserved.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula
    }
  } satisfies Preset.ThemeConfig
}

export default config
