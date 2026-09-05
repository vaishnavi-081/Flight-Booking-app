import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User, Booking, Flight } from './schemas.js';

dotenv.config({ path: new URL('./.env', import.meta.url) });


const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-change-this-secret';

app.use(express.json());
app.use(bodyParser.json({limit: "30mb", extended: true}))
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));
app.use(cors());

const requireAdmin = async (req, res, next) => {
    try {
        const token = req.header('authorization')?.replace('Bearer ', '');
        const claims = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(claims.userId);
        if (!user || user.usertype !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Admin access required' });
    }
};

const requireUser = async (req, res, next) => {
    try {
        const token = req.header('authorization')?.replace('Bearer ', '');
        const claims = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(claims.userId);
        if (!user) return res.status(401).json({ message: 'Login required' });
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Login required' });
    }
};

const publicUser = (user) => {
    const safeUser = user.toObject();
    delete safeUser.password;
    return safeUser;
};

const mailer = process.env.SMTP_HOST ? nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
}) : null;

// mongoose setup

const PORT = 6001;
mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
).then(()=>{

    // All the client-server activites


    app.post('/register', async (req, res) => {
        const { username, email, password, usertype } = req.body;
        if (!username?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }
        const accountType = usertype === 'flight-operator' ? 'flight-operator' : 'customer';
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username: username.trim(),
                email: normalizedEmail,
                usertype: accountType,
                password: hashedPassword,
                approval: accountType === 'flight-operator' ? 'not-approved' : 'approved'
            });
            const userCreated = await newUser.save();
            return res.status(201).json({ ...publicUser(userCreated), token: jwt.sign({ userId: userCreated._id }, JWT_SECRET, { expiresIn: '2h' }) });

        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Server Error' });
        }
    });

    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email: { $regex: new RegExp(`^${email?.trim()}$`, 'i') } });
    
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            } else{
                if (user.usertype === 'flight-operator' && user.approval !== 'approved') return res.status(403).json({ message: 'Operator approval is required before login' });
                return res.json({ ...publicUser(user), token: jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '2h' }) });
            }
          
        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Server Error' });
        }
    });

    app.put('/change-password', requireUser, async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        if (!await bcrypt.compare(currentPassword, req.user.password)) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        req.user.password = await bcrypt.hash(newPassword, 10);
        await req.user.save();
        res.json({ message: 'Password changed successfully' });
    });

    app.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        if (!mailer) return res.status(503).json({ message: 'Email OTP is not configured. Add Brevo SMTP values to server/.env' });
        const user = await User.findOne({ email: { $regex: new RegExp(`^${email?.trim()}$`, 'i') } });
        if (!user) return res.status(404).json({ message: 'Customer does not exist' });
        const resetCode = crypto.randomInt(100000, 1000000).toString();
        user.resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
        user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        console.log(`[Password Reset] Generated OTP for ${user.email}: ${resetCode}`);
        try {
            const sender = process.env.SMTP_FROM || process.env.SMTP_USER;
            await mailer.sendMail({
                from: `"SKY Furaito" <${sender}>`,
                to: user.email,
                subject: 'SKY Furaito Password Reset OTP',
                text: `Your OTP for password reset is ${resetCode}. It expires in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <h2 style="color: #0284c7; margin-top: 0;">SKY Furaito Password Reset</h2>
                        <p style="color: #374151; font-size: 15px;">You requested a one-time verification code to reset your account password.</p>
                        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827; background: #f3f4f6; padding: 14px 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
                            ${resetCode}
                        </div>
                        <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">This OTP is valid for 10 minutes. If you did not request this password reset, you can safely ignore this email.</p>
                    </div>
                `
            });
        } catch (error) {
            user.resetCodeHash = undefined;
            user.resetCodeExpires = undefined;
            await user.save();
            console.error('SMTP send failed:', error.message);
            return res.status(502).json({ message: 'Failed to send OTP email. Please check SMTP configuration.' });
        }
        res.json({ message: 'OTP sent to your registered email.' });
    });

    app.post('/forgot-password/confirm', async (req, res) => {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || typeof newPassword !== 'string' || newPassword.length < 6) return res.status(400).json({ message: 'Email, OTP, and a 6-character password are required' });
        const user = await User.findOne({ email: { $regex: new RegExp(`^${email?.trim()}$`, 'i') } });
        const codeHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
        if (!user || !user.resetCodeExpires || user.resetCodeExpires < new Date() || user.resetCodeHash !== codeHash) return res.status(400).json({ message: 'OTP is invalid or expired' });
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetCodeHash = undefined;
        user.resetCodeExpires = undefined;
        await user.save();
        res.json({ message: 'Password reset successfully. Sign in with your new password.' });
    });

    app.put('/profile', requireUser, async (req, res) => {
        const { username } = req.body;
        if (typeof username !== 'string' || !username.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }
        req.user.username = username.trim();
        await req.user.save();
        res.json({ username: req.user.username });
    });
      

    // Approve flight operator

    app.post('/approve-operator', requireAdmin, async(req, res)=>{
        const {id} = req.body;
        try{
            
            const user = await User.findById(id);
            user.approval = 'approved';
            await user.save();
            res.json({message: 'approved!'})
        }catch(err){
            res.status(500).json({ message: 'Server Error' });
        }
    })

    // reject flight operator

    app.post('/reject-operator', requireAdmin, async(req, res)=>{
        const {id} = req.body;
        try{
            
            const user = await User.findById(id);
            user.approval = 'rejected';
            await user.save();
            res.json({message: 'rejected!'})
        }catch(err){
            res.status(500).json({ message: 'Server Error' });
        }
    })


    // fetch user

    app.get('/fetch-user/:id', requireUser, async (req, res)=>{
        if (req.user.usertype !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const id = await req.params.id;
        console.log(req.params.id)
        try{
            const user = await User.findById(req.params.id);
            console.log(user);
            res.json(publicUser(user));

        }catch(err){
            console.log(err);
        }
    })

    // fetch all users

    app.get('/fetch-users', requireAdmin, async (req, res)=>{

        try{
            const users = await User.find().select('-password -resetCodeHash -resetCodeExpires');
            res.json(users);

        }catch(err){
            res.status(500).json({message: 'error occured'});
        }
    })

    app.put('/update-user/:id', requireAdmin, async (req, res) => {
        const { username, email, usertype, approval } = req.body;
        if (typeof username !== 'string' || typeof email !== 'string' || !username.trim() || !email.trim()) {
            return res.status(400).json({ message: 'Name and email are required' });
        }
        try {
            const updateFields = {
                username: username.trim(),
                email: email.trim().toLowerCase()
            };
            if (usertype && ['customer', 'flight-operator', 'admin'].includes(usertype)) {
                updateFields.usertype = usertype;
            }
            if (approval && ['approved', 'not-approved', 'rejected'].includes(approval)) {
                updateFields.approval = approval;
            }
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { $set: updateFields },
                { new: true, runValidators: true }
            ).select('-password');
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json(user);
        } catch (error) {
            if (error.code === 11000) return res.status(409).json({ message: 'Email already exists' });
            res.status(500).json({ message: 'Server Error' });
        }
    });

    app.post('/admin/users', requireAdmin, async (req, res) => {
        const { username, email, usertype, password } = req.body;
        if (!username?.trim() || !email?.trim() || !['customer', 'flight-operator', 'admin'].includes(usertype) || !password) {
            return res.status(400).json({ message: 'Name, email, valid user type (customer, flight-operator, admin), and password are required' });
        }
        try {
            const user = await User.create({
                username: username.trim(), email: email.trim().toLowerCase(), usertype,
                password: await bcrypt.hash(password, 10), approval: 'approved'
            });
            const safeUser = user.toObject();
            delete safeUser.password;
            res.status(201).json(safeUser);
        } catch (error) {
            if (error.code === 11000) return res.status(409).json({ message: 'Email already exists' });
            res.status(500).json({ message: 'Server Error' });
        }
    });

    app.delete('/admin/users/:id', requireAdmin, async (req, res) => {
        try {
            if (req.user._id.toString() === req.params.id) {
                return res.status(400).json({ message: 'You cannot delete your own admin account' });
            }
            const user = await User.findOneAndDelete({ _id: req.params.id, usertype: { $in: ['customer', 'flight-operator', 'admin'] } });
            if (!user) return res.status(404).json({ message: 'User not found' });
            await Booking.deleteMany({ user: user._id });
            res.json({ message: 'User deleted' });
        } catch (error) {
            res.status(500).json({ message: 'Server Error' });
        }
    });


    // Add flight

    app.post('/add-flight', requireUser, async (req, res)=>{
        const {flightName, flightId, origin, destination, departureTime, 
                                arrivalTime, basePrice, totalSeats} = req.body;
        if (!['admin', 'flight-operator'].includes(req.user.usertype) || (req.user.usertype === 'flight-operator' && req.user.approval !== 'approved')) {
            return res.status(403).json({ message: 'Approved operator or admin access required' });
        }
        if (!flightId?.trim() || !origin || !destination || !departureTime || !arrivalTime || Number(basePrice) <= 0 || Number(totalSeats) <= 0) {
            return res.status(400).json({ message: 'Complete valid flight details are required' });
        }
        try{

            const flight = new Flight({ flightName: req.user.usertype === 'flight-operator' ? req.user.username : flightName, flightId: flightId.trim(), operator: req.user._id, origin, destination,
                                        departureTime, arrivalTime, scheduleDate: req.body.scheduleDate || new Date(Date.now() + 86400000), basePrice: Number(basePrice), totalSeats: Number(totalSeats)});
            await flight.save();

            res.json({message: 'flight added'});

        }catch(err){
            if (err.code === 11000) return res.status(409).json({ message: 'Flight ID already exists' });
            res.status(500).json({ message: 'Server Error' });
        }
    })

    app.post('/admin/flights', requireAdmin, async (req, res) => {
        const { flightName, flightId, origin, destination, departureTime, arrivalTime, basePrice, totalSeats } = req.body;
        if (!flightName?.trim() || !flightId?.trim() || !origin || !destination || !departureTime || !arrivalTime || Number(basePrice) <= 0 || Number(totalSeats) <= 0) {
            return res.status(400).json({ message: 'Complete valid flight details are required' });
        }
        try {
            const flight = await Flight.create({ flightName: flightName.trim(), flightId: flightId.trim(), origin, destination, scheduleDate: req.body.scheduleDate || new Date(Date.now() + 86400000), departureTime, arrivalTime, basePrice: Number(basePrice), totalSeats: Number(totalSeats) });
            res.status(201).json(flight);
        } catch (error) {
            if (error.code === 11000) return res.status(409).json({ message: 'Flight ID already exists' });
            res.status(500).json({ message: 'Server Error' });
        }
    });

    app.delete('/admin/flights/:id', requireAdmin, async (req, res) => {
        try {
            const flight = await Flight.findByIdAndDelete(req.params.id);
            if (!flight) return res.status(404).json({ message: 'Flight not found' });
            await Booking.deleteMany({ flight: flight._id });
            res.json({ message: 'Flight deleted' });
        } catch (error) {
            res.status(500).json({ message: 'Server Error' });
        }
    });

    // update flight
    
    app.put('/update-flight', requireUser, async (req, res)=>{
        const {_id, flightName, flightId, origin, destination, 
                departureTime, arrivalTime, scheduleDate, basePrice, totalSeats} = req.body;
        try{

            const flight = await Flight.findById(_id);
            if (!flight) return res.status(404).json({ message: 'Flight not found' });
            if (req.user.usertype !== 'admin' && (!flight.operator || flight.operator.toString() !== req.user._id.toString() || req.user.approval !== 'approved')) {
                return res.status(403).json({ message: 'Only the owner or an admin can update this flight' });
            }

            flight.flightName = flightName;
            flight.flightId = flightId;
            flight.origin = origin;
            flight.destination = destination;
            flight.departureTime = departureTime;
            flight.arrivalTime = arrivalTime;
            if (scheduleDate) flight.scheduleDate = scheduleDate;
            flight.basePrice = basePrice;
            flight.totalSeats = totalSeats;

            await flight.save();

            res.json({message: 'flight updated'});

        }catch(err){
            console.log(err);
        }
    })

    // fetch flights

    app.get('/fetch-flights', async (req, res)=>{
        try{
            const query = {};
            if (req.query.origin && req.query.destination && req.query.roundTrip === 'true') {
                query.$or = [
                    { origin: req.query.origin, destination: req.query.destination },
                    { origin: req.query.destination, destination: req.query.origin }
                ];
            } else {
                if (req.query.origin) query.origin = req.query.origin;
                if (req.query.destination) query.destination = req.query.destination;
            }
            const dayRange = (value) => {
                if (!value) return null;
                const start = new Date(`${value}T00:00:00.000Z`);
                if (Number.isNaN(start.getTime())) return null;
                const end = new Date(start);
                end.setUTCDate(end.getUTCDate() + 1);
                return { $gte: start, $lt: end };
            };
            const flights = await Flight.find(query);
            const now = new Date();

            // Filter out flights that have already departed if a specific journey date was searched
            const futureFlights = flights.filter((flight) => {
                const isReturnLeg = req.query.roundTrip === 'true' && req.query.origin && flight.origin === req.query.destination;
                const targetDateStr = isReturnLeg ? req.query.returnDate : req.query.journeyDate;

                if (!targetDateStr) return true; // return all flights if no journey date filter was passed (e.g. admin panel)

                const [year, month, day] = String(targetDateStr).split('-').map(Number);
                if (!year || !month || !day) return true;

                const depTimeStr = flight.departureTime || '00:00';
                const [depH, depM] = depTimeStr.split(':').map(Number);
                const flightDepartureDateTime = new Date(year, month - 1, day, depH || 0, depM || 0, 0, 0);

                return flightDepartureDateTime > now;
            });

            const results = await Promise.all(futureFlights.map(async (flight) => {
                const isReturnLeg = req.query.roundTrip === 'true' && req.query.origin && flight.origin === req.query.destination;
                const journeyFilter = dayRange(isReturnLeg ? req.query.returnDate : (req.query.journeyDate || req.query.scheduleDate));
                const bookings = await Booking.find({
                    flight: flight._id,
                    ...(journeyFilter ? { journeyDate: journeyFilter } : {}),
                    bookingStatus: { $nin: ['cancelled', 'completed'] }
                }).select('passengers');
                const bookedSeats = bookings.reduce((total, booking) => total + booking.passengers.length, 0);
                return { ...flight.toObject(), availableSeats: Math.max(flight.totalSeats - bookedSeats, 0) };
            }));
            res.json(results);

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })


    // fetch flight

    app.get('/fetch-flight/:id', async (req, res)=>{
        const id = await req.params.id;
        console.log(req.params.id)
        try{
            const flight = await Flight.findById(req.params.id);
            console.log(flight);
            res.json(flight);

        }catch(err){
            console.log(err);
        }
    })

    // Helper to calculate destination arrival datetime for a booking
    const getBookingArrivalDateTime = (booking, flight) => {
        if (!booking.journeyDate) return null;
        const journey = new Date(booking.journeyDate);
        if (isNaN(journey.getTime())) return null;

        const arrTimeStr = (flight && flight.arrivalTime) || booking.flight?.arrivalTime;
        const depTimeStr = booking.journeyTime || (flight && flight.departureTime) || booking.flight?.departureTime;

        let arrivalDate = new Date(journey);

        if (arrTimeStr && arrTimeStr.includes(':')) {
            const [arrH, arrM] = arrTimeStr.split(':').map(Number);
            arrivalDate.setHours(arrH || 0, arrM || 0, 0, 0);

            if (depTimeStr && depTimeStr.includes(':')) {
                const [depH, depM] = depTimeStr.split(':').map(Number);
                if (arrH < depH || (arrH === depH && arrM < depM)) {
                    arrivalDate.setDate(arrivalDate.getDate() + 1);
                }
            }
            return arrivalDate;
        }

        if (depTimeStr && depTimeStr.includes(':')) {
            const [depH, depM] = depTimeStr.split(':').map(Number);
            arrivalDate.setHours((depH || 0) + 2, depM || 0, 0, 0);
            return arrivalDate;
        }

        arrivalDate.setHours(23, 59, 59, 999);
        return arrivalDate;
    };

    const updateCompletedBookings = async (extraQuery = {}) => {
        try {
            const confirmedBookings = await Booking.find({ ...extraQuery, bookingStatus: 'confirmed' }).populate('flight');
            const now = new Date();
            const updateIds = [];

            for (const booking of confirmedBookings) {
                const arrivalDate = getBookingArrivalDateTime(booking, booking.flight);
                if (arrivalDate && now >= arrivalDate) {
                    updateIds.push(booking._id);
                    booking.bookingStatus = 'completed';
                }
            }

            if (updateIds.length > 0) {
                await Booking.updateMany({ _id: { $in: updateIds } }, { $set: { bookingStatus: 'completed' } });
            }
        } catch (err) {
            console.error('Error updating completed bookings:', err);
        }
    };

    // Periodically update completed bookings
    setInterval(() => {
        updateCompletedBookings();
    }, 60 * 1000);

    // fetch all bookings

    app.get('/fetch-bookings', requireUser, async (req, res)=>{
        try{
            let query = {};
            if (req.user.usertype === 'customer') query.user = req.user._id;
            if (req.user.usertype === 'flight-operator') {
                const operatorFlights = await Flight.find({ operator: req.user._id }).select('_id');
                query.flight = { $in: operatorFlights.map((flight) => flight._id) };
            }
            
            await updateCompletedBookings(query);

            const bookings = await Booking.find(query).populate('flight');
            res.json(bookings);

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })

    // Start ticket booking: create a pending booking and send an OTP

    app.post('/book-ticket/request-otp', requireUser, async (req, res)=>{
        const { flight, email, mobile, passengers, journeyDate, journeyTime, seatClass } = req.body;
        if (!mailer) return res.status(503).json({ message: 'Email OTP is not configured. Check server/.env SMTP settings.' });
        try {
            const selectedFlight = await Flight.findById(flight);
            const allowedClasses = ['economy', 'premium-economy', 'business', 'first-class'];
            const journey = new Date(journeyDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!selectedFlight || !allowedClasses.includes(seatClass) || !Array.isArray(passengers) || passengers.length < 1 || passengers.length > 9 || !email?.trim() || Number.isNaN(journey.getTime()) || journey < today) {
                return res.status(400).json({ message: 'Invalid booking details' });
            }

            const [depH, depM] = (journeyTime || selectedFlight.departureTime || '00:00').split(':').map(Number);
            const [jYear, jMonth, jDay] = String(journeyDate).slice(0, 10).split('-').map(Number);
            const flightDepartureDateTime = new Date(jYear, jMonth - 1, jDay, depH || 0, depM || 0, 0, 0);
            if (flightDepartureDateTime <= new Date()) return res.status(400).json({ message: 'Cannot book a flight for a past date or departure time' });

            if (passengers.some((passenger) => typeof passenger.name !== 'string' || !passenger.name.trim() || Number(passenger.age) < 0 || Number(passenger.age) > 120)) {
                return res.status(400).json({ message: 'Passenger names and ages are invalid' });
            }

            // Remove any unfinished OTP booking for this user/flight.
            await Booking.deleteMany({ user: req.user._id, flight: selectedFlight._id, email: email.trim().toLowerCase(), bookingStatus: 'pending', otpExpires: { $lt: new Date() } });

            const nextDay = new Date(journey);
            nextDay.setDate(nextDay.getDate() + 1);
            const bookings = await Booking.find({ flight: selectedFlight._id, journeyDate: { $gte: journey, $lt: nextDay }, bookingStatus: { $nin: ['cancelled', 'completed'] } });
            const numBookedSeats = bookings.reduce((acc, booking) => acc + booking.passengers.length, 0);
            if (numBookedSeats + passengers.length > selectedFlight.totalSeats) return res.status(409).json({ message: 'Not enough seats available' });

            const seatCode = {'economy': 'E', 'premium-economy': 'P', 'business': 'B', 'first-class': 'A'};
            const coach = seatCode[seatClass];
            let seats = '';
            for (let i = numBookedSeats + 1; i < numBookedSeats + passengers.length + 1; i++) seats += `${seats ? ', ' : ''}${coach}-${i}`;

            const otp = crypto.randomInt(100000, 1000000).toString();
            const booking = new Booking({
                user: req.user._id, flight: selectedFlight._id, flightName: selectedFlight.flightName, flightId: selectedFlight.flightId,
                departure: selectedFlight.origin, destination: selectedFlight.destination, email: email.trim().toLowerCase(), mobile, passengers,
                totalPrice: selectedFlight.basePrice * passengers.length, journeyDate: journey, journeyTime: journeyTime || selectedFlight.departureTime, seatClass, seats,
                bookingStatus: 'pending', otpHash: crypto.createHash('sha256').update(otp).digest('hex'), otpExpires: new Date(Date.now() + 10 * 60 * 1000)
            });
            await booking.save();

            try {
                const sender = process.env.SMTP_FROM || process.env.SMTP_USER;
                await mailer.sendMail({
                    from: `"SKY Furaito" <${sender}>`,
                    to: booking.email,
                    subject: 'SKY Furaito Flight Booking OTP',
                    text: `Your flight booking OTP is ${otp}. It expires in 10 minutes.`,
                    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px"><h2 style="color:#0284c7">SKY Furaito Booking Verification</h2><p>Your one-time password for confirming your flight booking is:</p><div style="font-size:32px;font-weight:700;letter-spacing:6px;background:#f3f4f6;padding:14px;text-align:center;border-radius:8px;margin:24px 0">${otp}</div><p style="color:#6b7280">This OTP is valid for 10 minutes. If you did not request this booking, ignore this email.</p></div>`
                });
            } catch (mailError) {
                await Booking.findByIdAndDelete(booking._id);
                console.error('Booking OTP email failed:', mailError.message);
                return res.status(502).json({ message: 'Failed to send OTP email. Please check SMTP configuration and verified sender.' });
            }

            res.json({ message: `OTP sent to ${booking.email}`, bookingId: booking._id });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    });

    // Verify booking OTP and confirm the ticket
    app.post('/book-ticket/verify-otp', requireUser, async (req, res)=>{
        const { bookingId, otp } = req.body;
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking || booking.user.toString() !== req.user._id.toString() || booking.bookingStatus !== 'pending') {
                return res.status(404).json({ message: 'Pending booking not found' });
            }
            const codeHash = crypto.createHash('sha256').update(String(otp || '')).digest('hex');
            if (!booking.otpExpires || booking.otpExpires < new Date() || booking.otpHash !== codeHash) {
                return res.status(400).json({ message: 'OTP is invalid or expired' });
            }
            booking.bookingStatus = 'confirmed';
            booking.otpHash = undefined;
            booking.otpExpires = undefined;
            await booking.save();

            try {
                const sender = process.env.SMTP_FROM || process.env.SMTP_USER;
                await mailer.sendMail({
                    from: `"SKY Furaito" <${sender}>`,
                    to: booking.email,
                    subject: 'SKY Furaito Booking Confirmed',
                    text: `Your flight booking ${booking.flightId} is confirmed. Seats: ${booking.seats}.`,
                    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px"><h2 style="color:#16a34a">Booking Confirmed</h2><p>Your flight booking has been successfully confirmed.</p><p><b>Flight:</b> ${booking.flightId} (${booking.flightName})</p><p><b>Route:</b> ${booking.departure} → ${booking.destination}</p><p><b>Seats:</b> ${booking.seats}</p><p><b>Journey date:</b> ${new Date(booking.journeyDate).toLocaleDateString()}</p><p><b>Total:</b> ${booking.totalPrice}</p></div>`
                });
            } catch (mailError) {
                console.error('Confirmation email failed:', mailError.message);
                // Booking is already confirmed; email failure should not cancel the ticket.
            }
            res.json({ message: 'Booking successful!!' });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    });


    // cancel ticket

    app.put('/cancel-ticket/:id', requireUser, async (req, res)=>{
        try{
            const booking = await Booking.findById(req.params.id).populate('flight');
            if (!booking) return res.status(404).json({ message: 'Booking not found' });
            if (req.user.usertype !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
            const arrivalDate = getBookingArrivalDateTime(booking, booking.flight);
            if ((arrivalDate && new Date() >= arrivalDate) || booking.bookingStatus === 'completed') {
                if (booking.bookingStatus !== 'completed') {
                    booking.bookingStatus = 'completed';
                    await booking.save();
                }
                return res.status(400).json({ message: 'Cannot cancel: Flight destination time has completed' });
            }
            if (booking.bookingStatus !== 'confirmed') return res.status(400).json({ message: 'Booking is already cancelled or completed' });
            booking.bookingStatus = 'cancelled';
            await booking.save();
            res.json({message: "booking cancelled"});

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })

    const handleModifyBooking = async (req, res) => {
        const { journeyDate, seatClass, flightId: selectedFlightId, journeyTime } = req.body;
        if (!journeyDate || !seatClass) {
            return res.status(400).json({ message: 'Journey date and seat class are required' });
        }
        const allowedClasses = ['economy', 'premium-economy', 'business', 'first-class'];
        if (!allowedClasses.includes(seatClass)) {
            return res.status(400).json({ message: 'Invalid seat class' });
        }
        try {
            const booking = await Booking.findById(req.params.id).populate('flight');
            if (!booking) return res.status(404).json({ message: 'Booking not found' });
            
            // Allow admin or ticket owner
            if (req.user.usertype !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const arrivalDate = getBookingArrivalDateTime(booking, booking.flight);
            if ((arrivalDate && new Date() >= arrivalDate) || booking.bookingStatus === 'completed') {
                if (booking.bookingStatus !== 'completed') {
                    booking.bookingStatus = 'completed';
                    await booking.save();
                }
                return res.status(400).json({ message: 'Cannot modify: Flight destination time has completed' });
            }
            if (booking.bookingStatus !== 'confirmed') {
                return res.status(400).json({ message: 'Only confirmed bookings can be modified' });
            }

            // Target flight: resolve safely by ObjectId or flightId code
            let targetFlight = null;
            if (selectedFlightId) {
                if (mongoose.Types.ObjectId.isValid(selectedFlightId)) {
                    targetFlight = await Flight.findById(selectedFlightId);
                }
                if (!targetFlight) {
                    targetFlight = await Flight.findOne({ flightId: selectedFlightId });
                }
            }
            if (!targetFlight) {
                if (booking.flight && booking.flight._id) {
                    targetFlight = booking.flight;
                } else if (booking.flight && mongoose.Types.ObjectId.isValid(booking.flight)) {
                    targetFlight = await Flight.findById(booking.flight);
                }
            }
            if (!targetFlight && booking.flightId) {
                targetFlight = await Flight.findOne({ flightId: booking.flightId });
            }
            if (!targetFlight) return res.status(404).json({ message: 'Associated flight not found' });

            const [jYear, jMonth, jDay] = String(journeyDate).slice(0, 10).split('-').map(Number);
            const scheduledDepartureTime = targetFlight.departureTime || journeyTime || booking.journeyTime || '00:00';
            const [depH, depM] = scheduledDepartureTime.split(':').map(Number);
            const newDepartureDateTime = new Date(jYear, jMonth - 1, jDay, depH || 0, depM || 0, 0, 0);

            // Verify that departure date and time is in the future
            if (newDepartureDateTime <= new Date()) {
                return res.status(400).json({ message: 'Cannot modify to a flight/time that has already departed or is in the past' });
            }

            const journey = new Date(`${String(journeyDate).slice(0, 10)}T00:00:00.000Z`);
            const startOfDay = new Date(`${String(journeyDate).slice(0, 10)}T00:00:00.000Z`);
            const endOfDay = new Date(`${String(journeyDate).slice(0, 10)}T23:59:59.999Z`);

            // Check seat availability on the target flight for the new date
            const otherBookings = await Booking.find({
                _id: { $ne: booking._id },
                flight: targetFlight._id,
                journeyDate: { $gte: startOfDay, $lte: endOfDay },
                bookingStatus: { $nin: ['cancelled', 'completed'] }
            }).select('passengers');

            const bookedSeats = otherBookings.reduce((total, item) => total + item.passengers.length, 0);
            const numPassengers = (booking.passengers && booking.passengers.length > 0) ? booking.passengers.length : 1;
            const availableSeats = targetFlight.totalSeats - bookedSeats;

            if (numPassengers > availableSeats) {
                return res.status(409).json({
                    message: `Not enough seats available on ${targetFlight.flightName} (${targetFlight.flightId}). Only ${availableSeats} seat(s) left on ${scheduledDepartureTime} for the selected date.`
                });
            }

            // Recalculate seats and price
            const seatCode = {'economy': 'E', 'premium-economy': 'P', 'business': 'B', 'first-class': 'A'};
            const classMultipliers = {'economy': 1, 'premium-economy': 2, 'business': 3, 'first-class': 4};
            const coach = seatCode[seatClass] || 'E';
            const classMultiplier = classMultipliers[seatClass] || 1;

            let seats = "";
            for(let i = bookedSeats + 1; i <= bookedSeats + numPassengers; i++){
                if(seats === ""){
                    seats = `${coach}-${i}`;
                } else {
                    seats = `${seats}, ${coach}-${i}`;
                }
            }

            booking.flight = targetFlight._id;
            booking.flightName = targetFlight.flightName;
            booking.flightId = targetFlight.flightId;
            booking.departure = targetFlight.origin;
            booking.destination = targetFlight.destination;
            booking.journeyDate = journey;
            booking.journeyTime = scheduledDepartureTime;
            booking.seatClass = seatClass;
            booking.seats = seats;
            booking.totalPrice = targetFlight.basePrice * classMultiplier * numPassengers;

            await booking.save();
            res.json(booking);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message || 'Server Error' });
        }
    };

    app.put('/modify-booking/:id', requireUser, handleModifyBooking);
    app.put('/admin/bookings/:id', requireUser, handleModifyBooking);






        app.listen(PORT, ()=>{
            console.log(`Running @ ${PORT}`);
        });
    }
).catch((e)=> console.log(`Error in db connection ${e}`));