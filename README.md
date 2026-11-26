# Bright Idea Garden

Build an app that

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bright-idea-garden-018.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cdfadf16-766a-4904-b726-c0cc7d1e7466).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Plesk Apache production package

```sh
npm install
npm run test
npm run build:plesk
```

Upload the contents of `.output/plesk-upload/` (including `.htaccess`) to the domain's `httpdocs`. No Node.js runtime is needed on the VPS; the existing Lovable Cloud backend remains in use. See [the Plesk deployment guide](deployment/plesk/README.md) for HTTPS, Apache/nginx, environment and sign-in redirect requirements. `npm run verify:plesk` checks an already-built package.
