import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events'); // events, bookings, stats

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        API.get('/events'),
        API.get('/bookings/all')
      ]);
      
      setEvents(eventsRes.data.events);
      setBookings(bookingsRes.data.bookings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await API.delete(`/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateStats = () => {
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const totalTicketsSold = bookings
      .filter(b => b.bookingStatus !== 'cancelled')
      .reduce((sum, b) => sum + b.numberOfTickets, 0);

    const upcomingEvents = events.filter(e => 
      new Date(e.date) > new Date()
    ).length;

    return { totalRevenue, totalTicketsSold, upcomingEvents };
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <Link to="/admin/events/create" className="btn btn-primary">
            + Create New Event
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#667eea' }}>📊</div>
            <div className="stat-info">
              <p className="stat-label">Total Revenue</p>
              <h3 className="stat-value">${stats.totalRevenue.toFixed(2)}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f093fb' }}>🎫</div>
            <div className="stat-info">
              <p className="stat-label">Tickets Sold</p>
              <h3 className="stat-value">{stats.totalTicketsSold}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#4facfe' }}>📅</div>
            <div className="stat-info">
              <p className="stat-label">Total Events</p>
              <h3 className="stat-value">{events.length}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#43e97b' }}>🔜</div>
            <div className="stat-info">
              <p className="stat-label">Upcoming Events</p>
              <h3 className="stat-value">{stats.upcomingEvents}</h3>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events ({events.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings ({bookings.length})
          </button>
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="events-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Available/Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id}>
                    <td>
                      <div className="event-cell">
                        <img src={event.image} alt={event.title} />
                        <div>
                          <p className="event-title">{event.title}</p>
                          <p className="event-venue">{event.venue}, {event.city}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{event.category}</span>
                    </td>
                    <td>{formatDate(event.date)}</td>
                    <td>${event.price}</td>
                    <td>
                      <span className={event.availableSeats < 50 ? 'seats-low' : ''}>
                        {event.availableSeats} / {event.totalSeats}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${event.status}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/admin/events/edit/${event._id}`}
                          className="btn-icon btn-edit"
                          title="Edit"
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="btn-icon btn-delete"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>Tickets</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id} className={!booking.event ? 'deleted-event-row' : ''}>
                    <td>
                      <code className="booking-ref">{booking.bookingReference}</code>
                    </td>
                    <td>
                      {booking.event ? (
                        booking.event.title
                      ) : (
                        <span className="deleted-event-text">⚠️ Event Deleted</span>
                      )}
                    </td>
                    <td>
                      {booking.user ? (
                        <div>
                          <p>{booking.user.name}</p>
                          <p className="user-email">{booking.user.email}</p>
                        </div>
                      ) : (
                        <span className="deleted-event-text">⚠️ User Deleted</span>
                      )}
                    </td>
                    <td>{booking.numberOfTickets}</td>
                    <td>${booking.totalAmount}</td>
                    <td>
                      <span className={`payment-badge payment-${booking.paymentStatus}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge booking-${booking.bookingStatus}`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td>{formatDate(booking.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;