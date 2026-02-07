# Event Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing and booking event tickets with real-time notifications, payment processing, and QR code generation.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: v16+ (Recommended: v18 LTS)
- **npm**: v7+ (comes with Node.js)
- **MongoDB**: v4.4+ (local installation or MongoDB Atlas account)
- **Git**: For version control

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Event\ management
```

### 2. Backend Setup

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create a .env file in the server directory with the following variables:
# MONGODB_URI=<your-mongodb-connection-string>
# PORT=5000
# JWT_SECRET=<your-secret-key>
# STRIPE_SECRET_KEY=<your-stripe-secret-key>
# NODE_ENV=development
# EMAIL_SERVICE=<email-service-provider>
# EMAIL_USER=<your-email>
# EMAIL_PASSWORD=<your-email-password>
# TWILIO_ACCOUNT_SID=<your-twilio-sid>
# TWILIO_AUTH_TOKEN=<your-twilio-token>
# TWILIO_PHONE_NUMBER=<your-twilio-number>

# Start the backend server
npm run dev    # For development (with nodemon)
# or
npm start      # For production
```

### 3. Frontend Setup

```bash
# Navigate to the client directory (from root)
cd client

# Install dependencies
npm install

# Create a .env file in the client directory with the following variables:
# REACT_APP_API_URL=http://localhost:5000
# REACT_APP_STRIPE_PUBLIC_KEY=<your-stripe-public-key>

# Start the development server
npm start
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5000`.

## Version Details

### Frontend Dependencies
| Package | Version |
|---------|---------|
| React | ^18.2.0 |
| React Router DOM | ^6.30.3 |
| Axios | ^1.13.4 |
| Socket.io Client | ^4.8.3 |
| React Toastify | ^9.1.3 |
| @stripe/react-stripe-js | ^2.9.0 |
| @stripe/stripe-js | ^2.4.0 |
| React Calendar | ^4.6.1 |
| React Scripts | 5.0.1 |

### Backend Dependencies
| Package | Version |
|---------|---------|
| Node.js | v16+ |
| Express | ^4.22.1 |
| Mongoose | ^8.22.1 |
| Socket.io | ^4.8.3 |
| JWT | ^9.0.3 |
| Bcryptjs | ^2.4.3 |
| Stripe | ^14.25.0 |
| Nodemailer | ^6.10.1 |
| Twilio | ^5.12.1 |
| QRCode | ^1.5.4 |
| Express Validator | ^7.3.1 |
| Dotenv | ^16.6.1 |
| CORS | ^2.8.6 |
| Node Cron | ^3.0.3 |
| ICS | ^3.8.1 |

### Development Dependencies
| Package | Version |
|---------|---------|
| Nodemon | ^3.0.2 |

## Database Setup

### Using MongoDB Atlas (Cloud)

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Add the connection string to your `.env` file as `MONGODB_URI`

## Environment Variables Setup

### Server (.env)
```
MONGODB_URI=mongodb://localhost:27017/event-management
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
NODE_ENV=development
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_key
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install
npm start
```



## Features

### User Features
- **Browse Events**: View all available events with filtering by category, location, and date
- **Event Details**: Detailed event information including venue, timing, pricing, and availability
- **Ticket Booking**: Simple ticket quantity selection and booking
- **Secure Payments**: Stripe integration for secure payment processing
- **QR Code Tickets**: Automatic QR code generation for booked tickets
- **Email & SMS Notifications**: Booking confirmations via email and SMS (Twilio)
- **Real-time Updates**: Socket.io powered real-time seat availability updates
- **User Dashboard**: View booking history and manage tickets
- **Responsive Design**: Mobile-friendly interface

### Admin Features
- **Event Management**: Create, update, and delete events
- **Dashboard Analytics**: View total events, bookings, revenue, and recent bookings
- **Booking Management**: View all bookings with search and filter capabilities
- **Featured Events**: Mark events as featured for homepage display
- **Availability Control**: Manually adjust available seats

### Security & Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes and role-based access control
- Input validation and sanitization

## Tech Stack

### Frontend
- **React** (v18+) - UI library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **React Toastify** - Toast notifications
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **Bcryptjs** - Password hashing

### Third-party Services
- **Stripe** - Payment processing
- **Nodemailer** - Email service
- **Twilio** - SMS notifications
- **QRCode** - QR code generation

## Project Structure

