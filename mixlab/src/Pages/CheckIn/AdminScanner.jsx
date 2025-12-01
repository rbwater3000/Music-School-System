import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../../firebase'; 
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AdminScanner.css'; 

const AdminScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Ready to Scan");
  const navigate = useNavigate();

  useEffect(() => {
    // --- 1. HIDE NAVBAR & FOOTER ---
    const nav = document.querySelector('nav') || document.querySelector('.Nav1');
    const footer = document.querySelector('footer') || document.querySelector('.footer');

    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // --- 2. FIX DOUBLE CAMERA (Clear container before starting) ---
    // This forces the div to be empty before we add a new scanner
    const readerElement = document.getElementById('reader');
    if (readerElement) {
        readerElement.innerHTML = ""; 
    }

    // --- 3. INITIALIZE SCANNER ---
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    async function onScanSuccess(decodedText) {
      scanner.clear(); 
      setStatusMessage("Processing...");

      try {
        const userId = decodedText;
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userName = userData.username || "Unknown User";

          await addDoc(collection(db, "attendance"), {
            userId: userId,
            name: userName,
            timestamp: new Date(),
            type: "check-in"
          });

          setScanResult({ success: true, name: userName });
          setStatusMessage(`✅ Success! ${userName} Checked In.`);
        } else {
          setScanResult({ success: false });
          setStatusMessage("❌ Invalid User ID.");
        }
      } catch (error) {
        console.error(error);
        setStatusMessage("❌ System Error.");
      }
    }

    function onScanFailure(error) {
      // Keep scanning silently
    }

    // --- 4. CLEANUP (Run when leaving page) ---
    return () => {
      // Try to clear scanner
      try {
        scanner.clear().catch(error => console.log("Scanner clear error", error));
      } catch (e) {
        console.log("Scanner cleanup", e);
      }

      // Show Nav/Footer again
      if (nav) nav.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  const handleReset = () => {
    window.location.reload(); 
  };

  return (
    <div className="scanner-page">
      <h1>Studio Check-In</h1>
      <p>{statusMessage}</p>
      
      {!scanResult ? (
        // The ID "reader" is where the camera appears
        <div id="reader" style={{ width: '300px', margin: 'auto' }}></div>
      ) : (
        <div className="result-card">
          {scanResult.success ? (
            <>
              <h2 style={{color: '#4caf50'}}>WELCOME!</h2>
              <h3>{scanResult.name}</h3>
              <p>You are now checked in.</p>
            </>
          ) : (
             <h2 style={{color: 'red'}}>ERROR: User Not Found</h2>
          )}
          <button onClick={handleReset} className="reset-btn">Scan Next Person</button>
        </div>
      )}
      
      <button onClick={() => navigate('/admin')} className="back-link">Exit Scanner</button>
    </div>
  );
};

export default AdminScanner;