import React, { useEffect, useState } from 'react';
import './Admin.css';
import { db, auth } from '../../firebase'; 
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { FaChartLine, FaCalendarAlt, FaSignOutAlt, FaEdit, FaSave, FaQrcode, FaTimes, FaTrashAlt, FaUserEdit } from 'react-icons/fa';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stats, setStats] = useState({ recording: 0, rehearsal: 0, lesson: 0, mixing: 0 });
  const [isEditingRevenue, setIsEditingRevenue] = useState(false);
  const [revenueData, setRevenueData] = useState([
    { name: 'Date 1', revenue: 0 }, { name: 'Date 2', revenue: 0 },
    { name: 'Date 3', revenue: 0 }, { name: 'Date 4', revenue: 0 },
    { name: 'Date 5', revenue: 0 }, { name: 'Date 6', revenue: 0 },
    { name: 'Date 7', revenue: 0 }, { name: 'Date 8', revenue: 0 },
  ]);
  const [editInfo, setEditInfo] = useState({ user: '', date: null });
  const [qrModal, setQrModal] = useState({ show: false, data: null });

  // --- HIDE FOOTER LOGIC ---
  useEffect(() => {
    // 1. Find the footer (It usually has a <footer> tag or a class 'footer')
    const footer = document.querySelector('footer') || document.querySelector('.footer');
    
    if (footer) {
      // 2. Hide it
      footer.style.display = 'none';
    }

    // 3. Cleanup: Show it again when leaving this page
    return () => {
      if (footer) {
        footer.style.display = ''; 
      }
    };
  }, []);
  // -------------------------

  useEffect(() => {
    fetchBookings();
    fetchRevenueData(); 
  }, []);

  const fetchBookings = async () => {
    try {
      const q = query(collection(db, "bookings"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const bookingList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(bookingList);
      calculateStats(bookingList);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const docRef = doc(db, "admin", "revenue_stats");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const dbData = docSnap.data();
        if (dbData.data) setRevenueData(dbData.data);
        if (dbData.lastUpdatedBy) {
            setEditInfo({
                user: dbData.lastUpdatedBy,
                date: dbData.lastUpdatedAt?.toDate().toLocaleString()
            });
        }
      }
    } catch (error) {
      console.error("Error fetching revenue:", error);
    }
  };

  const calculateStats = (data) => {
    let counts = { recording: 0, rehearsal: 0, lesson: 0, mixing: 0 };
    data.forEach(b => {
      const service = b.service || "";
      if (service.includes("Recording")) counts.recording++;
      else if (service.includes("Rehearsal")) counts.rehearsal++;
      else if (service.includes("Lesson")) counts.lesson++;
      else if (service.includes("Mix")) counts.mixing++;
    });
    setStats(counts);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const bookingRef = doc(db, "bookings", id);
      await updateDoc(bookingRef, { status: newStatus });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleRevenueChange = (index, field, value) => {
    const newData = revenueData.map((item, i) => {
      if (i === index) {
        return { 
          ...item, 
          [field]: field === 'revenue' ? (value === '' ? 0 : parseInt(value)) : value 
        };
      }
      return item;
    });
    setRevenueData(newData);
  };

  const handleResetData = () => {
    const blankData = Array(8).fill(null).map((_, i) => ({ 
        name: `Date ${i+1}`, revenue: 0 
    }));
    setRevenueData(blankData);
  };

  const saveRevenueToDb = async () => {
    if (!auth.currentUser) {
        alert("You must be logged in to save.");
        return;
    }
    try {
      const currentUserEmail = auth.currentUser.email;
      const now = new Date();
      await setDoc(doc(db, "admin", "revenue_stats"), {
        data: revenueData.map(d => ({...d, revenue: Number(d.revenue) || 0})),
        lastUpdatedBy: currentUserEmail, 
        lastUpdatedAt: now               
      });
      setEditInfo({ user: currentUserEmail, date: now.toLocaleString() });
      setIsEditingRevenue(false); 
      alert("Revenue data saved successfully!");
    } catch (error) {
      console.error("Error saving revenue:", error);
      alert("Failed to save data.");
    }
  };

  const handleAdminLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const graphData = revenueData.map(d => ({
    ...d,
    revenue: Number(d.revenue) || 0
  }));

  const serviceData = [
    { name: 'Band Rehearsal', count: stats.rehearsal },
    { name: 'Recording', count: stats.recording },
    { name: 'Music Lessons', count: stats.lesson },
    { name: 'Mixing', count: stats.mixing },
  ];
  const COLORS = ['#00C49F', '#FFbb28', '#FF8042', '#FFD700']; 

  return (
    <div className="admin-wrapper">
      <div className="admin-sidebar">
        <div className="sidebar-logo"><h2>MixLab Admin</h2></div>
        <ul className="sidebar-menu">
          <li className={activeTab === 'Dashboard' ? 'active' : ''} onClick={() => setActiveTab('Dashboard')}>
            <FaChartLine /> <span>Dashboard</span>
          </li>
          <li className={activeTab === 'Bookings' ? 'active' : ''} onClick={() => setActiveTab('Bookings')}>
            <FaCalendarAlt /> <span>Schedule</span>
          </li>
        </ul>
        <div className="sidebar-logout">
          <button onClick={handleAdminLogout}><FaSignOutAlt /> <span>Log Out</span></button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-header">
            <div><h1>{activeTab}</h1><p className="date-sub">{new Date().toDateString()}</p></div>
            <div className="admin-user-profile"><span>Admin Mode</span></div>
        </div>

        {activeTab === 'Dashboard' && (
           <>
            <div className="charts-row">
                <div className="chart-card large">
                    <div className="card-header-row">
                        <div>
                            <h3>Revenue Trend</h3>
                            {editInfo.user && (
                                <p className="last-edited">
                                    <FaUserEdit style={{marginRight:'5px'}}/> 
                                    Last edit by <span style={{color:'#ffd700'}}>{editInfo.user}</span>
                                    <br/>
                                    <span style={{fontSize:'10px', marginLeft:'20px'}}>{editInfo.date}</span>
                                </p>
                            )}
                        </div>
                        <div style={{display:'flex', gap:'10px'}}>
                            {isEditingRevenue ? (
                                <>
                                    <button className="edit-btn" onClick={handleResetData} style={{borderColor:'#ff4444', color:'#ff4444'}}>
                                        <FaTrashAlt /> Reset
                                    </button>
                                    <button className="edit-btn save-mode" onClick={saveRevenueToDb}>
                                        <FaSave /> Save
                                    </button>
                                </>
                            ) : (
                                <button className="edit-btn" onClick={() => setIsEditingRevenue(true)}>
                                    <FaEdit /> Edit Data
                                </button>
                            )}
                        </div>
                    </div>

                    {isEditingRevenue && (
                        <div className="revenue-editor">
                            {revenueData.map((item, idx) => (
                                <div key={idx} className="rev-input-group">
                                    <input type="text" className="date-input" value={item.name} onChange={(e) => handleRevenueChange(idx, 'name', e.target.value)} placeholder="Label"/>
                                    <input type="number" value={item.revenue} onChange={(e) => handleRevenueChange(idx, 'revenue', e.target.value)} placeholder="0"/>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                        <AreaChart data={graphData}>
                            <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ffd700" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip contentStyle={{background: '#333', border: 'none'}} />
                            <Area type="monotone" dataKey="revenue" stroke="#ffd700" fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Bookings by Service Type</h3>
                    <div style={{ width: '100%', height: 200, marginTop: '20px' }}>
                        <ResponsiveContainer>
                        <BarChart data={serviceData}>
                            <XAxis dataKey="name" hide />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{background: '#333', border: 'none'}} />
                            <Bar dataKey="count" fill="#8884d8" barSize={40}>
                                {serviceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="service-grid">
                        <div className="stat-box"><span>Band Rehearsal</span><h3>{stats.rehearsal}</h3></div>
                        <div className="stat-box"><span>Recording</span><h3>{stats.recording}</h3></div>
                        <div className="stat-box"><span>Music Lessons</span><h3>{stats.lesson}</h3></div>
                        <div className="stat-box"><span>Mixing & Prod</span><h3>{stats.mixing}</h3></div>
                    </div>
                </div>
            </div>
           </>
        )}

        <div className="bookings-section">
            <h3>Recent Booking Schedules</h3>
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Ref ID</th>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Date & Time</th>
                            <th>QR Code</th>
                            <th>Status (Edit)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((b) => (
                            <tr key={b.id}>
                                <td className="highlight">{b.bookingId}</td>
                                <td>{b.userEmail}</td>
                                <td>{b.service}</td>
                                <td>{b.date} <br/><small>{b.time}</small></td>
                                <td>
                                    <button className="view-qr-btn" onClick={() => setQrModal({ show: true, data: `BookingID:${b.bookingId} | User:${b.userEmail}` })}>
                                        <FaQrcode /> View
                                    </button>
                                </td>
                                <td>
                                    <select className={`status-select ${b.status}`} value={b.status} onChange={(e) => handleStatusChange(b.id, e.target.value)}>
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="On-going">On-going</option>
                                        <option value="Done">Done</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

      {qrModal.show && (
          <div className="modal-overlay" onClick={() => setQrModal({ show: false, data: null })}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="close-modal" onClick={() => setQrModal({ show: false, data: null })}> <FaTimes /> </button>
                  <h3>Customer QR Code</h3>
                  <div className="qr-box"> <QRCode value={qrModal.data} size={200} /> </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;