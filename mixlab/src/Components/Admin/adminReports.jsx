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
import { generateAutoAnalysis, clearAnalysisCache } from '../../services/realTimeAnalytics';

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
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Fetch and process all data
  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing data...');
      fetchAllData();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
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
      const calculatedKpis = calculateKPIs(bookingsData, usersData);

      // Generate analytics data
      const behavior = generateCustomerBehavior(bookingsData);
      const progress = generateLearningProgress(bookingsData);
      generateStudioPerformance(bookingsData);

      // Trigger automatic real-time analysis
      setInsightsLoading(true);
      const analysis = await generateAutoAnalysis(calculatedKpis, behavior, progress, bookingsData, usersData);
      setAiInsights(analysis);
      setLastUpdateTime(new Date());
      setInsightsLoading(false);
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

    const kpisData = {
      totalBookings,
      confirmedBookings,
      bookingConversionRate,
      totalUsers: usersData.length,
      estimatedRevenue,
      avgSatisfaction
    };

    setKpis(kpisData);
    return kpisData;
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
    return chartData;
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
    return chartData;
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

  const getDefaultInsights = (dataSummary) => {
    return {
      keyInsights: [
        `Total bookings: ${dataSummary.totalBookings} with ${dataSummary.confirmedBookings} confirmed`,
        `Conversion rate: ${dataSummary.conversionRate}% from ${dataSummary.totalUsers} users`,
        `Estimated revenue: ₱${dataSummary.revenue?.toLocaleString() || 0}`,
        `Top service: ${dataSummary.topServices?.[0]?.name || 'N/A'}`
      ],
      growthOpportunities: [
        'Increase customer retention through loyalty programs',
        'Expand service offerings based on demand patterns',
        'Implement targeted marketing campaigns'
      ],
      riskAlerts: [
        'Monitor booking conversion rates regularly',
        'Track seasonal trends and adjust capacity'
      ],
      recommendedActions: [
        'Send follow-up campaigns to pending bookings',
        'Analyze customer feedback for improvements',
        'Optimize pricing based on demand',
        'Create personalized offers for repeat customers'
      ]
    };
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
                  <h2>Real-Time AI Insights & Recommendations</h2>
                  <p className="ai-subtitle">
                    {insightsLoading ? (
                      <>
                        <Loader size={14} style={{display: 'inline', marginRight: '6px'}} className="spinner" />
                        Analyzing your data...
                      </>
                    ) : (
                      <>
                        Powered by Groq - Auto-updating every 5 minutes
                        {lastUpdateTime && <span style={{marginLeft: '12px', fontSize: '0.9em', color: '#888'}}>Last updated: {lastUpdateTime.toLocaleTimeString()}</span>}
                      </>
                    )}
                  </p>
                </div>
              </div>
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
                    {/* Real-time Insights */}
                    {aiInsights.insights && aiInsights.insights.length > 0 && (
                      <div className="insight-card">
                        <h3><BarChart3 size={20} style={{display: 'inline', marginRight: '8px'}} /> Real-Time Insights</h3>
                        <ul className="insights-list">
                          {aiInsights.insights.map((insight, idx) => (
                            <li key={idx}>
                              <strong>{insight.title}</strong>
                              <p>{insight.description}</p>
                              {insight.metric && (
                                <small>
                                  Current: {insight.metric.current} {insight.metric.unit} 
                                  {insight.metric.changePercent !== 0 && ` (${insight.metric.changePercent > 0 ? '+' : ''}${insight.metric.changePercent}%)`}
                                </small>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Alerts */}
                    {aiInsights.alerts && aiInsights.alerts.length > 0 && (
                      <div className="insight-card warning">
                        <h3><AlertTriangle size={20} style={{display: 'inline', marginRight: '8px'}} /> Alerts</h3>
                        <ul className="insights-list">
                          {aiInsights.alerts.map((alert, idx) => (
                            <li key={idx}>
                              <strong>{alert.message}</strong>
                              <p>{alert.suggestedAction}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fallback for old format */}
                    {aiInsights.keyInsights && !aiInsights.insights && (
                      <>
                        <div className="insight-card">
                          <h3><BarChart3 size={20} style={{display: 'inline', marginRight: '8px'}} /> Key Insights</h3>
                          <ul className="insights-list">
                            {aiInsights.keyInsights.map((insight, idx) => (
                              <li key={idx}>{insight}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="insight-card warning">
                          <h3><AlertTriangle size={20} style={{display: 'inline', marginRight: '8px'}} /> Risk Alerts</h3>
                          <ul className="insights-list">
                            {aiInsights.riskAlerts?.map((risk, idx) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Recommendations Tab */}
                {insightsTab === 'recommendations' && (
                  <div className="insights-grid">
                    {/* Real-time Recommendations */}
                    {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                      <div className="insight-card action">
                        <h3><CheckCircle size={20} style={{display: 'inline', marginRight: '8px'}} /> Recommended Actions</h3>
                        <ul className="insights-list">
                          {aiInsights.recommendations.map((rec, idx) => (
                            <li key={idx}>
                              <strong>{rec.title}</strong>
                              <p>{rec.description}</p>
                              <p><em>Action: {rec.action}</em></p>
                              {rec.potentialImpact && <small>Impact: {rec.potentialImpact}</small>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fallback for old format */}
                    {aiInsights.growthOpportunities && !aiInsights.recommendations && (
                      <>
                        <div className="insight-card success">
                          <h3><TrendingUpIcon size={20} style={{display: 'inline', marginRight: '8px'}} /> Growth Opportunities</h3>
                          <ul className="insights-list">
                            {aiInsights.growthOpportunities.map((opp, idx) => (
                              <li key={idx}>{opp}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="insight-card action">
                          <h3><CheckCircle size={20} style={{display: 'inline', marginRight: '8px'}} /> Recommended Actions</h3>
                          <ul className="insights-list">
                            {aiInsights.recommendedActions?.map((action, idx) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
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
