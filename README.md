# 🐾 StrayCare – Backend API

**StrayCare: Community Animal Rescue, Care and Adoption System**

REST API for StrayCare, a platform where citizens report stray cats and dogs, rescuers take them in and care for them, and adopters give them a forever home. Built with **Node.js, Express, TypeScript and MongoDB** 

## 🔗 Links

| | URL |
|---|---|
| Backend (Railway) | https://straycare-server-production.up.railway.app |
| Frontend (Vercel) | https://straycare-client.vercel.app |
| Backend repo | https://github.com/SayumiSP18/straycare-server |
| Frontend repo | https://github.com/SayumiSP18/straycare-client |

## 🛠 Tech Stack

- **Runtime / Framework:** Node.js, Express.js
- **Language:** TypeScript
- **Database:** MongoDB Atlas with Mongoose (validation + indexing)
- **Authentication:** JWT (access + refresh tokens), bcryptjs password hashing
- **Other:** dotenv, cors, PDF generation (adoption certificate)
- **Deployment:** Railway (API), MongoDB Atlas (database)

## ✨ Main Features

- Role-based access control: **ADMIN**, **RESCUER**, **CITIZEN** (citizens also act as adopters)
- Secure register / login with bcryptjs-hashed passwords
- JWT access token (15 minutes) and refresh token (7 days)
- Rescuer accounts require **admin approval** before they can log in
- Stray animal **report** management (create, view, update, delete)
- **Animal** profiles for rescued cats and dogs
- **Adoption** requests, approval workflow and status tracking
- **PDF adoption certificate** generation (advanced feature)
- Post-adoption **welfare follow-up** check-ins (every 2 weeks or monthly for 6 months)
- Input validation, centralized error handling and consistent JSON responses

## 📁 Project Structure

```
straycare-server/
├── src/
│   ├── config/         # DB connection, environment config
│   ├── models/         # Mongoose schemas (User, Report, Animal, Adoption ...)
│   ├── controllers/    # Request handling and business logic
│   ├── routes/         # Express route definitions
│   ├── middleware/     # auth, role checks, validation, error handler
│   ├── types/          # TypeScript interfaces and types
│   ├── utils/          # helpers (token generation, PDF, etc.)
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## ⚙️ Setup and Run Locally

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/SayumiSP18/straycare-server.git
cd straycare-server

# 2. Install dependencies
npm install

# 3. Create your .env file (see below)
cp .env.example .env

# 4. Run in development mode
npm run dev

# 5. Build and run in production mode
npm run build
npm start
```

The API runs on `http://localhost:5000` by default.

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```


> `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## 📡 API Overview

Base URL: `/api`

| Area | Example endpoints | Access |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` | Public |
| Users | `GET /users`, `PUT /users/:id`, `DELETE /users/:id` | Admin |
| Reports | `GET/POST /reports`, `PUT/DELETE /reports/:id` | Authenticated |
| Animals | `GET/POST /animals`, `PUT/DELETE /animals/:id` | Rescuer / Admin |
| Adoptions | `GET/POST /adoptions`, `PUT /adoptions/:id` | Citizen / Admin |



All responses follow a consistent JSON format with proper HTTP status codes (200, 201, 400, 401, 403, 404, 500).

## 🔐 Security

- Passwords hashed with **bcryptjs**
- Protected routes using JWT middleware
- Role-based authorization (ADMIN / RESCUER / CITIZEN)
- Secrets stored in environment variables
- CORS restricted to the frontend URL

## 🚀 Deployment

- **Backend:** Railway (auto-deploys on push to `main`)
- **Database:** MongoDB Atlas
- Build command: `npm install && npm run build`
- Start command: `npm start`

## 📸 Screenshots



![Postman](./screenshots/postman.png)
![Railway](./screenshots/railway.png)

## 👩‍💻 Author

**Sayumi Perera**

 Rapid Application Development
