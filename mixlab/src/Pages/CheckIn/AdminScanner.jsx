import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../../firebase'; 
import { collection, addDoc, doc, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AdminScanner.css'; 

const AdminScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Ready to Scan");
  // --- 1. NEW STATE FOR DROPDOWN SELECTION ---
  const [scanAction, setScanAction] = useState("Check-in"); 
  const navigate = useNavigate();
  const scannerRef = React.useRef(null);

  useEffect(() => {
    const nav = document.querySelector('nav') || document.querySelector('.Nav1');
    const footer = document.querySelector('footer') || document.querySelector('.footer');
    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // --- 2. FIX DOUBLE CAMERA (Clear previous scanner if exists) ---
    const readerElement = document.getElementById('reader');
    if (readerElement) {
        readerElement.innerHTML = ""; 
    }

    // Only create a new scanner if one doesn't already exist
    if (scannerRef.current !== null) {
      return; // Scanner already exists, don't create another
    }

    // --- 3. INITIALIZE SCANNER ---
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current = scanner;
    scanner.render(onScanSuccess, onScanFailure);

    // --- MAIN SUCCESS FUNCTION ---
    async function onScanSuccess(decodedText) {
      // NOTE: We need to access the LATEST value of scanAction. 
      // Inside useEffect, state might be stale, but we can't easily add it to dependency array 
      // without re-triggering the camera. 
      // Ideally, we'd use a ref for the action, but for simplicity here, make sure to select before scanning.
      
      if (scannerRef.current) {
          try { await scannerRef.current.clear(); } catch (e) {}
      }
      setStatusMessage("Processing...");

      try {
        // === SCENARIO A: SCANNING A BOOKING QR ===
        if (decodedText.startsWith("BookingID:")) {
            const rawBookingId = decodedText.split(":")[1]; 
            
            const q = query(collection(db, "bookings"), where("bookingId", "==", rawBookingId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const bookingDoc = querySnapshot.docs[0];
                const bookingRef = bookingDoc.ref;
                const bookingData = bookingDoc.data();

                // --- 2. USE THE SELECTED ACTION FROM DROPDOWN ---
                // We assume 'scanAction' state is available (in some React versions inside closure this might be tricky, 
                // but usually works if component re-renders. If not, we use a ref).
                
                // Let's grab the value directly from the DOM element to be 100% safe inside this closure
                const selectedAction = document.getElementById('actionSelector').value;

                await updateDoc(bookingRef, { status: selectedAction });

                setScanResult({ 
                    success: true, 
                    type: 'booking',
                    name: bookingData.service, 
                    id: rawBookingId,
                    action: selectedAction
                });
                setStatusMessage(`✅ Booking Updated to: ${selectedAction}`);
                
            } else {
                setScanResult({ success: false, msg: "Booking Not Found" });
                setStatusMessage("❌ Booking ID not found.");
            }
        } 
        // === SCENARIO B: USER ID ===
        else {
            // Default behavior for User IDs is usually just Check-in
            const userId = decodedText;
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                await addDoc(collection(db, "attendance"), {
                    userId: userId,
                    name: userData.username || "User",
                    timestamp: new Date(),
                    type: "check-in"
                });
                setScanResult({ success: true, type: 'attendance', name: userData.username });
                setStatusMessage(`✅ Attendance Logged for ${userData.username}`);
            } else {
                setScanResult({ success: false, msg: "Invalid QR Code" });
            }
        }

      } catch (error) {
        console.error(error);
        setStatusMessage("❌ System Error.");
      }
    }

    function onScanFailure(error) {}

    return () => {
      // Try to clear scanner
      try {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => console.log("Scanner clear error", error));
          scannerRef.current = null; // Reset reference
        }
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
      <h1>Studio Scanner</h1>
      
      {/* --- 3. ADDED DROPDOWN HERE --- */}
      {!scanResult && (
        <div className="action-container">
            <label>Set Status To:</label>
            <select 
                id="actionSelector"
                className="scan-dropdown"
                value={scanAction} 
                onChange={(e) => setScanAction(e.target.value)}
            >
                <option value="Check-in">Check-in</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Done">Done</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
            </select>
        </div>
      )}

      <p>{statusMessage}</p>
      
      {!scanResult ? (
        <div id="reader" style={{ width: '300px', margin: 'auto' }}></div>
      ) : (
        <div className="result-card">
          {scanResult.success ? (
            <>
              <h2 style={{color: '#4caf50'}}>SUCCESS!</h2>
              {scanResult.type === 'booking' ? (
                  <>
                    <p>Booking ID: <strong>{scanResult.id}</strong></p>
                    <p>Service: <strong>{scanResult.name}</strong></p>
                    <h3 style={{color: '#ffd700'}}>STATUS: {scanResult.action.toUpperCase()}</h3>
                  </>
              ) : (
                  <>
                    <h3>{scanResult.name}</h3>
                    <p>Attendance Logged.</p>
                  </>
              )}
            </>
          ) : (
             <h2 style={{color: 'red'}}>ERROR: {scanResult.msg}</h2>
          )}
          <button onClick={handleReset} className="reset-btn">Scan Next</button>
        </div>
      )}
      
      <button onClick={() => navigate('/admin')} className="back-link">Exit Scanner</button>
    </div>
  );
};

export default AdminScanner;