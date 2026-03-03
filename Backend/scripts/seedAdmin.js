const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User.model');
const connectDB = require('../src/config/db');

dotenv.config();

const seedUsers = async () => {
    try {
        await connectDB();

        // ensure admin exists
        const adminEmail = 'admin@gmail.com';
        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            admin = await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: 'admin123', // hashed by pre-save hook
                role: 'ADMIN',
                status: 'ACTIVE',
            });
            console.log(`Admin user created: ${admin.email} / admin123`);
        } else {
            console.log('Admin user already exists');
        }

        // ensure staff user exists
        const staffEmail = 'john@gmail.com';
        let staff = await User.findOne({ email: staffEmail });
        if (!staff) {
            staff = await User.create({
                name: 'John Doe',
                email: staffEmail,
                password: 'john@123',
                role: 'STAFF',
                status: 'ACTIVE',
            });
            console.log(`Staff user created: ${staff.email} / john@123`);
        } else {
            console.log('Staff user already exists');
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedUsers();

seedAdmin();
