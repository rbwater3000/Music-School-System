import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { auth, db } from '../../firebase'; // Adjust path
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './UserPass.css'; // We will create this CSS

const UserPass = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch extra user details (like Name) from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } else {
        navigate('/login'); // Kick out if not logged in
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (!user) return <div className="loading-screen">Loading Pass...</div>;

  return (
    <div className="pass-container">
      <div className="id-card">
        <div className="id-header">
          <h2>MixLab Music Studios</h2>
          <span className="member-type">Scan to Check in</span>
        </div>

        <div className="qr-wrapper">
          {/* This QR contains the User's UID */}
          <QRCode 
            value={user.uid} 
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
          />
        </div>

        <div className="id-details">
          <h3>{userData ? `${userData.firstName} ${userData.lastName}` : user.email}</h3>
          <p className="uid-text">ID: {user.uid.slice(0, 8)}...</p>
          <div className="active-status">
            <span className="dot"></span> Ready to Check-In
          </div>
        </div>
      </div>
      
      <button className="back-btn" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
};

export default UserPass;