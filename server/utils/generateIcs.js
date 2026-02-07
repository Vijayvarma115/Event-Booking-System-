const ics = require('ics');

/**
 * Generate a .ics calendar file for an event
 * @param {Object} event - Event object with title, date, time, venue, address, duration
 * @returns {Promise<string>} - ICS file content as string
 */
const generateIcsFile = async (event) => {
  try {
    const eventDate = new Date(event.date);

    // Parse time (format: "14:30" or "2:30 PM")
    const parseTime = (timeStr) => {
      const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!timeParts) return { hours: 0, minutes: 0 };

      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const meridiem = timeParts[3];

      if (meridiem) {
        if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }

      return { hours, minutes };
    };

    const timeData = parseTime(event.time);
    const duration = event.duration || 120; // Default 2 hours

    const icsEvent = {
      start: [
        eventDate.getFullYear(),
        eventDate.getMonth() + 1,
        eventDate.getDate(),
        timeData.hours,
        timeData.minutes
      ],
      duration: { minutes: duration },
      title: event.title,
      description: event.description || '',
      location: `${event.venue}, ${event.address}, ${event.city}`,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'Event Management System', email: 'noreply@eventbooking.com' }
    };

    const { error, value } = ics.createEvent(icsEvent);

    if (error) {
      console.error('Error generating ICS file:', error);
      throw error;
    }

    return value;
  } catch (error) {
    console.error('Error in generateIcsFile:', error);
    throw error;
  }
};

module.exports = { generateIcsFile };
