const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Event.deleteMany();
    await Booking.deleteMany();

    console.log('🗑️  Data cleared');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@eventbooking.com',
      password: 'Admin@123',
      phone: '+1234567890',
      role: 'admin'
    });

    // Create regular users
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        phone: '+1234567891'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'Password123',
        phone: '+1234567892'
      }
    ]);

    console.log('✅ Users created');

    // Create sample events
    const events = await Event.create([
      {
        title: 'Summer Music Festival 2026',
        description: 'Join us for the biggest summer music festival featuring top artists from around the world. Three days of non-stop music, food, and entertainment.',
        category: 'festival',
        venue: 'Central Park Arena',
        address: '123 Park Avenue',
        city: 'New York',
        date: new Date('2026-07-15'),
        time: '18:00',
        price: 150,
        totalSeats: 5000,
        availableSeats: 5000,
        image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
        organizer: admin._id,
        featured: true
      },
      {
        title: 'Tech Conference 2026',
        description: 'Annual technology conference featuring keynotes from industry leaders, workshops, and networking opportunities.',
        category: 'conference',
        venue: 'Convention Center',
        address: '456 Tech Boulevard',
        city: 'San Francisco',
        date: new Date('2026-08-20'),
        time: '09:00',
        price: 299,
        totalSeats: 1000,
        availableSeats: 1000,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        organizer: admin._id,
        featured: true
      },
      {
        title: 'Jazz Night Live',
        description: 'An intimate evening of smooth jazz featuring renowned musicians in a cozy venue.',
        category: 'concert',
        venue: 'Blue Note Jazz Club',
        address: '789 Jazz Street',
        city: 'New Orleans',
        date: new Date('2026-06-10'),
        time: '20:00',
        price: 75,
        totalSeats: 200,
        availableSeats: 200,
        image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
        organizer: admin._id,
        featured: false
      },
      {
        title: 'Basketball Championship Finals',
        description: 'Watch the championship finals live! Intense competition and thrilling moments guaranteed.',
        category: 'sports',
        venue: 'Sports Arena',
        address: '321 Stadium Drive',
        city: 'Los Angeles',
        date: new Date('2026-09-05'),
        time: '19:30',
        price: 200,
        totalSeats: 15000,
        availableSeats: 15000,
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
        organizer: admin._id,
        featured: true
      },
      {
        title: 'Web Development Workshop',
        description: 'Hands-on workshop covering modern web development techniques, React, Node.js, and best practices.',
        category: 'workshop',
        venue: 'Tech Hub',
        address: '555 Developer Lane',
        city: 'Austin',
        date: new Date('2026-07-01'),
        time: '10:00',
        price: 99,
        totalSeats: 50,
        availableSeats: 50,
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
        organizer: admin._id,
        featured: false
      },
      {
        title: 'Rock Concert - The Legends',
        description: 'Classic rock legends reunite for one epic night of unforgettable performances.',
        category: 'concert',
        venue: 'Madison Square Garden',
        address: '4 Pennsylvania Plaza',
        city: 'New York',
        date: new Date('2026-10-15'),
        time: '19:00',
        price: 125,
        totalSeats: 20000,
        availableSeats: 20000,
        image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
        organizer: admin._id,
        featured: true
      }
    ]);

    console.log('✅ Events created');

    console.log('\n📊 Seed Summary:');
    console.log(`   Admin: admin@eventbooking.com / Admin@123`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Events: ${events.length}`);
    console.log('\n✅ Database seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();