import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import API from '../utils/api';
import './Checkout.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ booking }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (booking) {
      createPaymentIntent();
    }
  }, [booking]);

  const createPaymentIntent = async () => {
    try {
      const res = await API.post('/payments/create-intent', {
        bookingId: booking._id
      });
      setClientSecret(res.data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });

    if (error) {
      toast.error(error.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Update booking payment status
      try {
        await API.put(`/bookings/${booking._id}/payment`, {
          paymentStatus: 'completed',
          paymentIntentId: paymentIntent.id
        });
        
        toast.success('Payment successful! Booking confirmed.');
        navigate('/my-bookings');
      } catch (error) {
        console.error('Error updating booking:', error);
        toast.error('Payment successful but failed to update booking');
      }
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={!stripe || processing}
      >
        {processing ? 'Processing...' : `Pay $${booking?.totalAmount}`}
      </button>

      <div className="test-card-info">
        <p><strong>Test Card:</strong> 4242 4242 4242 4242</p>
        <p>Any future expiry date, any 3-digit CVC</p>
      </div>
    </form>
  );
};

const Checkout = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Check lock status for seat-based bookings (every 30 seconds)
  useEffect(() => {
    if (!booking || !booking.event.seatMapEnabled) return;

    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/seat-locks/${booking.event._id}/status`);

        if (!res.data.hasLock) {
          toast.error('Seat lock expired. Please select seats again.');
          navigate(`/events/${booking.event._id}`);
        }
      } catch (error) {
        console.error('Error checking lock status:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [booking, navigate]);

  const fetchBooking = async () => {
    try {
      const res = await API.get(`/bookings/${bookingId}`);
      
      // Check if payment is already completed
      if (res.data.booking.paymentStatus === 'completed') {
        toast.info('This booking is already paid for');
        navigate('/my-bookings');
        return;
      }
      
      setBooking(res.data.booking);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
      navigate('/');
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
        <p>Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-title">Complete Your Booking</h1>

        <div className="checkout-container">
          <div className="checkout-main">
            <div className="checkout-card">
              <h2>Payment Details</h2>
              <Elements stripe={stripePromise}>
                <CheckoutForm booking={booking} />
              </Elements>
            </div>
          </div>

          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>Order Summary</h3>

              <div className="summary-event">
                <img src={booking.event.image} alt={booking.event.title} />
                <div>
                  <h4>{booking.event.title}</h4>
                  <p className="event-date">{formatDate(booking.event.date)}</p>
                  <p className="event-time">{booking.event.time}</p>
                </div>
              </div>

              <div className="summary-details">
                {booking.selectedSeats && booking.selectedSeats.length > 0 ? (
                  <>
                    {/* Seat-based booking */}
                    {booking.seatPriceBreakdown.map((section, idx) => (
                      <div key={idx} className="summary-row">
                        <span>
                          {section.sectionName}
                          <small> ({section.quantity} × ${section.pricePerSeat})</small>
                        </span>
                        <span>${section.subtotal}</span>
                      </div>
                    ))}

                    <div className="seats-detail">
                      <h4>Your Seats:</h4>
                      <div className="seats-grid">
                        {booking.selectedSeats.map((seat, idx) => (
                          <span key={idx} className="seat-badge">
                            {seat.sectionName} - {seat.rowId}{seat.seatNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Legacy simple booking */}
                    <div className="summary-row">
                      <span>Ticket Price</span>
                      <span>${booking.event.price}</span>
                    </div>
                    <div className="summary-row">
                      <span>Number of Tickets</span>
                      <span>{booking.numberOfTickets}</span>
                    </div>
                  </>
                )}

                <div className="summary-row summary-total">
                  <span>Total Amount</span>
                  <span>${booking.totalAmount}</span>
                </div>
              </div>

              <div className="booking-reference">
                <p>Booking Reference</p>
                <code>{booking.bookingReference}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;