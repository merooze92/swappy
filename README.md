# SWAPPY

SWAPPY is a skill-swap platform. The React/Vite frontend is in `frontend/`; the Express and MongoDB API is in `backend/`.

For a beginner-friendly explanation of the project files, technology, forms, and API flow, see [SWAPPY_Project_Guide_Roman_Urdu.docx](./SWAPPY_Project_Guide_Roman_Urdu.docx).

## Setup

The project is now separated into two folders:

```text
swappy/
├── backend/
├── frontend/
└── README.md
```

Install dependencies separately from each folder:

```sh
cd frontend && npm install
cd ../backend && npm install
```

Copy the example settings, then edit the copy with your existing Atlas URI, a random JWT secret of at least 32 characters, and administrator email/password:

```sh
cp backend/.env.example backend/.env
```

Do not commit `backend/.env`.

Start the backend from the `backend/` folder:

```sh
cd backend
npm start
```

Start the frontend from the `frontend/` folder in another terminal:

```sh
cd frontend
npm run dev
```

The backend connects to MongoDB before it starts accepting API requests. Seeker and provider registrations, skills, skill requests, exchanges, feedback, categories, and platform activity are stored in MongoDB.

The frontend defaults to `http://localhost:5001/api`. Set `VITE_API_URL` if the API is hosted at a different address.

The SWAPPY equivalent of adding a product is offering a skill: `POST http://localhost:5001/api/skills` (requires a provider login token). SWAPPY has no product collection or image upload feature.
