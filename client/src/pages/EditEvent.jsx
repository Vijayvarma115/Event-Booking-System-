import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../utils/api';
import './EventForm.css';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'concert',
    venue: '',
    address: '',
    city: '',
    date: '',
    time: '',
    duration: 120,
    price: '',
    totalSeats: '',
    availableSeats: '',
    image: '',
    featured: false,
    status: 'upcoming'
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // SEAT MAP FEATURE DISABLED
  const seatMapEnabled = false;
  const sections = [];

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/events/${id}`);
      const event = res.data.event;

      // Format date for input
      const eventDate = new Date(event.date).toISOString().split('T')[0];

      setFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        venue: event.venue,
        address: event.address,
        city: event.city,
        date: eventDate,
        time: event.time,
        duration: event.duration || 120,
        price: event.price,
        totalSeats: event.totalSeats,
        availableSeats: event.availableSeats,
        image: event.image,
        featured: event.featured,
        status: event.status
      });

      // Seat map disabled - ignore any seat map data

      setLoading(false);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
      navigate('/admin');
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  // Seat Map Helper Functions
  const addSection = () => {
    const newSection = {
      sectionId: `section-${Date.now()}`,
      name: '',
      price: 0,
      color: '#3498db',
      rows: []
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (sectionIdx, field, value) => {
    const newSections = [...sections];
    newSections[sectionIdx][field] = value;
    setSections(newSections);
  };

  const removeSection = (sectionIdx) => {
    const newSections = sections.filter((_, idx) => idx !== sectionIdx);
    setSections(newSections);
  };

  const addRow = (sectionIdx) => {
    const newSections = [...sections];
    const newRow = {
      rowId: '',
      seats: []
    };
    newSections[sectionIdx].rows.push(newRow);
    setSections(newSections);
  };

  const updateRow = (sectionIdx, rowIdx, field, value) => {
    const newSections = [...sections];
    newSections[sectionIdx].rows[rowIdx][field] = value;
    setSections(newSections);
  };

  const removeRow = (sectionIdx, rowIdx) => {
    const newSections = [...sections];
    newSections[sectionIdx].rows = newSections[sectionIdx].rows.filter((_, idx) => idx !== rowIdx);
    setSections(newSections);
  };

  const generateSeats = (sectionIdx, rowIdx, count) => {
    const newSections = [...sections];
    const row = newSections[sectionIdx].rows[rowIdx];

    row.seats = Array.from({ length: parseInt(count) || 0 }, (_, i) => ({
      seatId: `${row.rowId}${i + 1}`,
      number: `${i + 1}`,
      status: 'available'
    }));

    setSections(newSections);
  };

  const validateSeatMap = () => {
    if (!seatMapEnabled) return true;

    if (sections.length === 0) {
      toast.error('Please add at least one section to the seat map');
      return false;
    }

    for (const section of sections) {
      if (!section.name || !section.price) {
        toast.error('All sections must have name and price');
        return false;
      }

      if (section.rows.length === 0) {
        toast.error(`Section "${section.name}" must have at least one row`);
        return false;
      }

      for (const row of section.rows) {
        if (!row.rowId) {
          toast.error(`Section "${section.name}" has rows without row IDs`);
          return false;
        }

        if (row.seats.length === 0) {
          toast.error(`Row "${row.rowId}" in section "${section.name}" must have at least one seat`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (parseFloat(formData.price) < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    if (parseInt(formData.totalSeats) < 1) {
      toast.error('Total seats must be at least 1');
      return;
    }

    if (parseInt(formData.availableSeats) > parseInt(formData.totalSeats)) {
      toast.error('Available seats cannot exceed total seats');
      return;
    }

    setSubmitting(true);

    try {
      const eventData = {
        ...formData,
        price: parseFloat(formData.price),
        totalSeats: parseInt(formData.totalSeats),
        availableSeats: parseInt(formData.availableSeats),
        duration: parseInt(formData.duration)
      };

      await API.put(`/events/${id}`, eventData);
      toast.success('Event updated successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  return (
    <div className="event-form-page">
      <div className="container">
        <div className="form-header">
          <h1>Edit Event</h1>
          <p>Update event details</p>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Event Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="concert">Concert</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="sports">Sports</option>
                  <option value="festival">Festival</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="image">Image URL</label>
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Location Details</h3>
            
            <div className="form-group">
              <label htmlFor="venue">Venue Name *</label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Date & Time</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Event Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">Event Time *</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (minutes) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="form-control"
                required
                min="15"
                step="15"
                placeholder="120"
              />
              <small className="form-text">Event duration in minutes (default: 120 = 2 hours)</small>
            </div>
          </div>

          <div className="form-section">
            <h3>Pricing & Capacity</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Ticket Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-control"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalSeats">Total Seats *</label>
                <input
                  type="number"
                  id="totalSeats"
                  name="totalSeats"
                  value={formData.totalSeats}
                  onChange={handleChange}
                  className="form-control"
                  required
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="availableSeats">Available Seats *</label>
                <input
                  type="number"
                  id="availableSeats"
                  name="availableSeats"
                  value={formData.availableSeats}
                  onChange={handleChange}
                  className="form-control"
                  required
                  min="0"
                  max={formData.totalSeats}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group-checkbox">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
              />
              <label htmlFor="featured">Mark as Featured Event</label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;