# CosmicView

CosmicView is a space-themed web app built with Next.js that lets you explore NASA data with a clean, modern UI.

It includes a simple JWT-based auth flow, a dashboard that pulls **Astronomy Picture of the Day (APOD)** content, and a Mars weather view powered by NASA’s InSight API.

## Features

- **Auth**: Sign up, log in, log out (JWT stored in an HttpOnly cookie)
- **Dashboard**: NASA APOD (Astronomy Picture of the Day) gallery
- **Mars**: Latest InSight weather data
- **UI**: Tailwind + shadcn/ui components

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Tailwind CSS

## Requirements

- Node.js 18+ (recommended)
- A MongoDB database (MongoDB Atlas works well)
- A NASA API key

## Environment Variables

Create a `.env` file in the project root:

```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
JWT_SECRET=<long-random-secret>
NASA_API_KEY=<nasa-api-key>
```

Notes:

- Do **not** commit `.env` to GitHub.
- On hosting platforms like Vercel, paste the **raw values** (no surrounding quotes).

## Local Setup

1. **Clone the repo**

```bash
git clone <your-repo-url>
cd cosmo-view
```

2. **Install dependencies**

```bash
npm install
```

3. **Create `.env`**

Create a `.env` file in the project root and set:

```dotenv
MONGODB_URI=...
JWT_SECRET=...
NASA_API_KEY=...
```

Where to get the values:

- `MONGODB_URI`: from MongoDB Atlas (Database → Connect → Drivers)
- `JWT_SECRET`: generate a long random string (32+ chars recommended)
- `NASA_API_KEY`: from https://api.nasa.gov/

4. **If using MongoDB Atlas, allow your IP**

MongoDB Atlas blocks connections by default. In Atlas:

- Security → Network Access → Add IP Address
- Add your current public IP (recommended for dev)

5. **Run the dev server**

```bash
npm run dev
```

Open http://localhost:3000.

6. **(Optional) Production build locally**

```bash
npm run build
npm run start
```

## Troubleshooting

### MongoDB connection error

If you see `MongooseServerSelectionError`, it’s usually one of:

- Atlas Network Access doesn’t include your IP
- Wrong username/password in `MONGODB_URI`
- Cluster is paused

### Hydration mismatch warning in dev

Some browser extensions (e.g., Grammarly) can inject attributes into the page before React hydrates, which can cause a dev-only hydration warning.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint

## API Routes

- `POST /api/SignUp` — create account and set auth cookie
- `POST /api/logIn` — log in and set auth cookie
- `GET /api/logOut` — clear auth cookie
- `GET /api/session` — get current session user from JWT

## License

See [LICENSE](LICENSE).
