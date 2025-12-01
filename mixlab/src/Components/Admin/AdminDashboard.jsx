import React, { useEffect, useState } from 'react';
import './Admin.css';
import { db, auth } from '../../firebase'; 
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, setDoc, limit } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { 
    FaChartLine, FaCalendarAlt, FaSignOutAlt, FaEdit, FaSave, 
    FaQrcode, FaTimes, FaTrashAlt, FaUserEdit, FaUsers, 
    FaCreditCard, FaBell, FaBars, FaFileAlt 
} from 'react-icons/fa';
import AdminReports from './adminReports';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data States
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [payments, setPayments] = useState([]);   
  const [notifications, setNotifications] = useState([]); 

  // Stats & Graphs
  const [stats, setStats] = useState({ recording: 0, rehearsal: 0, lesson: 0, mixing: 0 });
  const [isEditingRevenue, setIsEditingRevenue] = useState(false);
  const [revenueData, setRevenueData] = useState([]);
  const [editInfo, setEditInfo] = useState({ user: '', date: null });
  const [qrModal, setQrModal] = useState({ show: false, data: null });

  // --- HIDE FOOTER LOGIC ---
  useEffect(() => {
    const footer = document.querySelector('footer') || document.querySelector('.footer');
    if (footer) footer.style.display = 'none';
    return () => { if (footer) footer.style.display = ''; };
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchRevenueData(); 
    fetchUsers(); 
  }, []);

  // --- FETCH FUNCTIONS ---
  const fetchBookings = async () => {
    try {
      const q = query(collection(db, "bookings"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const bookingList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(bookingList);
      calculateStats(bookingList);
      generatePayments(bookingList);      
      generateNotifications(bookingList); 
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const uList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsersList(uList);
    } catch (error) {
        console.error("Error fetching users:", error);
    }
  }

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
      } else {
        const blankData = Array(8).fill(null).map((_, i) => ({ name: `Date ${i+1}`, revenue: 0 }));
        setRevenueData(blankData);
      }
    } catch (error) {
      console.error("Error fetching revenue:", error);
    }
  };

  // --- LOGIC HELPERS ---
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

  const generatePayments = (data) => {
    const paidBookings = data.filter(b => b.status === 'Confirmed' || b.status === 'Done');
    const mockPayments = paidBookings.map(b => ({
        id: "PAY-" + b.bookingId,
        user: b.userEmail,
        amount: b.service.includes("Recording") ? 1500 : 500, 
        date: b.date,
        status: "Completed"
    }));
    setPayments(mockPayments);
  };

  const generateNotifications = (data) => {
    const recent = data.slice(0, 5); 
    const alerts = recent.map(b => ({
        id: b.id,
        message: `New Booking received from ${b.userEmail} for ${b.service}`,
        time: "Just now",
        isRead: false
    }));
    setNotifications(alerts);
  }

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

  const saveRevenueToDb = async () => {
    if (!auth.currentUser) return alert("Login required");
    try {
      const now = new Date();
      await setDoc(doc(db, "admin", "revenue_stats"), {
        data: revenueData.map(d => ({...d, revenue: Number(d.revenue) || 0})),
        lastUpdatedBy: auth.currentUser.email, 
        lastUpdatedAt: now               
      });
      setEditInfo({ user: auth.currentUser.email, date: now.toLocaleString() });
      setIsEditingRevenue(false); 
      alert("Saved!");
    } catch (error) { console.error(error); alert("Failed"); }
  };

  const handleAdminLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const graphData = revenueData.map(d => ({ ...d, revenue: Number(d.revenue) || 0 }));
  const serviceData = [
    { name: 'Band Rehearsal', count: stats.rehearsal },
    { name: 'Recording', count: stats.recording },
    { name: 'Music Lessons', count: stats.lesson },
    { name: 'Mixing', count: stats.mixing },
  ];
  const COLORS = ['#00C49F', '#FFbb28', '#FF8042', '#FFD700']; 

  return (
    <div className="admin-wrapper">
      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <div className="sidebar-logo"><h2>MixLab Admin</h2></div>
        
        <div className="admin-profile-mini">
            <div className="mini-info">
                <h4>Admin User</h4>
                <span>Administrator</span>
            </div>
        </div>

        <ul className="sidebar-menu">
          <li className={activeTab === 'Dashboard' ? 'active' : ''} onClick={() => { setActiveTab('Dashboard'); setSidebarOpen(false); }}>
            <FaChartLine /> <span>Dashboard</span>
          </li>
          <li className={activeTab === 'Users' ? 'active' : ''} onClick={() => { setActiveTab('Users'); setSidebarOpen(false); }}>
            <FaUsers /> <span>Users</span>
          </li>
          <li className={activeTab === 'Bookings' ? 'active' : ''} onClick={() => { setActiveTab('Bookings'); setSidebarOpen(false); }}>
            <FaCalendarAlt /> <span>Schedule</span>
          </li>
          <li className={activeTab === 'Payments' ? 'active' : ''} onClick={() => { setActiveTab('Payments'); setSidebarOpen(false); }}>
            <FaCreditCard /> <span>Payments</span>
          </li>
          <li className={activeTab === 'Notifications' ? 'active' : ''} onClick={() => { setActiveTab('Notifications'); setSidebarOpen(false); }}>
            <FaBell /> <span>Notifications</span>
            {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
          </li>
          <li className={activeTab === 'Reports' ? 'active' : ''} onClick={() => { setActiveTab('Reports'); setSidebarOpen(false); }}>
            <FaFileAlt /> <span>Reports</span>
          </li>
        </ul>
        <div className="sidebar-logout">
          <button onClick={handleAdminLogout}><FaSignOutAlt /> <span>Log Out</span></button>
        </div>
      </div>

      {/* Hamburger Menu Button - Mobile Only */}
      <button className="admin-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for Mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <div className="admin-content">
        <div className="admin-header">
            <div><h1>{activeTab}</h1><p className="date-sub">{new Date().toDateString()}</p></div>
            <div className="admin-user-profile"><span>Admin Mode</span></div>
        </div>

        {/* --- TAB: DASHBOARD --- */}
        {activeTab === 'Dashboard' && (
           <>
            {/* ITO YUNG SCANNER PARA SA QR */}
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => navigate('/admin-scanner')}
                    style={{
                        backgroundColor: '#303F9F',
                        color: 'white',
                        padding: '15px 25px',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    <FaCamera size={20} /> LAUNCH CHECK-IN SCANNER
                </button>
            </div>

            <div className="charts-row">
                {/* REVENUE CHART */}
                <div className="chart-card large">
                    <div className="card-header-row">
                        <div>
                            <h3>Revenue Trend</h3>
                            {editInfo.user && (
                                <p className="last-edited">
                                    <FaUserEdit style={{marginRight:'5px'}}/> {editInfo.user}
                                </p>
                            )}
                        </div>
                        <div style={{display:'flex', gap:'10px'}}>
                            {isEditingRevenue ? (
                                <button className="edit-btn save-mode" onClick={saveRevenueToDb}><FaSave /> Save</button>
                            ) : (
                                <button className="edit-btn" onClick={() => setIsEditingRevenue(true)}><FaEdit /> Edit</button>
                            )}
                        </div>
                    </div>

                    {isEditingRevenue && (
                        <div className="revenue-editor">
                            {revenueData.map((item, idx) => (
                                <div key={idx} className="rev-input-group">
                                    <input type="text" className="date-input" value={item.name} onChange={(e) => handleRevenueChange(idx, 'name', e.target.value)} />
                                    <input type="number" value={item.revenue} onChange={(e) => handleRevenueChange(idx, 'revenue', e.target.value)} />
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

                {/* SERVICE STATS */}
                <div className="chart-card">
                    <h3>Service Overview</h3>
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
                        <div className="stat-box"><span>Rehearsal</span><h3>{stats.rehearsal}</h3></div>
                        <div className="stat-box"><span>Recording</span><h3>{stats.recording}</h3></div>
                    </div>
                </div>
            </div>
           </>
        )}

        {/* --- TAB: USERS --- */}
        {activeTab === 'Users' && (
            <div className="bookings-section">
                <h3>Registered Users Database</h3>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Contact</th>
                                <th>Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((u) => (
                                <tr key={u.id}>
                                    <td className="highlight">{u.firstName} {u.lastName} <br/><small>{u.username}</small></td>
                                    <td>{u.email}</td>
                                    <td><span className={`badge ${u.role}`}>{u.role || 'user'}</span></td>
                                    <td>{u.contactNumber || 'N/A'}</td>
                                    <td>{u.address || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- TAB: SCHEDULE / BOOKINGS --- */}
        {activeTab === 'Bookings' && (
             <div className="bookings-section">
             <h3>All Booking Schedules</h3>
             <div className="table-wrapper">
                 <table>
                     <thead>
                         <tr>
                             <th>Ref ID</th>
                             <th>Customer</th>
                             <th>Service</th>
                             <th>Date</th>
                             <th>Code</th>
                             <th>Status</th>
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
                                     <button className="view-qr-btn" onClick={() => setQrModal({ show: true, data: `BookingID:${b.bookingId}` })}>
                                         <FaQrcode />
                                     </button>
                                 </td>
                                 <td>
                                     <select className={`status-select ${b.status}`} value={b.status} onChange={(e) => handleStatusChange(b.id, e.target.value)}>
                                         <option value="Pending">Pending</option>
                                         <option value="Confirmed">Confirmed</option>
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
        )}

        {/* --- TAB: PAYMENTS --- */}
        {activeTab === 'Payments' && (
             <div className="bookings-section">
             <h3>Transaction History</h3>
             <div className="table-wrapper">
                 <table>
                     <thead>
                         <tr>
                             <th>Transaction ID</th>
                             <th>User</th>
                             <th>Amount</th>
                             <th>Date</th>
                             <th>Status</th>
                         </tr>
                     </thead>
                     <tbody>
                         {payments.map((p, index) => (
                             <tr key={index}>
                                 <td className="highlight">{p.id}</td>
                                 <td>{p.user}</td>
                                 <td style={{color: '#4caf50', fontWeight:'bold'}}>₱{p.amount}</td>
                                 <td>{p.date}</td>
                                 <td><span className="badge done">{p.status}</span></td>
                             </tr>
                         ))}
                         {payments.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No completed payments yet.</td></tr>}
                     </tbody>
                 </table>
             </div>
         </div>
        )}

        {/* --- TAB: NOTIFICATIONS --- */}
        {activeTab === 'Notifications' && (
             <div className="bookings-section">
             <h3>System Notifications</h3>
             <div className="notif-list">
                {notifications.map((n, i) => (
                    <div className="notif-item" key={i}>
                        <div className="notif-icon"><FaBell /></div>
                        <div className="notif-content">
                            <h4>New Booking Alert</h4>
                            <p>{n.message}</p>
                            <span className="notif-time">{n.time}</span>
                        </div>
                    </div>
                ))}
                {notifications.length === 0 && <p>No new notifications.</p>}
             </div>
         </div>
        )}

        {activeTab === 'Reports' && (
          <AdminReports />
        )}

      </div>

      {qrModal.show && (
          <div className="modal-overlay" onClick={() => setQrModal({ show: false, data: null })}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="close-modal" onClick={() => setQrModal({ show: false, data: null })}> <FaTimes /> </button>
                  <QRCode value={qrModal.data} size={200} />
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;