import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import QRCode from "react-qr-code"; // Import the QR library
import './Booking.css';

const BookingSuccess = () => {
  const location = useLocation();
  const bookingData = location.state; // Get data passed from the form

  if (!bookingData) {
    return <div style={{color:'white', textAlign:'center', marginTop:'100px'}}>No booking found.</div>;
  }

  return (
    <div className="booking-container">
      <div className="booking-card" style={{textAlign: 'center'}}>
        <h1 style={{color: '#4BB543'}}>Booking Confirmed!</h1>
        <p className="subtitle">Please show this QR code at the studio.</p>

        {/* QR CODE GENERATION */}
        <div style={{ background: 'white', padding: '16px', display:'inline-block', borderRadius:'8px', margin:'20px 0' }}>
            <QRCode 
                value={`BookingID:${bookingData.bookingId} | User:${bookingData.userEmail}`} 
                size={200}
            />
        </div>
        
        <div style={{textAlign:'left', background:'#2b2b2b', padding:'20px', borderRadius:'8px', marginBottom:'20px'}}>
            <p><strong>Reference ID:</strong> <span style={{color:'#ffd700'}}>{bookingData.bookingId}</span></p>
            <p><strong>Date:</strong> {bookingData.date}</p>
            <p><strong>Time:</strong> {bookingData.time}</p>
            <p><strong>Service:</strong> {bookingData.service}</p>
            <p><strong>Payment:</strong> {bookingData.paymentMethod}</p>
        </div>

        <Link to="/" className="booking-btn" style={{textDecoration:'none', display:'block'}}>Back to Home</Link>
      </div>
    </div>
  );
};

export default BookingSuccess;