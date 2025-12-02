import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { auth, db } from '../../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './UserPass.css'; 

const UserPass = () => {
  const [user, setUser] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // --- FETCH USER'S LATEST BOOKING (Real-time) ---
        const q = query(
            collection(db, "bookings"),
            where("userEmail", "==", currentUser.email), // Assuming you save email in bookings
            where("status", "in", ["Pending", "Confirmed"]), // Only show valid bookings
            orderBy("date", "asc"), // Get the soonest one
            limit(1)
        );

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const bookingData = snapshot.docs[0].data();
                setActiveBooking(bookingData);
            } else {
                setActiveBooking(null);
            }
        });

        return () => unsubscribeSnapshot();
      } else {
        navigate('/login'); 
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  if (!user) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="pass-container">
      <div className="id-card">
        <div className="id-header">
          <h2>MIXLAB STUDIO</h2>
          <span className="member-type">DIGITAL PASS</span>
        </div>

        <div className="qr-wrapper">
          {activeBooking ? (
              // --- GENERATE QR WITH BOOKING ID ---
              // The scanner looks for "BookingID:XYZ"
              <QRCode 
                value={`BookingID:${activeBooking.bookingId}`} 
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
          ) : (
              <div style={{height: 200, width: 200, display: 'flex', alignItems:'center', justifyContent:'center', color: 'black'}}>
                  No Active Bookings
              </div>
          )}
        </div>

        <div className="id-details">
          {activeBooking ? (
              <>
                <h3>{activeBooking.service}</h3>
                <p className="uid-text">Ref: {activeBooking.bookingId}</p>
                <p className="uid-text">{activeBooking.date} @ {activeBooking.time}</p>
                <div className="active-status">
                    <span className="dot"></span> Ready to Check-In
                </div>
              </>
          ) : (
              <h3>Hello, {user.displayName || "User"}</h3>
          )}
        </div>
      </div>
      
      <button className="back-btn" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
};

export default UserPass;