 ✈️ Flight Booking App

A full-stack **MERN Flight Booking Application** designed to manage flight discovery, bookings, users, flight operators, and administrative workflows through a role-based system.

The application provides separate workflows for **Customers, Flight Operators, and Administrators**, with server-side validation and authentication-related security controls.

---

## 🚀 Key Features

### 👤 Customer

- Search flights by origin and destination
- Select journey date and seat class
- Book flights with server-calculated pricing
- View booking history
- Cancel bookings
- Update profile information
- Change authenticated password
- Recover password using email OTP
- Responsive UI with in-app notifications

### ✈️ Flight Operator

- Operator-specific dashboard
- Add flights
- Manage existing flights
- Update flight information
- View operational booking information
- Operator access controlled by authorization

### 🛡️ Administrator

- Manage users
- Manage flight operators
- Manage flights
- Manage customer bookings
- Add, edit, and delete flight records
- Modify bookings when authorized
- Server-side administrator authorization

---

## 🔐 Security Features

- Server-side authorization for administrative operations
- Server-side booking validation
- Server-calculated booking prices
- Passenger input validation
- Seat-capacity verification
- Password recovery using email OTP
- OTP expiration after 10 minutes
- OTPs stored only as hashes
- SMTP credentials stored through environment variables
- Sensitive `.env` files excluded from Git
- JSON-based error handling for SMTP failures

---

## 🏗️ Application Architecture

```text
                    ┌─────────────────────┐
                    │       Client        │
                    │  React + Router     │
                    └──────────┬──────────┘
                               │
                             Axios
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Server        │
                    │ Node.js + Express   │
                    └──────────┬──────────┘
                               │
                         Mongoose ODM
                               │
                               ▼
                    ┌─────────────────────┐
                    │     MongoDB Atlas   │
                    │      Database       │
                    └─────────────────────┘
🔄 Main Workflow
User
  │
  ▼
Login / Registration
  │
  ▼
Search / Select Flight
  │
  ▼
Enter Passenger Details
  │
  ▼
Server Validation
  │
  ├── Check Seat Capacity
  ├── Validate Passenger Data
  └── Calculate Booking Price
  │
  ▼
Booking Created
  │
  ▼
View / Cancel Booking
🛠️ Tech Stack
Frontend
React
React Router
Axios
Responsive CSS
Backend
Node.js
Express.js
REST APIs
Nodemailer
Database
MongoDB Atlas
Mongoose
Development Tools
Git
GitHub
npm
VS Code
Email Service
Brevo SMTP
📁 Project Structure
Flight-Booking-APP-main/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── server/
│   ├── index.js
│   ├── schemas.js
│   ├── seed.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── .gitignore
└── README.md
⚙️ Installation
1. Clone the Repository
git clone https://github.com/vaishnavi-081/Flight-Booking-app.git
cd Flight-Booking-APP-main
2. Install Frontend Dependencies
cd client
npm install
3. Install Backend Dependencies
cd ..\server
npm install
🔑 Environment Variables

Create:

server/.env

Add:

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<brevo-smtp-login>
SMTP_PASSWORD=<brevo-smtp-key>
SMTP_FROM=<verified-sender-email>

JWT_SECRET=<long-random-secret>

⚠️ Never commit server/.env to GitHub.

The sender email must be verified with Brevo, and an SMTP key should be used instead of the Brevo account password.

🌱 Seed Demo Data

From the server directory:

cd server
npm run seed

The seed process creates demo users and 132 directed city routes.

Demo Accounts
Role	Email	Password
Admin	admin@example.com	password123
Customer	customer@example.com	password123
Flight Operator	operator@example.com	password123

⚠️ Change demo passwords before using the application outside a local development environment.

▶️ Run the Application
Start Backend

Open Terminal 1:

cd server
npm start

Backend API:

http://localhost:6001
Start Frontend

Open Terminal 2:

cd client
npm start

Frontend:

http://localhost:3000
📸 Screenshots

Screenshots can be added here to demonstrate:

Login / Registration
Flight Search
Flight Results
Booking Page
Customer Dashboard
Operator Dashboard
Admin Dashboard
Booking Management
🧪 Current Capabilities

The application currently supports:

Flight search
Customer booking management
Flight cancellation
Role-based workflows
Flight operator management
Administrative management
Password change
Password recovery
Email OTP verification
Server-side booking validation
Seat-capacity checks
Responsive interface
🚧 Future Enhancements

Potential production-level improvements include:

💳 Online payment integration
💰 Payment refunds
🎫 E-ticket generation
📧 Booking confirmation emails
🔐 Secure JWT or HTTP-only session authentication
📅 Date-specific flight inventory
🔍 Advanced flight filtering
📊 Analytics dashboard
☁️ Cloud deployment
🧪 Automated unit and integration testing
🐳 Docker-based deployment
⚠️ Known Limitations
Payment processing and refunds are not currently implemented.
The current session uses a client-stored user ID; production deployment should use signed JWTs or secure HTTP-only sessions.
Flight schedules store route times but do not yet model date-specific inventory.
🔒 Security Notes

This project keeps sensitive configuration outside the repository through environment variables.

The following files are intentionally excluded from Git:

server/.env
client/node_modules/
server/node_modules/
client/build/

Never upload database credentials, SMTP keys, JWT secrets, or other sensitive credentials to GitHub.

🎯 Project Objective

The goal of this project is to demonstrate the development of a complete full-stack flight booking platform using the MERN stack while implementing real-world concepts such as:

REST API development
Database management
Authentication and authorization
Role-based access control
Server-side validation
Booking management
Email-based password recovery
Responsive frontend development
👩‍💻 Author

Vaishnavi Revanuru

Computer Science Engineering Student

GitHub:
https://github.com/vaishnavi-081

⭐ If You Find This Project Useful

Feel free to explore the repository, review the implementation, and build upon the project.
