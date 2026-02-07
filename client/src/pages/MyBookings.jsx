import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../utils/api';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await API.get('/bookings');
      setBookings(res.data.bookings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await API.delete(`/bookings/${bookingId}`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled',
      attended: 'status-attended'
    };

    return (
      <span className={`status-badge ${statusClasses[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const statusClasses = {
      completed: 'payment-completed',
      pending: 'payment-pending',
      failed: 'payment-failed',
      refunded: 'payment-refunded'
    };

    return (
      <span className={`payment-badge ${statusClasses[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const filterBookings = () => {
    const now = new Date();

    if (filter === 'upcoming') {
      return bookings.filter(booking =>
        booking.event &&
        new Date(booking.event.date) >= now &&
        booking.bookingStatus !== 'cancelled'
      );
    } else if (filter === 'past') {
      return bookings.filter(booking =>
        booking.event &&
        (new Date(booking.event.date) < now ||
        booking.bookingStatus === 'cancelled')
      );
    }

    return bookings;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  const filteredBookings = filterBookings();

  return (
    <div className="my-bookings">
      <div className="container">
        <div className="bookings-header">
          <h1>My Bookings</h1>
          <p>Manage all your event bookings in one place</p>
        </div>

        <div className="bookings-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <div className="no-bookings-icon">🎫</div>
            <h2>No bookings found</h2>
            <p>You haven't booked any events yet. Start exploring!</p>
            <a href="/" className="btn btn-primary">
              Browse Events
            </a>
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => {
              // Handle deleted events
              if (!booking.event) {
                return (
                  <div key={booking._id} className="booking-card booking-deleted">
                    <div className="booking-details">
                      <div className="booking-header">
                        <h3>Event Deleted</h3>
                        <div className="booking-badges">
                          {getStatusBadge(booking.bookingStatus)}
                          {getPaymentBadge(booking.paymentStatus)}
                        </div>
                      </div>

                      <div className="booking-info-grid">
                        <div className="info-item">
                          <span className="info-label">Booking Reference</span>
                          <span className="info-value booking-ref">{booking.bookingReference}</span>
                        </div>

                        <div className="info-item">
                          <span className="info-label">Tickets</span>
                          <span className="info-value">{booking.numberOfTickets}</span>
                        </div>

                        <div className="info-item">
                          <span className="info-label">Total Amount</span>
                          <span className="info-value">${booking.totalAmount}</span>
                        </div>

                        <div className="info-item">
                          <span className="info-label">Booked On</span>
                          <span className="info-value">{formatDate(booking.createdAt)}</span>
                        </div>
                      </div>

                      <div className="deleted-event-notice">
                        <p>⚠️ This event has been deleted by the organizer.</p>
                        {booking.paymentStatus === 'completed' && booking.bookingStatus !== 'cancelled' && (
                          <p>Please contact support for a refund.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
              <div key={booking._id} className="booking-card">
                <div className="booking-image">
                  <img src={booking.event.image} alt={booking.event.title} />
                </div>

                <div className="booking-details">
                  <div className="booking-header">
                    <h3>{booking.event.title}</h3>
                    <div className="booking-badges">
                      {getStatusBadge(booking.bookingStatus)}
                      {getPaymentBadge(booking.paymentStatus)}
                    </div>
                  </div>

                  <div className="booking-info-grid">
                    <div className="info-item">
                      <span className="info-label">Date</span>
                      <span className="info-value">{formatDate(booking.event.date)}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Time</span>
                      <span className="info-value">{booking.event.time}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Venue</span>
                      <span className="info-value">{booking.event.venue}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Location</span>
                      <span className="info-value">{booking.event.city}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Tickets</span>
                      <span className="info-value">{booking.numberOfTickets}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Total Amount</span>
                      <span className="info-value">${booking.totalAmount}</span>
                    </div>
                  </div>

                  {/* Seat Information for seat-based bookings */}
                  {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                    <div className="booking-seats">
                      <h4>Your Seats</h4>

                      {/* Price Breakdown by Section */}
                      {booking.seatPriceBreakdown && booking.seatPriceBreakdown.length > 0 && (
                        <div className="seat-price-breakdown">
                          {booking.seatPriceBreakdown.map((section, idx) => (
                            <div key={idx} className="section-breakdown-item">
                              <span className="section-name">{section.sectionName}</span>
                              <span className="section-quantity">
                                {section.quantity} × ${section.pricePerSeat}
                              </span>
                              <span className="section-subtotal">${section.subtotal}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Seat Badges */}
                      <div className="seats-grid">
                        {booking.selectedSeats.map((seat, idx) => (
                          <div key={idx} className="seat-info-card">
                            <span className="seat-section">{seat.sectionName}</span>
                            <span className="seat-position">
                              Row {seat.rowId} - Seat {seat.seatNumber}
                            </span>
                            <span className="seat-price">${seat.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="booking-info-grid">
                    <div className="info-item">
                      <span className="info-label">Booking Reference</span>
                      <span className="info-value booking-ref">{booking.bookingReference}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Booked On</span>
                      <span className="info-value">{formatDate(booking.createdAt)}</span>
                    </div>
                  </div>

                  {booking.qrCode && booking.paymentStatus === 'completed' && (
                    <div className="booking-qr-code">
                      <h4>Your QR Code Ticket</h4>
                      <img src={booking.qrCode} alt="QR Code" className="qr-code-image" />
                      <p className="qr-code-note">Show this QR code at the event entrance</p>
                    </div>
                  )}

                  <div className="booking-actions">
                    {booking.bookingStatus === 'confirmed' && 
                     booking.paymentStatus === 'completed' && 
                     new Date(booking.event.date) > new Date() && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="btn btn-danger"
                      >
                        Cancel Booking
                      </button>
                    )}
                    
                    {booking.paymentStatus === 'pending' && (
                      <a
                        href={`/checkout/${booking._id}`}
                        className="btn btn-primary"
                      >
                        Complete Payment
                      </a>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;