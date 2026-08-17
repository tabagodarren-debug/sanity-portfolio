# Sanity Portfolio Template

A static portfolio template for the `Sanity` personal brand: freelance custom systems/software now, with room for a future game studio.

The visual direction follows the MIT-licensed `bryl-minimal-design` reference in `.reference/bryl-minimal-design` and the public structure of `bryllim.com`: left rail navigation, compact profile intro, stat strip, numbered sections, monochrome cards, halftone texture, and light/dark theming.

## run

Open `index.html` directly in a browser, or serve the folder with any static file server.

```powershell
python -m http.server 4173
```

## deployment

The portfolio works on Vercel and Cloudflare Pages. The live GitHub contribution graph uses the same `/api/github-contributions` URL on both platforms.

- Vercel uses `api/github-contributions.js`.
- Cloudflare Pages uses `functions/api/github-contributions.js`.

Set `GITHUB_TOKEN` as an encrypted production environment variable in your hosting dashboard. Use a GitHub personal access token with `read:user`; keep it out of Git. Without the token, the site uses its built-in graph fallback.
