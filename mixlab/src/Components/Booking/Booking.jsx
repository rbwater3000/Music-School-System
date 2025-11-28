import React, { useState, useEffect } from 'react';
import './Booking.css';
import { db, auth } from '../../firebase'; // Check path
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

const Booking = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Form State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [service, setService] = useState('Recording Session');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        alert("Please log in to book a session.");
        navigate('/login');
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [navigate]);

  // Handle Booking Submission
  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!date || !time) {
      alert("Please select a date and time.");
      setLoading(false);
      return;
    }

    try {
      // 1. Prepare Booking Data
      const bookingData = {
        userId: user.uid,
        userEmail: user.email,
        date: date,
        time: time,
        service: service,
        paymentMethod: paymentMethod,
        status: 'Pending', // Default status
        bookingId: Math.random().toString(36).substr(2, 9).toUpperCase(), // Random ID
        createdAt: new Date()
      };

      // 2. Save to Firebase "bookings" collection
      await addDoc(collection(db, "bookings"), bookingData);

      // 3. Redirect to Success Page with Data
      navigate('/booking-success', { state: bookingData });

    } catch (error) {
      console.error("Error booking:", error);
      alert("Failed to book. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h1>Book a Session</h1>
        <p className="subtitle">Select your schedule and payment</p>

        <form onSubmit={handleBooking}>
          
          {/* Date Selection */}
          <div className="input-group">
            <label>Select Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </div>

          {/* Time Selection */}
          <div className="input-group">
            <label>Select Time</label>
            <select value={time} onChange={(e) => setTime(e.target.value)} required>
              <option value="" disabled>Select a time slot</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="1:00 PM">1:00 PM</option>
              <option value="4:00 PM">4:00 PM</option>
              <option value="7:00 PM">7:00 PM</option>
            </select>
          </div>

          {/* Service Type */}
          <div className="input-group">
            <label>Service Type</label>
            <select value={service} onChange={(e) => setService(e.target.value)}>
              <option value="Recording Session">Recording Session</option>
              <option value="Mix & Mastering">Mix & Mastering</option>
              <option value="Rehearsal">Rehearsal</option>
              <option value="Music Lesson">Music Lesson</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="input-group">
            <label>Payment Method</label>
            <div className="payment-options">
              <label className={`payment-radio ${paymentMethod === 'Cash' ? 'active' : ''}`}>
                <input type="radio" value="Cash" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} />
                Cash (On-Site)
              </label>
              <label className={`payment-radio ${paymentMethod === 'Gcash' ? 'active' : ''}`}>
                <input type="radio" value="Gcash" checked={paymentMethod === 'Gcash'} onChange={() => setPaymentMethod('Gcash')} />
                GCash
              </label>
              <label className={`payment-radio ${paymentMethod === 'Maya' ? 'active' : ''}`}>
                <input type="radio" value="Maya" checked={paymentMethod === 'Maya'} onChange={() => setPaymentMethod('Maya')} />
                Maya
              </label>
            </div>
          </div>

          <button type="submit" className="booking-btn" disabled={loading}>
            {loading ? "Processing..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Booking;