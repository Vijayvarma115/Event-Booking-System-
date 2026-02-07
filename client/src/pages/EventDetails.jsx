import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import API from '../utils/api';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/events/${id}`);
      setEvent(res.data.event);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.info('Please login to book tickets');
      navigate('/login');
      return;
    }

    // SEAT MAP DISABLED - Always use simple booking
    if (numberOfTickets > event.availableSeats) {
      toast.error(`Only ${event.availableSeats} seats available`);
      return;
    }

    setBooking(true);

    try {
      const bookingData = {
        eventId: event._id,
        numberOfTickets: numberOfTickets
      };

      const res = await API.post('/bookings', bookingData);

      toast.success('Booking created! Proceeding to payment...');
      navigate(`/checkout/${res.data.booking._id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container">
        <div className="error-page">
          <h2>Event not found</h2>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // SEAT MAP DISABLED - Always use simple pricing
  const displayTotalPrice = (event?.price || 0) * numberOfTickets;

  return (
    <div className="event-details">
      <div className="event-hero">
        <img src={event.image} alt={event.title} />
        <div className="event-hero-overlay">
          <div className="container">
            <div className="event-badge">{event.category}</div>
            <h1>{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="event-details-content">
          <div className="event-main">
            <section className="detail-section">
              <h2>About This Event</h2>
              <p className="event-description-full">{event.description}</p>
            </section>

            <section className="detail-section">
              <h2>Event Details</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-icon">📅</span>
                  <div>
                    <p className="detail-label">Date</p>
                    <p className="detail-value">{formatDate(event.date)}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">🕒</span>
                  <div>
                    <p className="detail-label">Time</p>
                    <p className="detail-value">{event.time}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <div>
                    <p className="detail-label">Venue</p>
                    <p className="detail-value">{event.venue}</p>
                    <p className="detail-sub">{event.address}, {event.city}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">🎫</span>
                  <div>
                    <p className="detail-label">Available Seats</p>
                    <p className="detail-value">
                      {event.availableSeats} / {event.totalSeats}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SEAT MAP DISABLED */}
          </div>

          <div className="event-sidebar">
            <div className="booking-card">
              <div className="price-section">
                <p className="price-label">Ticket Price</p>
                <p className="price-amount">${event.price}</p>
              </div>

              <div className="ticket-selector">
                    <label htmlFor="tickets">Number of Tickets</label>
                    <div className="ticket-input-group">
                      <button
                        className="ticket-btn"
                        onClick={() => setNumberOfTickets(Math.max(1, numberOfTickets - 1))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        id="tickets"
                        min="1"
                        max={event.availableSeats}
                        value={numberOfTickets}
                        onChange={(e) => setNumberOfTickets(parseInt(e.target.value) || 1)}
                        className="ticket-input"
                      />
                      <button
                        className="ticket-btn"
                        onClick={() => setNumberOfTickets(Math.min(event.availableSeats, numberOfTickets + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>

              <div className="total-section">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>${displayTotalPrice.toFixed(2)}</span>
                </div>
                <div className="total-row total-final">
                  <span>Total</span>
                  <span>${displayTotalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-block btn-book"
                onClick={handleBooking}
                disabled={booking || event.availableSeats === 0}
              >
                {booking
                  ? 'Processing...'
                  : event.availableSeats === 0
                  ? 'Sold Out'
                  : 'Book Now'}
              </button>

              {event.availableSeats < 50 && event.availableSeats > 0 && (
                <div className="urgency-notice">
                  ⚠️ Only {event.availableSeats} tickets left!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;