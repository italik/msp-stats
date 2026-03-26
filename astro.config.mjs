import { defineConfig } from 'astro/config';

const githubRepository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const githubPagesBase =
  process.env.GITHUB_ACTIONS === 'true' && githubRepository
    ? `/${githubRepository}`
    : '/';
const base = process.env.PUBLIC_SITE_BASE ?? githubPagesBase;

export default defineConfig({
  site: 'https://msp.trust',
  base,
  integrations: []
});
