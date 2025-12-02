import React, { useEffect, useState } from 'react';
import './Admin.css';
import { db, auth } from '../../firebase'; 
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, setDoc, limit } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie, Legend
} from 'recharts';
import { 
    FaChartLine, FaCalendarAlt, FaSignOutAlt, FaEdit, FaSave, 
    FaQrcode, FaTimes, FaTrashAlt, FaUserEdit, FaUsers, 
    FaCreditCard, FaBell, FaBars, FaFileAlt, FaCamera 
} from 'react-icons/fa';
import { TrendingUp, TrendingDown, Users, DollarSign, CheckCircle, AlertCircle, Sparkles, Loader, Zap, Target, TrendingUpIcon, AlertTriangle, Lightbulb } from 'lucide-react';
import AdminReports from './adminReports';
import { generateRealTimeAnalysis } from '../../services/groqService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  const [aiInsights, setAiInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

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

  const generateKPIs = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthBookings = bookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });
    
    const confirmedBookings = thisMonthBookings.filter(b => b.status === 'Confirmed' || b.status === 'Done').length;
    const doneBookings = thisMonthBookings.filter(b => b.status === 'Done').length;
    const cancelledBookings = thisMonthBookings.filter(b => b.status === 'Cancelled').length;
    
    const bookingRate = thisMonthBookings.length > 0 ? ((confirmedBookings / thisMonthBookings.length) * 100).toFixed(1) : 0;
    const attendanceRate = confirmedBookings > 0 ? ((doneBookings / confirmedBookings) * 100).toFixed(1) : 0;
    const cancellationRate = thisMonthBookings.length > 0 ? ((cancelledBookings / thisMonthBookings.length) * 100).toFixed(1) : 0;
    const revenue = confirmedBookings * 500;
    const activeStudents = new Set(thisMonthBookings.map(b => b.userEmail)).size;
    
    return {
      revenue,
      activeStudents,
      bookingRate,
      attendanceRate,
      totalBookings: thisMonthBookings.length,
      cancellationRate
    };
  };

  const generateRevenueTrendData = () => {
    const last30Days = {};
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last30Days[dateStr] = 0;
    }

    bookings.forEach(b => {
      const bookingDate = new Date(b.date);
      const dateStr = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateStr in last30Days && (b.status === 'Confirmed' || b.status === 'Done')) {
        last30Days[dateStr] += 500;
      }
    });

    return Object.keys(last30Days).map(date => ({
      date,
      revenue: last30Days[date]
    }));
  };

  const generateBookingsTrendData = () => {
    const last14Days = {};
    const now = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last14Days[dateStr] = 0;
    }

    bookings.forEach(b => {
      const bookingDate = new Date(b.date);
      const dateStr = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateStr in last14Days) {
        last14Days[dateStr]++;
      }
    });

    return Object.keys(last14Days).map(date => ({
      date,
      bookings: last14Days[date]
    }));
  };

  const generateOccupancyData = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= todayStart && bookingDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    });
    
    const maxCapacity = 20;
    const occupancy = Math.min((todayBookings.length / maxCapacity) * 100, 100);
    
    return {
      occupancy: occupancy.toFixed(1),
      booked: todayBookings.length,
      available: Math.max(0, maxCapacity - todayBookings.length)
    };
  };

  const getUpcomingSessions = () => {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return bookings
      .filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= now && bookingDate <= sevenDaysLater && b.status !== 'Cancelled';
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 15);
  };

  const getRecentBookings = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return bookings
      .filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= oneDayAgo && bookingDate <= now;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  };

  const generateAIInsights = async () => {
    try {
      setInsightsLoading(true);
      const kpiData = generateKPIs();
      const now = new Date();
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay());
      
      const thisWeekBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= thisWeekStart && bookingDate <= now;
      });

      const todayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate.toDateString() === now.toDateString();
      });

      // Build studio data for Groq analysis
      const studioData = {
        sessionsToday: todayBookings.length,
        todayRevenue: todayBookings.filter(b => b.status === 'Done' || b.status === 'Confirmed').length * 500,
        activeStudentsNow: usersList.length,
        totalBookings: kpiData.totalBookings,
        confirmedBookings: kpiData.totalBookings * (kpiData.bookingRate / 100),
        conversionRate: parseFloat(kpiData.bookingRate),
        cancelledToday: todayBookings.filter(b => b.status === 'Cancelled').length,
        noShowsToday: todayBookings.filter(b => b.status === 'NoShow').length,
        topServices: [
          { name: 'Recording', bookings: stats.recording },
          { name: 'Rehearsal', bookings: stats.rehearsal },
          { name: 'Lessons', bookings: stats.lesson }
        ],
        revenueChangePercent: 0,
        bookingChangePercent: 0
      };

      // Call Groq API for real-time analysis
      const analysis = await generateRealTimeAnalysis(studioData);
      
      if (analysis) {
        setAiInsights(analysis);
      } else {
        // Fallback to hardcoded if API fails
        setAiInsights(getFallbackInsights(kpiData));
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      // Fallback to hardcoded insights
      const kpiData = generateKPIs();
      setAiInsights(getFallbackInsights(kpiData));
    } finally {
      setInsightsLoading(false);
    }
  };

  const getFallbackInsights = (kpiData) => {
    const insights = [];
    const alerts = [];
    const recommendations = [];

    if (kpiData.revenue > 0) {
      insights.push(`Revenue Health: ₱${kpiData.revenue.toLocaleString()} this month with ${kpiData.activeStudents} active students`);
    }
    
    if (kpiData.bookingRate > 70) {
      insights.push(`Strong Booking Rate: ${kpiData.bookingRate}% conversion rate indicates healthy demand`);
    } else if (kpiData.bookingRate > 50) {
      insights.push(`Moderate Booking Rate: ${kpiData.bookingRate}% - room for improvement`);
    }

    if (kpiData.attendanceRate > 80) {
      insights.push(`High Attendance: ${kpiData.attendanceRate}% of confirmed bookings completed`);
    }

    if (kpiData.cancellationRate > 20) {
      alerts.push(`High Cancellation Rate: ${kpiData.cancellationRate}% - investigate reasons and implement retention strategies`);
    }

    if (kpiData.attendanceRate < 60) {
      alerts.push(`Low Attendance: ${kpiData.attendanceRate}% - consider follow-up with no-show students`);
    }

    if (kpiData.activeStudents > 0) {
      recommendations.push(`Increase Revenue: Offer package deals or loyalty programs to existing ${kpiData.activeStudents} active students`);
    }

    if (kpiData.bookingRate < 70) {
      recommendations.push(`Boost Bookings: Launch targeted promotions or discounts to improve conversion rate from current ${kpiData.bookingRate}%`);
    }

    recommendations.push(`Optimize Scheduling: Review peak hours and adjust instructor availability to maximize occupancy`);

    return {
      insights: insights.slice(0, 5),
      alerts: alerts.slice(0, 2),
      recommendations: recommendations.slice(0, 3),
      generatedAt: new Date().toLocaleTimeString(),
      source: 'Fallback (Groq API unavailable)'
    };
  };

  // Generate chart-specific insights
  const generateChartInsight = (chartType) => {
    const chartInsights = {
      revenue: [
        'Revenue trend shows consistent monthly performance',
        'Peak revenue typically occurs mid-month',
        'Monitor seasonal patterns for forecasting'
      ],
      bookings: [
        'Booking trend indicates steady student demand',
        'Consistent bookings show strong engagement',
        'Plan capacity based on booking patterns'
      ],
      service: [
        'Service distribution shows customer preferences',
        'Top services generate highest revenue',
        'Consider promoting underperforming services'
      ],
      status: [
        'Booking status shows healthy mix',
        'Focus on converting pending to confirmed',
        'Monitor cancellations closely'
      ],
      occupancy: [
        'Studio occupancy indicates utilization',
        'Optimize scheduling during peak hours',
        'Aim for 70-80% occupancy for profitability'
      ],
      upcoming: [
        'Upcoming sessions show next 7 days activity',
        'Confirmed bookings indicate strong pipeline',
        'Send reminders 24 hours before sessions'
      ],
      recent: [
        'Recent bookings show last 24 hours activity',
        'Track booking patterns for marketing',
        'Follow up with pending bookings'
      ]
    };
    return chartInsights[chartType] || [];
  };

  // Chart Insight Box Component
  const ChartInsightBox = ({ chartType }) => {
    const insights = generateChartInsight(chartType);
    return (
      <div style={{ 
        marginTop: '15px', 
        padding: '12px', 
        backgroundColor: '#e8e8e8', 
        border: '1px solid #999', 
        borderRadius: '6px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <Lightbulb size={16} style={{ color: '#333', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#000', fontWeight: '600' }}>Key Insights:</p>
          <ul style={{ margin: '0', padding: '0 0 0 16px', listStyle: 'disc' }}>
            {insights.map((insight, idx) => (
              <li key={idx} style={{ fontSize: '11px', color: '#333', marginBottom: '4px', lineHeight: '1.4' }}>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const kpis = generateKPIs();
  const revenueTrendData = generateRevenueTrendData();
  const bookingsTrendData = generateBookingsTrendData();
  const occupancyData = generateOccupancyData();
  const upcomingSessions = getUpcomingSessions();
  const recentBookingsData = getRecentBookings();

  const graphData = revenueData.map(d => ({ ...d, revenue: Number(d.revenue) || 0 }));
  const serviceData = [
    { name: 'Band Rehearsal', count: stats.rehearsal },
    { name: 'Recording', count: stats.recording },
    { name: 'Music Lessons', count: stats.lesson },
    { name: 'Mixing', count: stats.mixing },
  ];
  const COLORS = ['#2563eb', '#3498db', '#4e73df', '#66d9ef']; 

  return (
    <div className="admin-wrapper">
      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>MixLab Admin</h2>
        </div>
        
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
          </li>
          <li className={activeTab === 'Reports' ? 'active' : ''} onClick={() => { setActiveTab('Reports'); setSidebarOpen(false); }}>
            <FaFileAlt /> <span>Reports</span>
          </li>
        </ul>
        <div className="sidebar-logout">
          <button onClick={handleAdminLogout}><FaSignOutAlt /> <span>Log Out</span></button>
        </div>
      </div>

      {/* Hamburger Menu Button - Outside Sidebar */}
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
           <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* LAUNCH CHECK-IN SCANNER BUTTON */}
            <div>
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
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        width: '250px',
                        justifyContent: 'center'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    <FaCamera size={20} /> LAUNCH CHECK-IN SCANNER
                </button>
            </div>

            {/* KPI CARDS - 6 CRITICAL METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ backgroundColor: '#dbeafe' }}>
                  <Users size={24} color="#2563eb" />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Total Revenue</p>
                  <h3 className="kpi-value">₱{(kpis.revenue || 0).toLocaleString()}</h3>
                  <span className="kpi-change">This month</span>
                  <p className="kpi-insight">{kpis.revenue > 50000 ? <><Zap size={14} style={{display: 'inline', marginRight: '6px'}} /> Strong revenue! Maintain momentum.</> : kpis.revenue > 0 ? <><TrendingUp size={14} style={{display: 'inline', marginRight: '6px'}} /> Good start. Promote services.</> : <><AlertTriangle size={14} style={{display: 'inline', marginRight: '6px'}} /> No revenue yet. Launch campaigns.</>}</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ backgroundColor: '#dbeafe' }}>
                  <Users size={24} color="#2563eb" />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Active Students</p>
                  <h3 className="kpi-value">{kpis.activeStudents || 0}</h3>
                  <span className="kpi-change">With bookings</span>
                  <p className="kpi-insight">{kpis.activeStudents > 20 ? <><Sparkles size={14} style={{display: 'inline', marginRight: '6px'}} /> Excellent base! Focus on retention.</> : kpis.activeStudents > 10 ? <><Users size={14} style={{display: 'inline', marginRight: '6px'}} /> Good growth. Acquire new students.</> : <><Target size={14} style={{display: 'inline', marginRight: '6px'}} /> Build your student base.</>}</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ backgroundColor: '#dbeafe' }}>
                  <TrendingUp size={24} color="#2563eb" />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Booking Rate</p>
                  <h3 className="kpi-value">{kpis.bookingRate || 0}%</h3>
                  <span className="kpi-change">Conversion rate</span>
                  <p className="kpi-insight">{kpis.bookingRate > 70 ? <><CheckCircle size={14} style={{display: 'inline', marginRight: '6px'}} /> Excellent conversion! Maintain quality.</> : kpis.bookingRate > 40 ? <><TrendingUp size={14} style={{display: 'inline', marginRight: '6px'}} /> Good. Optimize offerings.</> : <><AlertTriangle size={14} style={{display: 'inline', marginRight: '6px'}} /> Low conversion. Review pricing.</>}</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ backgroundColor: '#dbeafe' }}>
                  <CheckCircle size={24} color="#2563eb" />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Attendance Rate</p>
                  <h3 className="kpi-value">{kpis.attendanceRate || 0}%</h3>
                  <span className="kpi-change">Completed sessions</span>
                  <p className="kpi-insight">{kpis.attendanceRate > 80 ? <><CheckCircle size={14} style={{display: 'inline', marginRight: '6px'}} /> High attendance! Excellent engagement.</> : kpis.attendanceRate > 60 ? <><Zap size={14} style={{display: 'inline', marginRight: '6px'}} /> Acceptable. Send reminders.</> : <><AlertCircle size={14} style={{display: 'inline', marginRight: '6px'}} /> Low attendance. Follow up.</>}</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ backgroundColor: '#dbeafe' }}>
                  <FaCalendarAlt size={24} color="#2563eb" />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Total Bookings</p>
                  <h3 className="kpi-value">{kpis.totalBookings || 0}</h3>
                  <span className="kpi-change">This month</span>
                  <p className="kpi-insight">{kpis.totalBookings > 30 ? <><Sparkles size={14} style={{display: 'inline', marginRight: '6px'}} /> Strong demand! Scale services.</> : kpis.totalBookings > 10 ? <><TrendingUp size={14} style={{display: 'inline', marginRight: '6px'}} /> Steady bookings. Keep engagement.</> : <><AlertTriangle size={14} style={{display: 'inline', marginRight: '6px'}} /> Increase visibility.</>}</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ backgroundColor: '#dbeafe' }}>
                  <AlertCircle size={24} color="#2563eb" />
                </div>
                <div className="kpi-content">
                  <p className="kpi-label">Cancellation Rate</p>
                  <h3 className="kpi-value">{kpis.cancellationRate || 0}%</h3>
                  <span className="kpi-change">Cancelled bookings</span>
                  <p className="kpi-insight">{kpis.cancellationRate > 20 ? <><AlertTriangle size={14} style={{display: 'inline', marginRight: '6px'}} /> High cancellations. Review policies.</> : kpis.cancellationRate > 10 ? <><AlertCircle size={14} style={{display: 'inline', marginRight: '6px'}} /> Monitor. Improve flexibility.</> : <><CheckCircle size={14} style={{display: 'inline', marginRight: '6px'}} /> Low cancellations. Great commitment!</>}</p>
                </div>
              </div>
            </div>

            {/* CHARTS ROW 1 - Revenue Trend & Bookings Over Time */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <div className="chart-card">
                <h2>Revenue Trend (Last 30 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
                  </LineChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="revenue" />
              </div>

              <div className="chart-card">
                <h2>Bookings Over Time (Last 14 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={bookingsTrendData}>
                    <defs>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066cc" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0066cc" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                    <Area type="monotone" dataKey="bookings" stroke="#0066cc" fillOpacity={1} fill="url(#colorBookings)" />
                  </AreaChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="bookings" />
              </div>
            </div>

            {/* CHARTS ROW 2 - Revenue by Service & Booking Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <div className="chart-card">
                <h2>Revenue by Lesson Type (This Month)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count }) => `${name}: ${count}`}
                      outerRadius={80}
                      fill="#2563eb"
                      dataKey="count"
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="service" />
              </div>

              <div className="chart-card">
                <h2>Booking Status Distribution (This Week)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                    <Bar dataKey="count" fill="#28a745" />
                  </BarChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="status" />
              </div>
            </div>

            {/* OCCUPANCY GAUGE */}
            <div className="chart-card">
              <h2>Studio Occupancy - Today</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px', padding: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2563eb', marginBottom: '10px' }}>
                    {occupancyData.occupancy}%
                  </div>
                  <div style={{ color: '#888', fontSize: '14px' }}>
                    <p>{occupancyData.booked} booked / {occupancyData.available} available</p>
                  </div>
                </div>
                <div style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: `conic-gradient(#2563eb 0deg ${occupancyData.occupancy * 3.6}deg, #333 ${occupancyData.occupancy * 3.6}deg 360deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    backgroundColor: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#2563eb'
                  }}>
                    {occupancyData.occupancy}%
                  </div>
                </div>
              </div>
            </div>
            <ChartInsightBox chartType="occupancy" />

            {/* TABLES ROW - Upcoming Sessions & Recent Bookings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <div className="bookings-section">
                <h3>Upcoming Sessions (Next 7 Days)</h3>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Student</th>
                        <th>Service</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingSessions.slice(0, 10).map((b) => (
                        <tr key={b.id}>
                          <td>{new Date(b.date).toLocaleDateString()}</td>
                          <td>{b.time || 'N/A'}</td>
                          <td>{b.userEmail}</td>
                          <td>{b.service}</td>
                          <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                        </tr>
                      ))}
                      {upcomingSessions.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No upcoming sessions</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bookings-section">
                <h3>Recent Bookings (Last 24 Hours)</h3>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Student</th>
                        <th>Service</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookingsData.map((b) => (
                        <tr key={b.id}>
                          <td>{new Date(b.date).toLocaleTimeString()}</td>
                          <td>{b.userEmail}</td>
                          <td>{b.service}</td>
                          <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                        </tr>
                      ))}
                      {recentBookingsData.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No recent bookings</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {aiInsights && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {/* Real-time Insights */}
                <div className="chart-card" style={{ borderLeft: '4px solid #0066cc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0 }}>Real-time Insights & Recommendations</h2>
                    <button 
                      onClick={() => setAiInsights(null)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      OFF
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {aiInsights.insights && aiInsights.insights.length > 0 ? (
                      aiInsights.insights.map((insight, idx) => {
                        const text = typeof insight === 'string' ? insight : insight.description || '';
                        return (
                          <div key={idx} style={{
                            padding: '12px',
                            backgroundColor: 'transparent',
                            borderRadius: '8px',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            color: '#e0e0e0'
                          }}>
                            {text}
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: '#888' }}>No insights available yet</p>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Updated: {aiInsights.generatedAt || new Date().toLocaleTimeString()}
                  </p>
                </div>

                {/* Critical Alerts */}
                <div className="chart-card" style={{ borderLeft: '4px solid #ff6b6b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <AlertCircle size={24} color="#ff6b6b" />
                    <h2>Critical Alerts</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {aiInsights.alerts && aiInsights.alerts.length > 0 ? (
                      aiInsights.alerts.map((alert, idx) => {
                        const text = typeof alert === 'string' ? alert : alert.message || '';
                        return (
                          <div key={idx} style={{
                            padding: '12px',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            color: '#ff9999',
                            border: '1px solid rgba(255, 107, 107, 0.3)'
                          }}>
                            {text}
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: '#28a745', fontSize: '14px', fontWeight: 'bold' }}>✓ All systems operating normally</p>
                    )}
                  </div>
                </div>

                {/* Top Priority Recommendations */}
                <div className="chart-card" style={{ borderLeft: '4px solid #ffd700' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <TrendingUp size={24} color="#ffd700" />
                    <h2>Top Recommendations</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {aiInsights.recommendations && aiInsights.recommendations.length > 0 ? (
                      aiInsights.recommendations.map((rec, idx) => {
                        const text = typeof rec === 'string' ? rec : rec.description || '';
                        return (
                          <div key={idx} style={{
                            padding: '12px',
                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            color: '#ffd700',
                            border: '1px solid rgba(255, 215, 0, 0.3)'
                          }}>
                            {text}
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: '#888' }}>No recommendations at this time</p>
                    )}
                  </div>
                </div>
              </div>
            )}
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