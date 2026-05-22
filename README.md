# S.interior — AI Interior Design Platform

S.interior is a premium, high-performance standalone web application powered by AI that enables automated, photorealistic interior design rendering, material swaps, lived-in scene simulation, and multi-angle design synchronization.

## 🚀 Key Features

- **AI Interior Design Rendering (`/api/interior-prompt` & `/api/image-to-image`)**: Dynamically transforms empty or existing rooms into professionally styled environments.
- **Lived-In Reality Simulation**: Introduces authentic human presence, everyday clutter (power plugs, cords, accessories), and natural lighting states for non-sterile, high-fidelity real-life design previews.
- **Multi-Angle Consistency (`/api/generate-angles`)**: Conceptually maps rooms in 3D space to generate distinct camera angles (wide shots, corner views, bird's eye views, etc.) while preserving materials, textures, and layouts.
- **PocketBase Integration (`pb.js` / `/api/pb-*`)**: Real-time cloud sync for user histories, customized presets, generated image assets, and configuration.
- **PWA Capabilities**: Fully configured manifest (`manifest.json`) and service worker readiness for standalone mobile/desktop installation.

---

## 🛠️ Tech Stack

- **Frontend**: Pure Vanilla HTML5, CSS3 (curated Slate & Gold dark-mode theme), and modern JavaScript ES6.
- **Backend**: Express.js server (local dev) & Cloudflare Pages Functions (serverless deployment).
- **Database / Sync**: PocketBase CRM & File Storage.

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root folder with the following variables:

```ini
# Server Configuration
PORT=3000

# Google Sandbox AI / Vertex credentials
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_AUTHORIZATION=your-authorization-token

# Max Studio / Stable Diffusion API credentials
MAX_STUDIO_API_KEY=your-max-studio-key

# OpenRouter / GPT-4o-mini API key (used for prompt generation)
OPENROUTER_API_KEY=your-openrouter-key

# PocketBase Admin credentials
PB_EMAIL=your-pocketbase-admin-email
PB_PASSWORD=your-pocketbase-admin-password
```

---

## 📦 Local Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local server**:
   ```bash
   npm run dev
   ```
   The application will run at `http://localhost:3000` (or the port defined in your `.env`).

---

## ☁️ Deployment

### Cloudflare Pages
This repository is pre-configured with Cloudflare Serverless Pages Functions (located in the `/functions` folder):
1. Import this repository into **Cloudflare Pages**.
2. Set the build command to `npm run build` and output directory to `dist`.
3. Configure the environment variables in your Cloudflare Pages dashboard under **Settings > Environment variables**.

### Vercel
Pre-configured via `vercel.json`:
1. Import the repository into Vercel.
2. Define the environment variables in the project settings.
3. Deploy directly.
