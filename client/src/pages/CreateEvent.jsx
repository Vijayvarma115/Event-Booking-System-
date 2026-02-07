import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import API from '../utils/api';
import './EventForm.css';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
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
    image: '',
    featured: false
  });

  const [loading, setLoading] = useState(false);
  // SEAT MAP FEATURE DISABLED
  const seatMapEnabled = false;
  const sections = [];

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const addSection = () => {
    setSections([...sections, {
      sectionId: `section-${Date.now()}`,
      name: '',
      price: 0,
      color: '#3498db',
      rows: []
    }]);
  };

  const removeSection = (sectionIdx) => {
    setSections(sections.filter((_, idx) => idx !== sectionIdx));
  };

  const updateSection = (sectionIdx, field, value) => {
    const newSections = [...sections];
    newSections[sectionIdx][field] = value;
    setSections(newSections);
  };

  const addRow = (sectionIdx) => {
    const newSections = [...sections];
    newSections[sectionIdx].rows.push({
      rowId: '',
      seats: []
    });
    setSections(newSections);
  };

  const removeRow = (sectionIdx, rowIdx) => {
    const newSections = [...sections];
    newSections[sectionIdx].rows = newSections[sectionIdx].rows.filter((_, idx) => idx !== rowIdx);
    setSections(newSections);
  };

  const updateRow = (sectionIdx, rowIdx, field, value) => {
    const newSections = [...sections];
    newSections[sectionIdx].rows[rowIdx][field] = value;
    setSections(newSections);
  };

  const generateSeats = (sectionIdx, rowIdx, count) => {
    const newSections = [...sections];
    const row = newSections[sectionIdx].rows[rowIdx];
    const seatCount = parseInt(count) || 0;

    row.seats = Array.from({ length: seatCount }, (_, i) => ({
      seatId: `${row.rowId}${i + 1}`,
      number: `${i + 1}`,
      status: 'available'
    }));

    setSections(newSections);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!seatMapEnabled) {
      if (parseFloat(formData.price) < 0) {
        toast.error('Price cannot be negative');
        return;
      }

      if (parseInt(formData.totalSeats) < 1) {
        toast.error('Total seats must be at least 1');
        return;
      }
    } else {
      // Validate seat map
      if (sections.length === 0) {
        toast.error('Please add at least one section for the seat map');
        return;
      }

      for (const section of sections) {
        if (!section.name || !section.price) {
          toast.error('Please fill in all section names and prices');
          return;
        }
        if (section.rows.length === 0) {
          toast.error(`Section "${section.name}" must have at least one row`);
          return;
        }
        for (const row of section.rows) {
          if (!row.rowId) {
            toast.error(`Please provide Row ID for all rows in section "${section.name}"`);
            return;
          }
          if (row.seats.length === 0) {
            toast.error(`Row "${row.rowId}" in section "${section.name}" must have at least one seat`);
            return;
          }
        }
      }
    }

    const eventDate = new Date(formData.date);
    if (eventDate < new Date()) {
      toast.error('Event date must be in the future');
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        ...formData,
        price: parseFloat(formData.price),
        totalSeats: parseInt(formData.totalSeats),
        duration: parseInt(formData.duration)
      };

      await API.post('/events', eventData);
      toast.success('Event created successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-form-page">
      <div className="container">
        <div className="form-header">
          <h1>Create New Event</h1>
          <p>Fill in the details to create a new event</p>
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
                placeholder="e.g., Summer Music Festival 2026"
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
                placeholder="Describe your event in detail..."
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
                <label htmlFor="image">Image URL</label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="https://example.com/image.jpg"
                />
                <small className="form-text">Leave empty for default image</small>
              </div>
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
                placeholder="e.g., Madison Square Garden"
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
                  placeholder="Street address"
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
                  placeholder="e.g., New York"
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
                  min={new Date().toISOString().split('T')[0]}
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
                  placeholder="0.00"
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
                  placeholder="e.g., 100"
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
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;