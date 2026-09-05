import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Flight, User } from './schemas.js';

dotenv.config({ path: new URL('./.env', import.meta.url) });

const demoPassword = 'password123';

const users = [
    { username: 'Demo Admin', email: 'admin@example.com', usertype: 'admin', approval: 'approved' },
    { username: 'Demo Customer', email: 'customer@example.com', usertype: 'customer', approval: 'approved' },
    { username: 'Demo Operator', email: 'operator@example.com', usertype: 'flight-operator', approval: 'approved' }
];

const cities = [
    'Chennai', 'Banglore', 'Hyderabad', 'Mumbai', 'Indore', 'Delhi',
    'Pune', 'Trivendrum', 'Bhopal', 'Kolkata', 'varanasi', 'Jaipur'
];

const flights = cities.flatMap((origin, originIndex) => cities
    .filter((destination) => destination !== origin)
    .map((destination, destinationIndex) => {
        const routeNumber = originIndex * (cities.length - 1) + destinationIndex + 1;
        const departureHour = 5 + (routeNumber * 2) % 16;
        const durationHours = 1 + routeNumber % 3;
        const departureMinutes = routeNumber % 2 === 0 ? '15' : '45';
        const arrivalHour = (departureHour + durationHours) % 24;

        return {
            flightName: `Skyline ${String(routeNumber).padStart(3, '0')}`,
            flightId: `SK${String(routeNumber).padStart(3, '0')}`,
            origin,
            destination,
            departureTime: `${String(departureHour).padStart(2, '0')}:${departureMinutes}`,
            arrivalTime: `${String(arrivalHour).padStart(2, '0')}:${departureMinutes}`,
            basePrice: 3500 + (routeNumber % 8) * 450,
            totalSeats: 150 + (routeNumber % 4) * 10
        };
    }));

async function seed() {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is missing from server/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    for (const user of users) {
        await User.updateOne(
            { email: user.email },
            { $set: { username: user.username, email: user.email, usertype: user.usertype, approval: user.approval, password: hashedPassword } },
            { upsert: true }
        );
    }

    await Flight.deleteMany({ flightId: { $in: ['SK101', 'CA202', 'SS303'] } });

    for (const [index, flight] of flights.entries()) {
        await Flight.updateOne({ flightId: flight.flightId }, { $set: { ...flight, scheduleDate: new Date(Date.now() + ((index % 30) + 1) * 86400000) } }, { upsert: true });
    }

    console.log(`Seeded ${users.length} users and ${flights.length} flights.`);
    console.log(`Demo password for all users: ${demoPassword}`);
}

seed()
    .catch((error) => {
        console.error('Seed failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });