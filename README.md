# MSP Stats

Public trust dashboard for the MSP trust report.

## Local Setup

```bash
npm install
npm run check
npm run build
```

## Configuration

The fixture-backed publish workflow does not require a separate deploy secret. If you wire the source
fetchers to live services, set these environment variables locally or as repository secrets:

- `PUBLIC_SITE_TITLE`
- `HALOPSA_BASE_URL`
- `HALOPSA_CLIENT_ID`
- `HALOPSA_CLIENT_SECRET`
- `QUALYS_BASE_URL`
- `QUALYS_API_KEY`
- `DATTO_RMM_BASE_URL`
- `DATTO_RMM_API_KEY`

GitHub Pages deployment uses the built-in `GITHUB_TOKEN`/Pages permissions from the workflow. No
extra deploy secret is required.

## Daily Publish

The scheduled workflow in `.github/workflows/daily-publish.yml` runs `npm run publish:daily`, which:

1. Pulls the current source data
2. Builds a fresh snapshot
3. Writes `data/snapshots/latest.json`
4. Publishes the static site to GitHub Pages

## Release Steps

1. Add the source credentials above in the repository settings.
2. Enable GitHub Pages deployment from GitHub Actions.
3. Push to the default branch or run the `Daily Publish` workflow manually.
