const cron = require('node-cron');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendEmail } = require('./sendEmail');
const { sendSMS } = require('./sendSMS');

// Run every hour to check for upcoming events
const startReminderCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running event reminder cron job...');

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find events happening in the next 24 hours
      const upcomingEvents = await Event.find({
        date: {
          $gte: now,
          $lte: tomorrow
        },
        status: 'upcoming'
      });

      for (const event of upcomingEvents) {
        // Find all bookings for this event
        const bookings = await Booking.find({
          event: event._id,
          bookingStatus: 'confirmed',
          paymentStatus: 'completed'
        }).populate('user');

        // Send reminder to each user
        for (const booking of bookings) {
          // Send Email Reminder
          try {
            await sendEmail({
              to: booking.user.email,
              subject: `Reminder: ${event.title} is Tomorrow!`,
              html: `
                <h2>Event Reminder</h2>
                <p>Dear ${booking.user.name},</p>
                <p>This is a reminder that you have an upcoming event tomorrow!</p>
                <h3>Event Details:</h3>
                <ul>
                  <li><strong>Event:</strong> ${event.title}</li>
                  <li><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</li>
                  <li><strong>Time:</strong> ${event.time}</li>
                  <li><strong>Venue:</strong> ${event.venue}</li>
                  <li><strong>Address:</strong> ${event.address}</li>
                  <li><strong>Your Tickets:</strong> ${booking.numberOfTickets}</li>
                  <li><strong>Booking Reference:</strong> ${booking.bookingReference}</li>
                </ul>
                <p>Please arrive 30 minutes before the event starts.</p>
                <p>We look forward to seeing you!</p>
              `
            });
            console.log(`✅ Reminder email sent to ${booking.user.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send reminder email to ${booking.user.email}:`, emailError.message);
          }

          // Send SMS Reminder
          if (booking.user.phone) {
            try {
              // Short message for Twilio trial (160 char limit)
              const smsMessage = `Reminder: ${event.title} tomorrow at ${event.time}, ${event.venue}. Ref: ${booking.bookingReference}`;

              const smsResult = await sendSMS(booking.user.phone, smsMessage);

              if (smsResult.success) {
                console.log(`✅ Reminder SMS sent to ${booking.user.phone}`);
              } else {
                console.warn(`⚠️ Failed to send reminder SMS to ${booking.user.phone}: ${smsResult.error}`);
              }
            } catch (smsError) {
              console.error(`❌ Failed to send reminder SMS to ${booking.user.phone}:`, smsError.message);
            }
          }
        }
      }

      console.log(`Sent reminders for ${upcomingEvents.length} events`);
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  });

  console.log('✅ Event reminder cron job started');
};

module.exports = { startReminderCron };