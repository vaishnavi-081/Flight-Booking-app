# Flight Booking App

A MERN flight-booking application with customer, flight-operator, and administrator workflows.

## Features

- Search flights by origin and destination.
- Book passengers with seat class, journey date, and server-calculated pricing.
- View and cancel customer bookings.
- Admin tables for users, operators, bookings, and flights.
- Admin-only add, edit, delete, and booking-modification controls.
- Approved operators can add and manage flights.
- Profile page with name update and authenticated password change.
- Password recovery through Brevo email OTP. OTPs expire after 10 minutes and are stored only as hashes.
- Responsive tables and in-app notifications without browser alert popups.

## Stack

- React and React Router
- Node.js and Express
- MongoDB Atlas and Mongoose
- Axios and Nodemailer

## Setup

```powershell
cd client
npm install
cd ..\server
npm install
```

Create `server/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<brevo-smtp-login>
SMTP_PASSWORD=<brevo-smtp-key>
SMTP_FROM=<verified-sender-email>
JWT_SECRET=<long-random-secret>
```

The sender must be verified in Brevo. Use an SMTP key, not the Brevo account password. Never commit `server/.env`.

## Seed Data

```powershell
cd server
npm run seed
```

This creates demo users and 132 directed city routes. Demo accounts use `password123`:

| Role | Email |
| --- | --- |
| Admin | `admin@example.com` |
| Customer | `customer@example.com` |
| Flight operator | `operator@example.com` |

Change demo passwords before any non-local use.

## Run Locally

Start the API in one terminal:

```powershell
cd server
npm start
```

API: `http://localhost:6001`

Start the frontend in another terminal:

```powershell
cd client
npm start
```

Frontend: `http://localhost:3000`

## Security Notes

- Admin actions require server-side admin authorization.
- Booking identity, price, passenger input, and seat capacity are checked by the server.
- Password reset requires a short-lived OTP sent to the registered email.
- SMTP failures return JSON errors instead of crashing the API.

## Known Limitations

- Payment processing and refunds are not implemented.
- The current session uses a client-stored user ID; production should use signed JWTs or secure HTTP-only sessions.
- Flight schedules store route times but do not yet model date-specific inventory.
