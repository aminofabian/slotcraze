# Slotcraze → PlayLTC notice page

Static closure notice for **slotcraze.cc**. DNS for the domain should point at this site so visitors learn that Slotcraze is closing and ownership/play continue at [playltc.com](https://playltc.com/).

## Stack

Plain HTML / CSS / JS — no build step. Drop on any static host (Cloudflare Pages, Netlify, S3, nginx, etc.).

## SEO included

- Canonical URL, Open Graph, Twitter cards
- JSON-LD (`WebPage`, `Organization`, `FAQPage`)
- `robots.txt`, `sitemap.xml`, web manifest
- Semantic sections + FAQ content for search intent

## Local preview

```bash
cd slotcraze-landing
python3 -m http.server 4173
```

Open http://localhost:4173

## Deploy notes

1. Point `slotcraze.cc` (and `www` if used) at the static host.
2. Confirm HTTPS and that `/` serves `index.html`.
3. Optional: add a short cache TTL while messaging is still being tuned.

## Copy

Edit `index.html` if you need stronger language around balances, account migration, or support contact.
# slotcraze
# slotcraze
# slotcraze
