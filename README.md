# Social Content Studio v0.2 — GitHub/Vercel Frontend

This folder is the complete static website to put in a NEW GitHub repository and import into Vercel.

## Upload these files to the repository root

- `index.html`
- `styles.css`
- `app.js`
- `vercel.json`
- `.gitignore`
- `README.md`

Do not upload the `FIREBASE-UPDATE` folder to this frontend repository unless you intentionally want backend source stored there too.

## Vercel

This is a plain HTML/CSS/JavaScript site. No npm build and no Vercel serverless API are required.

1. Import the GitHub repository into Vercel.
2. Use Framework Preset: **Other**.
3. Leave Build Command empty.
4. Leave the project root as the repository root.
5. Deploy.

No `OPENAI_API_KEY` environment variable belongs in Vercel. The OpenAI key remains in Firebase Secret Manager.

## After the first Vercel deployment

Copy the assigned `*.vercel.app` hostname and add it in:

Firebase Console → `stressed-logit` → Authentication → Settings → Authorized domains

Then open the Vercel site, sign in with Google, upload one or more photos, add a short description, and select **Create Content Package**.

## Backend dependency

The site calls this existing Firebase project:

- Project: `stressed-logit`
- Region: `us-central1`
- Callable: `generateSocialPackage`

Deploy the Firebase update in the companion package before testing live generation.
