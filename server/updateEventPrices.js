const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('./models/Event');

async function updateEventPrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const events = await Event.find({ seatMapEnabled: true });

    if (events.length === 0) {
      console.log('No events with seat maps found.');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found ${events.length} event(s) with seat maps:\n`);

    for (const event of events) {
      console.log(`Event: "${event.title}" (ID: ${event._id})`);
      console.log(`Current sections:`);

      let needsUpdate = false;

      event.sections.forEach((section, idx) => {
        console.log(`  ${idx + 1}. ${section.name}: $${section.price}`);
        if (section.price === 0) {
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        console.log('\n⚠️  This event has sections with $0 prices!');
        console.log('Options:');
        console.log('1. Edit via Admin Dashboard (Recommended)');
        console.log('2. Delete and recreate the event');
        console.log('3. Manually update using MongoDB Compass/CLI\n');
      } else {
        console.log('✓ All sections have valid prices\n');
      }
    }

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateEventPrices();
