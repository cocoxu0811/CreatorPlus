<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yXg3IMQxj69UrrlQJah9IAFRAbdXXtTj

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Production Backend (Required for Launch)

For production, do not ship `GEMINI_API_KEY` in the client. Use the built-in API server and point the app to it.

1. Install backend dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Start backend server:
   `npm run server`
4. Set client API base (for production build):
   `VITE_API_BASE_URL=https://your-domain.com`
5. Build the app:
   `npm run build`

## Deploy to Vercel

This project supports Vercel Serverless Functions under `/api`.

1. Push the repo to GitHub and import in Vercel.
2. In Vercel project settings, add environment variable:
   `GEMINI_API_KEY=your_key`
3. Build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy.

For web usage on Vercel, the frontend will call `/api/*` automatically.
For iOS builds, set `VITE_API_BASE_URL` to your Vercel URL before building, for example:
`VITE_API_BASE_URL=https://your-app.vercel.app`

## Build iOS App (Capacitor)

**Prerequisites:** Node.js, Xcode, CocoaPods (`sudo gem install cocoapods`)

1. Install dependencies:
   `npm install`
2. Ensure `.env.local` contains `GEMINI_API_KEY` (server only, do not ship in client).
3. Set `VITE_API_BASE_URL` to your backend URL before build.
4. Build the web app:
   `npm run build`
5. Add the iOS project (first time only):
   `npx cap add ios`
6. Sync web assets to iOS:
   `npx cap sync`
7. Open in Xcode and run:
   `npx cap open ios`
