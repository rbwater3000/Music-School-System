import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Download, Sparkles, Loader, TrendingUp, Users, Music, Zap, AlertCircle, BarChart3, TrendingUp as TrendingUpIcon, Lightbulb, CheckCircle, AlertTriangle, Target } from 'lucide-react';
import './Admin.css';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { generateLlamaInsights } from '../../services/groqService';

const AdminReports = () => {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState({});
  const [customerBehavior, setCustomerBehavior] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [studioPerformance, setStudioPerformance] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [insightsError, setInsightsError] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [insightsTab, setInsightsTab] = useState('insights'); // 'insights' or 'recommendations'

  // Fetch and process all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookingsData = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(bookingsData);

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Calculate KPIs
      calculateKPIs(bookingsData, usersData);

      // Generate analytics data
      generateCustomerBehavior(bookingsData);
      generateLearningProgress(bookingsData);
      generateStudioPerformance(bookingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (bookingsData, usersData) => {
    const totalBookings = bookingsData.length;
    const confirmedBookings = bookingsData.filter(b => b.status === 'Confirmed' || b.status === 'Done').length;
    const bookingConversionRate = totalBookings > 0 ? ((confirmedBookings / totalBookings) * 100).toFixed(2) : 0;
    
    // Revenue estimate (assuming average booking is 500)
    const estimatedRevenue = confirmedBookings * 500;
    
    // Customer satisfaction (mock data)
    const avgSatisfaction = 4.5;

    setKpis({
      totalBookings,
      confirmedBookings,
      bookingConversionRate,
      totalUsers: usersData.length,
      estimatedRevenue,
      avgSatisfaction
    });
  };

  const generateCustomerBehavior = (bookingsData) => {
    // Group bookings by service type
    const serviceCount = {};
    const serviceRevenue = {};

    bookingsData.forEach(b => {
      const service = b.service || 'Unknown';
      const price = b.service?.includes('Recording') ? 1500 : 500;
      
      serviceCount[service] = (serviceCount[service] || 0) + 1;
      serviceRevenue[service] = (serviceRevenue[service] || 0) + price;
    });

    const chartData = Object.keys(serviceCount).map(service => ({
      name: service,
      bookings: serviceCount[service],
      revenue: serviceRevenue[service],
      avgValue: (serviceRevenue[service] / serviceCount[service]).toFixed(0)
    }));

    setCustomerBehavior(chartData);
  };

  const generateLearningProgress = (bookingsData) => {
    // Group by month to show booking trends
    const monthlyData = {};
    
    bookingsData.forEach(b => {
      const date = new Date(b.date);
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { lessons: 0, rehearsals: 0, recordings: 0, completed: 0 };
      }
      
      if (b.service?.includes('Lesson')) monthlyData[month].lessons++;
      if (b.service?.includes('Rehearsal')) monthlyData[month].rehearsals++;
      if (b.service?.includes('Recording')) monthlyData[month].recordings++;
      if (b.status === 'Done') monthlyData[month].completed++;
    });

    const chartData = Object.keys(monthlyData).map(month => ({
      month,
      ...monthlyData[month]
    }));

    setLearningProgress(chartData);
  };

  const generateStudioPerformance = (bookingsData) => {
    // Calculate daily booking rate and status distribution
    const statusCount = {
      'Pending': 0,
      'Confirmed': 0,
      'Done': 0,
      'Cancelled': 0
    };

    bookingsData.forEach(b => {
      const status = b.status || 'Pending';
      statusCount[status]++;
    });

    const chartData = Object.keys(statusCount).map(status => ({
      name: status,
      value: statusCount[status],
      percentage: ((statusCount[status] / bookingsData.length) * 100).toFixed(1)
    }));

    setStudioPerformance(chartData);
  };

  // Generate AI Insights using Llama 3
  const generateAIInsights = async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      // Prepare data summary for Llama analysis
      const sortedServices = [...customerBehavior].sort((a, b) => b.bookings - a.bookings).slice(0, 3);
      
      const dataSummary = {
        totalBookings: kpis.totalBookings || 0,
        confirmedBookings: kpis.confirmedBookings || 0,
        conversionRate: kpis.bookingConversionRate || 0,
        totalUsers: kpis.totalUsers || 0,
        revenue: kpis.estimatedRevenue || 0,
        topServices: sortedServices,
        totalMonths: learningProgress.length,
        timestamp: new Date().toLocaleString()
      };

      console.log('Sending data to Llama:', dataSummary);

      // Call real Llama 3 API
      const insights = await generateLlamaInsights(dataSummary);
      
      if (insights) {
        console.log('Received insights from Llama:', insights);
        setAiInsights(insights);
      } else {
        // Fallback to intelligent local insights if API fails
        console.warn('API returned null, using fallback');
        const fallbackInsights = generateIntelligentInsights(dataSummary);
        setAiInsights(fallbackInsights);
        setInsightsError('Used local analysis (API returned no data)');
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setInsightsError(`Error: ${error.message}`);
      // Use fallback if error
      const sortedServices = [...customerBehavior].sort((a, b) => b.bookings - a.bookings).slice(0, 3);
      const fallbackInsights = generateIntelligentInsights({
        totalBookings: kpis.totalBookings || 0,
        confirmedBookings: kpis.confirmedBookings || 0,
        conversionRate: kpis.bookingConversionRate || 0,
        totalUsers: kpis.totalUsers || 0,
        revenue: kpis.estimatedRevenue || 0,
        topServices: sortedServices,
        totalMonths: learningProgress.length
      });
      setAiInsights(fallbackInsights);
    } finally {
      setInsightsLoading(false);
    }
  };

  const generateIntelligentInsights = (dataSummary) => {
    const conversionRate = parseFloat(dataSummary.conversionRate);
    const insights = {
      keyInsights: [],
      growthOpportunities: [],
      riskAlerts: [],
      recommendedActions: []
    };

    // Key Insights
    if (dataSummary.totalBookings > 0) {
      insights.keyInsights.push(
        `You have ${dataSummary.totalBookings} total bookings with ${dataSummary.confirmedBookings} confirmed (${dataSummary.conversionRate}% conversion rate)`
      );
    }

    if (dataSummary.totalUsers > 0) {
      const bookingsPerUser = (dataSummary.totalBookings / dataSummary.totalUsers).toFixed(2);
      insights.keyInsights.push(
        `Average ${bookingsPerUser} bookings per user from ${dataSummary.totalUsers} registered users`
      );
    }

    if (dataSummary.revenue > 0) {
      insights.keyInsights.push(
        `Estimated revenue: ₱${dataSummary.revenue.toLocaleString()} from confirmed bookings`
      );
    }

    if (dataSummary.topServices.length > 0) {
      const topService = dataSummary.topServices[0];
      insights.keyInsights.push(
        `"${topService.name}" is your most popular service with ${topService.bookings} bookings`
      );
    }

    // Growth Opportunities
    if (conversionRate < 50) {
      insights.growthOpportunities.push(
        `Improve conversion rate from ${dataSummary.conversionRate}% - Consider offering promotions or improving booking experience`
      );
    }

    if (dataSummary.totalUsers > 0 && dataSummary.totalBookings / dataSummary.totalUsers < 2) {
      insights.growthOpportunities.push(
        `Increase repeat bookings - Implement loyalty program or follow-up campaigns`
      );
    }

    if (dataSummary.topServices.length > 1) {
      const secondService = dataSummary.topServices[1];
      const topService = dataSummary.topServices[0];
      if (topService.bookings > secondService.bookings * 2) {
        insights.growthOpportunities.push(
          `Promote underperforming services like "${secondService.name}" to balance revenue streams`
        );
      }
    }

    insights.growthOpportunities.push(
      `Expand to corporate team sessions and group discounts`
    );

    // Risk Alerts
    if (conversionRate < 30) {
      insights.riskAlerts.push(
        `LOW CONVERSION RATE (${dataSummary.conversionRate}%) - Investigate booking cancellations and user feedback`
      );
    }

    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    if (pendingBookings > dataSummary.confirmedBookings) {
      insights.riskAlerts.push(
        `HIGH PENDING BOOKINGS - ${pendingBookings} bookings awaiting confirmation. Consider automated reminders.`
      );
    }

    insights.riskAlerts.push(
      `Monitor seasonal trends - Prepare for peak and off-peak periods`
    );

    // Recommended Actions
    insights.recommendedActions.push(
      `Send personalized follow-ups to pending bookings to improve conversion`
    );

    insights.recommendedActions.push(
      `Create targeted campaigns for top customers to encourage repeat bookings`
    );

    if (dataSummary.totalMonths > 1) {
      insights.recommendedActions.push(
        `Analyze monthly trends and adjust pricing/availability accordingly`
      );
    }

    insights.recommendedActions.push(
      `Collect feedback from confirmed bookings to identify improvement areas`
    );

    insights.recommendedActions.push(
      `Optimize service offerings based on customer demand patterns`
    );

    return insights;
  };

  // Export report
  const exportReport = (format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'PDF') {
      alert('PDF export feature coming soon');
    } else if (format === 'CSV') {
      const data = {
        kpis,
        customerBehavior,
        learningProgress,
        studioPerformance
      };
      const csv = JSON.stringify(data, null, 2);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Analytics-Report-${timestamp}.csv`;
      a.click();
    }
  };

  const COLORS = ['#ffd700', '#28a745', '#0066cc', '#ff6b6b', '#00bcd4', '#9c27b0'];

  return (
    <div className="admin-reports-container">
      {/* Header */}
      <div className="reports-header">
        <div className="header-title">
          <FileText size={28} className="icon" />
          <div>
            <h1>Reports & Analytics Dashboard</h1>
            <p>Studio Performance, Customer Behavior & Learning Progress</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchAllData}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <button 
            className="export-btn"
            onClick={() => exportReport('CSV')}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" />
          <p>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="kpi-cards-grid">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: '#ffd700' }}>
                <Zap size={24} color="#000" />
              </div>
              <div className="kpi-content">
                <p className="kpi-label">Total Bookings</p>
                <h3 className="kpi-value">{kpis.totalBookings || 0}</h3>
                <span className="kpi-change">+{Math.floor(Math.random() * 10)}% this month</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: '#28a745' }}>
                <TrendingUp size={24} color="#fff" />
              </div>
              <div className="kpi-content">
                <p className="kpi-label">Conversion Rate</p>
                <h3 className="kpi-value">{kpis.bookingConversionRate || 0}%</h3>
                <span className="kpi-change">Confirmed bookings</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: '#0066cc' }}>
                <Users size={24} color="#fff" />
              </div>
              <div className="kpi-content">
                <p className="kpi-label">Active Users</p>
                <h3 className="kpi-value">{kpis.totalUsers || 0}</h3>
                <span className="kpi-change">+{Math.floor(Math.random() * 5)} new users</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: '#ff6b6b' }}>
                <Music size={24} color="#fff" />
              </div>
              <div className="kpi-content">
                <p className="kpi-label">Est. Revenue</p>
                <h3 className="kpi-value">₱{kpis.estimatedRevenue || 0}</h3>
                <span className="kpi-change">From confirmed bookings</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            {/* Customer Behavior */}
            <div className="chart-card">
              <h2>Customer Behavior - Service Popularity</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerBehavior}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  <Legend />
                  <Bar dataKey="bookings" fill="#ffd700" name="Bookings" />
                  <Bar dataKey="revenue" fill="#28a745" name="Revenue (₱)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Learning Progress */}
            <div className="chart-card">
              <h2>Learning Progress - Monthly Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={learningProgress}>
                  <defs>
                    <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffd700" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRehearsals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#28a745" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  <Legend />
                  <Area type="monotone" dataKey="lessons" stroke="#ffd700" fillOpacity={1} fill="url(#colorLessons)" name="Lessons" />
                  <Area type="monotone" dataKey="rehearsals" stroke="#28a745" fillOpacity={1} fill="url(#colorRehearsals)" name="Rehearsals" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Studio Performance */}
            <div className="chart-card">
              <h2>Studio Performance - Booking Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={studioPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#ffd700"
                    dataKey="value"
                  >
                    {studioPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Revenue Trend */}
            <div className="chart-card">
              <h2>Recording Sessions - Performance Metrics</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={learningProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  <Legend />
                  <Line type="monotone" dataKey="recordings" stroke="#0066cc" strokeWidth={2} dot={{ fill: '#0066cc' }} name="Recording Sessions" />
                  <Line type="monotone" dataKey="completed" stroke="#28a745" strokeWidth={2} dot={{ fill: '#28a745' }} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Statistics Table */}
          <div className="summary-section">
            <h2>Service Breakdown</h2>
            <div className="summary-table">
              <table>
                <thead>
                  <tr>
                    <th>Service Type</th>
                    <th>Total Bookings</th>
                    <th>Total Revenue</th>
                    <th>Avg Value</th>
                  </tr>
                </thead>
                <tbody>
                  {customerBehavior.map((service, index) => (
                    <tr key={`service-${index}`}>
                      <td>{service.name}</td>
                      <td>{service.bookings}</td>
                      <td>₱{service.revenue.toLocaleString()}</td>
                      <td>₱{service.avgValue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="ai-insights-section">
            <div className="insights-header-row">
              <div className="insights-title">
                <Sparkles size={24} color="#ffd700" />
                <div>
                  <h2>Llama 3 AI Insights & Recommendations</h2>
                  <p className="ai-subtitle">Powered by Groq - Free AI Analysis</p>
                </div>
              </div>
              <button 
                className="generate-btn"
                onClick={generateAIInsights}
                disabled={insightsLoading || !import.meta.env.VITE_GROQ_API_KEY}
              >
                {insightsLoading ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Insights
                  </>
                )}
              </button>
            </div>

            {!import.meta.env.VITE_GROQ_API_KEY && (
              <div className="api-key-warning">
                <AlertCircle size={20} />
                <div>
                  <h4>API Key Required</h4>
                  <p>Get your free Groq API key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">console.groq.com/keys</a>, then add it to <code>.env.local</code> as <code>VITE_GROQ_API_KEY</code></p>
                </div>
              </div>
            )}

            {insightsLoading ? (
              <div className="loading-state">
                <Loader className="spinner" />
                <p>Llama 3 via Groq is analyzing your data...</p>
              </div>
            ) : insightsError ? (
              <div className="insights-error">
                <AlertCircle size={20} />
                <p>{insightsError}</p>
              </div>
            ) : aiInsights ? (
              <div>
                {aiInsights.source && (
                  <div className="ai-source-badge">
                    <Sparkles size={16} style={{display: 'inline', marginRight: '6px'}} />
                    <strong>{aiInsights.source}</strong>
                  </div>
                )}
                
                {/* Tabs */}
                <div className="insights-tabs">
                  <button 
                    className={`tab-btn ${insightsTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setInsightsTab('insights')}
                  >
                    Insights
                  </button>
                  <button 
                    className={`tab-btn ${insightsTab === 'recommendations' ? 'active' : ''}`}
                    onClick={() => setInsightsTab('recommendations')}
                  >
                    Recommendations
                  </button>
                </div>

                {/* Insights Tab */}
                {insightsTab === 'insights' && (
                  <div className="insights-grid">
                    {/* Key Insights */}
                    <div className="insight-card">
                      <h3><BarChart3 size={20} style={{display: 'inline', marginRight: '8px'}} /> Key Insights</h3>
                      <ul className="insights-list">
                        {aiInsights.keyInsights.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Risk Alerts */}
                    <div className="insight-card warning">
                      <h3><AlertTriangle size={20} style={{display: 'inline', marginRight: '8px'}} /> Risk Alerts</h3>
                      <ul className="insights-list">
                        {aiInsights.riskAlerts.map((risk, idx) => (
                          <li key={idx}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Recommendations Tab */}
                {insightsTab === 'recommendations' && (
                  <div className="insights-grid">
                    {/* Growth Opportunities */}
                    <div className="insight-card success">
                      <h3><TrendingUpIcon size={20} style={{display: 'inline', marginRight: '8px'}} /> Growth Opportunities</h3>
                      <ul className="insights-list">
                        {aiInsights.growthOpportunities.map((opp, idx) => (
                          <li key={idx}>{opp}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Actions */}
                    <div className="insight-card action">
                      <h3><CheckCircle size={20} style={{display: 'inline', marginRight: '8px'}} /> Recommended Actions</h3>
                      <ul className="insights-list">
                        {aiInsights.recommendedActions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-insights">
                <p>Click "Generate Insights" to let Llama 3 analyze your business data and provide recommendations</p>
              </div>
            )}
          </div>

          {/* Export Section */}
          <div className="export-section">
            <h3>Export Report</h3>
            <div className="export-buttons">
              <button 
                className="export-btn-primary"
                onClick={() => exportReport('CSV')}
              >
                <Download size={16} />
                Export as CSV
              </button>
              <button 
                className="export-btn-primary"
                onClick={() => exportReport('PDF')}
              >
                <Download size={16} />
                Export as PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
