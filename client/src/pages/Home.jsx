import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import API from '../utils/api';
import './Home.css';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    city: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [filters, events]);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      setEvents(res.data.events);
      setFilteredEvents(res.data.events);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (filters.search) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(event => event.category === filters.category);
    }

    if (filters.city) {
      filtered = filtered.filter(event =>
        event.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Amazing Events</h1>
          <p>Book tickets for concerts, conferences, workshops, and more</p>
        </div>
      </section>

      <div className="container">
        <div className="filters-section">
          <div className="filter-group">
            <input
              type="text"
              name="search"
              placeholder="Search events..."
              value={filters.search}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="concert">Concert</option>
              <option value="conference">Conference</option>
              <option value="workshop">Workshop</option>
              <option value="sports">Sports</option>
              <option value="festival">Festival</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="filter-group">
            <input
              type="text"
              name="city"
              placeholder="City..."
              value={filters.city}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
        </div>

        <div className="events-header">
          <h2>Upcoming Events</h2>
          <span className="events-count">{filteredEvents.length} events found</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="no-events">
            <p>No events found matching your criteria</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;