```
Event management/
├── client/                    # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── EventCard.jsx
│   │   │   ├── EventCard.css
│   │   │   ├── Footer.jsx
│   │   │   ├── Footer.css
│   │   │   ├── Header.jsx
│   │   │   ├── Header.css
│   │   │   └── SeatMap.css
│   │   ├── context/           # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Home.css
│   │   │   ├── EventDetails.jsx
│   │   │   ├── EventDetails.css
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Auth.css
│   │   │   ├── Checkout.jsx
│   │   │   ├── Checkout.css
│   │   │   ├── MyBookings.jsx
│   │   │   ├── MyBookings.css
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminDashboard.css
│   │   │   ├── CreateEvent.jsx
│   │   │   ├── EditEvent.jsx
│   │   │   └── EventForm.css
│   │   ├── utils/
│   │   │   └── api.js         # Axios instance
│   │   ├── App.js             # Main app component
│   │   ├── App.css
│   │   ├── index.js           # Entry point
│   │   └── index.css
│   ├── package.json
│   └── .env
│
├── server/                    # Node.js backend
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/           # Route controllers
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   └── eventController.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── Booking.js
│   ├── routes/               # API routes
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   └── events.js
│   ├── utils/
│   │   ├── emailService.js   # Nodemailer setup
│   │   ├── smsService.js     # Twilio SMS
│   │   └── qrCodeService.js  # QR code generation
│   ├── server.js             # Entry point
│   ├── package.json
│   └── .env
│
├── checkEventPrices.js       # Utility script
└── updateEventPrices.js      # Utility script
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Stripe account
- Twilio account (optional, for SMS)
- Gmail account (for email notifications)

### Clone Repository
```bash
git clone <repository-url>
cd "Event management"
```

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/event-management
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/event-management

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Twilio SMS Configuration (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

4. Start the server:
```bash
npm start
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

4. Start the development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`


```

## Key Features Explained

### 1. Authentication Flow

- User registers with email and password
- Password is hashed using bcrypt before storage
- Upon login, server generates JWT token
- Token is stored in localStorage on client
- Protected routes verify JWT token via middleware
- Admin users have additional privileges

### 2. Race Condition Protection

**Current Implementation:**
- **Atomic Operations**: Uses MongoDB's `findOneAndUpdate` with `$inc` operator for seat reservations
- **Optimistic Locking**: Validates seat availability as part of the update query
- **Concurrent Booking Prevention**: Multiple simultaneous booking requests for the same seats are handled atomically
- **Transaction Guarantee**: Seat decrement and availability check happen in a single atomic operation

**How It Works:**
```javascript
// Atomic update ensures no race conditions
Event.findOneAndUpdate(
  { _id: eventId, availableSeats: { $gte: numberOfTickets } },
  { $inc: { availableSeats: -numberOfTickets } }
)
```

If two users try to book the last seat simultaneously:
1. First request succeeds and decrements seats
2. Second request fails because `availableSeats < numberOfTickets` condition no longer met
3. User receives "Seats no longer available" message

### 3. Event Booking Process

1. User browses events on homepage
2. Clicks on event to view details
3. Selects number of tickets
4. Clicks "Book Now" (requires login)
5. **Atomic seat reservation** prevents race conditions
6. Creates booking record with "pending" payment status
7. Redirected to checkout page
8. Enters payment details (Stripe)
9. Payment processed
10. On success:
   - Payment status updated to "completed"
   - QR code generated
   - Confirmation email sent
   - SMS notification sent (if configured)
   - Real-time notification via Socket.io
11. User can view booking in "My Bookings"

### 4. Payment Integration (Stripe)

### 5. Real-time Notifications (Socket.io)

### 6. QR Code Generation

### 7. Email Notifications

### 8. Admin Dashboard

### Stripe Test Cards Demo Numbers

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success ||

Use any future expiry date and any 3-digit CVC.

## Future Enhancements

### High Priority
- [ ] **FIFO Queue + Two-Phase Locking (2PL)** for individual seat selection
  - Interactive visual seat map with section-based pricing (VIP, Platinum, General, etc.)
  - FIFO queue system to ensure fair ordering during high-traffic booking
  - Two-phase locking protocol to prevent deadlocks:
    - Growing phase: Acquire all seat locks atomically
    - Shrinking phase: Release all locks atomically
  - Real-time seat status updates via Socket.io
  - 10-minute reservation timer with automatic expiry
  - Queue position tracking for waiting users


## Known Issues

1. **Seat Map Feature**: Currently disabled. The interactive seat map with section-based pricing has been removed from the UI but remains in the database schema for future implementation. Database models include `SeatLockQueue` for the planned FIFO + 2PL system.

3. **Race Condition Protection**: Currently uses MongoDB atomic operations for basic concurrency control. For high-traffic scenarios with individual seat selection, the FIFO Queue + 2PL enhancement (see Future Enhancements) would provide more granular control.
