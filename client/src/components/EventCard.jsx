import React from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      concert: '#e74c3c',
      conference: '#3498db',
      workshop: '#f39c12',
      sports: '#27ae60',
      festival: '#9b59b6',
      other: '#95a5a6'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="event-card">
      {event.featured && <div className="featured-badge">Featured</div>}
      <div className="event-image">
        <img src={event.image} alt={event.title} />
        <div 
          className="event-category" 
          style={{ backgroundColor: getCategoryColor(event.category) }}
        >
          {event.category.toUpperCase()}
        </div>
      </div>
      
      <div className="event-content">
        <h3 className="event-title">{event.title}</h3>
        
        <div className="event-info">
          <div className="info-item">
            <span className="icon">📅</span>
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="info-item">
            <span className="icon">🕒</span>
            <span>{event.time}</span>
          </div>
          <div className="info-item">
            <span className="icon">📍</span>
            <span>{event.city}</span>
          </div>
        </div>
        
        <p className="event-description">
          {event.description.substring(0, 100)}...
        </p>
        
        <div className="event-footer">
          <div className="event-price">
            <span className="price-label">From</span>
            <span className="price-amount">${event.price}</span>
          </div>
          
          <div className="event-seats">
            <span className={event.availableSeats < 50 ? 'seats-low' : ''}>
              {event.availableSeats} seats left
            </span>
          </div>
        </div>
        
        <Link to={`/events/${event._id}`} className="btn-view-event">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default EventCard;