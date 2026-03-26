# MSP Public Stats Page

Public-facing Italik trust dashboard built with Astro and a daily TypeScript snapshot pipeline. The site publishes aggregate service and security metrics from HaloPSA, Qualys, and Datto RMM without exposing customer-level records.

## Local development

```bash
npm install
npm run dev
```

Useful commands:

- `npm test`
- `npm run check`
- `npm run build`
- `npm run publish:daily`

## Required secrets

For the current Halo-only public launch:

- `HALOPSA_BASE_URL`
- `HALOPSA_CLIENT_ID`
- `HALOPSA_CLIENT_SECRET`

The Halo report IDs currently default in code to reports `304`, `352`, `353`, `349`, and `350`, so you only need extra GitHub secrets for those if you later want to override the defaults.

Future Qualys/Datto integrations will also require:

- `QUALYS_BASE_URL`
- `QUALYS_USERNAME`
- `QUALYS_PASSWORD`
- `DATTO_RMM_BASE_URL`
- `DATTO_RMM_API_KEY`
- `DATTO_RMM_API_SECRET`

## Deployment

The site is published through GitHub Pages by `.github/workflows/daily-publish.yml`.

Deployment steps:

1. Add the HaloPSA credentials as GitHub Actions secrets.
2. Enable GitHub Pages for the repository and set the source to GitHub Actions.
3. Allow the scheduled workflow to run daily, or trigger it manually with `workflow_dispatch`.
4. Review the generated `data/snapshots/latest.json` and deployed page after the first successful run.

## Before launch

1. Add the HaloPSA production secrets to GitHub Actions.
2. Run one manual `workflow_dispatch`.
3. Verify `Last updated` and source freshness timestamps on the deployed site.
4. Point the final public hostname to GitHub Pages.
