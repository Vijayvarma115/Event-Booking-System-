const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('./models/Event');

async function checkEventPrices() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const events = await Event.find({ seatMapEnabled: true });

    console.log(`\nFound ${events.length} events with seat maps:\n`);

    for (const event of events) {
      console.log(`Event: ${event.title} (ID: ${event._id})`);
      console.log(`  Total Seats: ${event.totalSeats}`);
      console.log(`  Available: ${event.availableSeats}`);
      console.log(`  Sections:`);

      if (event.sections && event.sections.length > 0) {
        for (const section of event.sections) {
          console.log(`    - ${section.name}:`);
          console.log(`      Price: ${section.price} (type: ${typeof section.price})`);
          console.log(`      Rows: ${section.rows.length}`);
          let totalSeats = 0;
          section.rows.forEach(row => {
            totalSeats += row.seats.length;
          });
          console.log(`      Total seats in section: ${totalSeats}`);
        }
      } else {
        console.log('    No sections found!');
      }
      console.log('');
    }

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEventPrices();
