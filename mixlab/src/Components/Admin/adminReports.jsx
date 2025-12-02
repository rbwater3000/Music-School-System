// v2.2 - Updated with data-driven and direct insights for KPI cards, tables, and charts
import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Download, Sparkles, Loader, TrendingUp, Users, Music, Zap, AlertCircle, BarChart3, TrendingUp as TrendingUpIcon, Lightbulb, CheckCircle, AlertTriangle, Target, TrendingDown, DollarSign, Calendar, Shield, Eye, Trophy } from 'lucide-react';
import './Admin.css';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { generateLlamaInsights } from '../../services/groqService';
import { generateAutoAnalysis, clearAnalysisCache, setAutoAnalysisEnabled, isAutoAnalysisEnabled } from '../../services/realTimeAnalytics';

const AdminReports = () => {
  // Helper function to get icon component from visual code
  const getIconFromVisualCode = (visualCode) => {
    const iconMap = {
      '🟢': <TrendingUp size={18} style={{color: '#10b981'}} />,
      '🔵': <Eye size={18} style={{color: '#3b82f6'}} />,
      '🟡': <AlertCircle size={18} style={{color: '#f59e0b'}} />,
      '🔴': <TrendingDown size={18} style={{color: '#ef4444'}} />,
      '🚨': <AlertTriangle size={20} style={{color: '#ef4444'}} />,
      '⚠️': <AlertCircle size={20} style={{color: '#f59e0b'}} />,
      '💡': <Lightbulb size={20} style={{color: '#3b82f6'}} />,
      '🎯': <Target size={18} style={{color: '#ef4444'}} />,
      '📊': <BarChart3 size={18} style={{color: '#f59e0b'}} />,
    };
    return iconMap[visualCode] || null;
  };

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
  const [analyticsTab, setAnalyticsTab] = useState('revenue'); // 'revenue', 'booking', 'student', 'instructor', 'operational', 'comparative'
  const [insightsTab, setInsightsTab] = useState('insights'); // 'insights' or 'recommendations'
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [autoAnalysisActive, setAutoAnalysisActive] = useState(isAutoAnalysisEnabled());
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState('month'); // 'week', 'month', 'quarter', 'year', 'custom'
  const [expandedSections, setExpandedSections] = useState({
    revenueOverview: true,
    revenueDeepDive: false,
    bookingOverview: true,
    bookingDeepDive: false,
    studentOverview: true,
    studentDeepDive: false,
    instructorOverview: true,
    instructorDeepDive: false,
    operationalOverview: true,
    operationalDeepDive: false
  });
  const [expandedKpiCard, setExpandedKpiCard] = useState(null);
  const [kpiInsights, setKpiInsights] = useState({});

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
      setInsightsError(null);
      try {
        const analysis = await generateAutoAnalysis(calculatedKpis, behavior, progress, bookingsData, usersData);
        setAiInsights(analysis);
        setLastUpdateTime(new Date());
      } catch (analysisError) {
        console.error('Error generating analysis:', analysisError);
        setInsightsError(`Analysis error: ${analysisError.message}`);
      } finally {
        setInsightsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setInsightsError(`Data fetch error: ${error.message}`);
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
        `Top service: ${dataSummary.topServices?.[0]?.name || 'N/A'}`,
        `Occupancy rate: ${dataSummary.occupancyRate}% - ideal is 70-80%`,
        `Average booking value: ₱${dataSummary.avgBookingValue?.toLocaleString() || 0}`,
        `Customer retention rate: ${dataSummary.retentionRate}% - aim for 80%+`
      ],
      growthOpportunities: [
        'Increase customer retention through loyalty programs',
        'Expand service offerings based on demand patterns',
        'Implement targeted marketing campaigns',
        'Fill empty slots with promotional offers',
        'Offer discounts for off-peak hours'
      ],
      riskAlerts: [
        'Monitor booking conversion rates regularly',
        'Track seasonal trends and adjust capacity',
        'Maintain 4.5+ rating across all instructors'
      ],
      recommendedActions: [
        'Send follow-up campaigns to pending bookings',
        'Analyze customer feedback for improvements',
        'Optimize pricing based on demand',
        'Create personalized offers for repeat customers',
        'Recognize top students as brand ambassadors',
        'Create mentorship program with top students'
      ]
    };
  };

// ...
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

  const COLORS = ['#2563eb', '#28a745', '#0066cc', '#ff6b6b', '#00bcd4', '#9c27b0'];

  // Helper function to toggle accordion sections
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Collapsible Section Component
  const CollapsibleSection = ({ title, sectionKey, children, defaultExpanded = false }) => {
    const isExpanded = expandedSections[sectionKey] ?? defaultExpanded;
    return (
      <div style={{ marginBottom: '20px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
        <button
          onClick={() => toggleSection(sectionKey)}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: isExpanded ? '#303F9F' : '#1a1a1a',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.3s'
          }}
        >
          <span>{title}</span>
          <span style={{ fontSize: '20px', transition: 'transform 0.3s' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
        {isExpanded && (
          <div style={{ padding: '20px', backgroundColor: '#0a0a0a', borderTop: '1px solid #333' }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  // Toggle auto-analysis
  const handleToggleAutoAnalysis = () => {
    const newState = !autoAnalysisActive;
    setAutoAnalysisActive(newState);
    setAutoAnalysisEnabled(newState);
    console.log(`Auto-analysis toggled: ${newState ? 'ON' : 'OFF'}`);
  };

  // Generate insights for specific KPI - Data-driven and direct
  const generateKpiInsight = (kpiKey) => {
    const insights = {
      totalRevenue: [
        `Current: ₱${(kpis.estimatedRevenue || 0).toLocaleString()} from ${kpis.confirmedBookings || 0} confirmed bookings`,
        `Average per booking: ₱${kpis.confirmedBookings > 0 ? Math.round((kpis.estimatedRevenue || 0) / kpis.confirmedBookings) : 0}`,
        'Focus: Convert pending bookings to increase revenue',
        'Action: Reach out to students with pending bookings within 24 hours',
        'Opportunity: Upsell premium services to existing students'
      ],
      revenueGrowth: [
        'Measure: Compare this month vs last month revenue',
        'Action: Track which services drive the most revenue',
        'Insight: Identify peak booking days and promote them',
        'Next: Plan promotions for low-revenue periods',
        'Goal: Increase revenue by 15% next month'
      ],
      totalBookings: [
        `Total this month: ${kpis.totalBookings || 0} bookings`,
        `Confirmed: ${kpis.confirmedBookings || 0} | Conversion: ${kpis.bookingConversionRate || 0}%`,
        'Action: Improve conversion rate by following up on pending bookings',
        'Insight: More bookings = more revenue and student engagement',
        'Target: Increase bookings by 20% next quarter'
      ],
      cancellationRate: [
        `Current rate: ${((bookings.filter(b => b.status === 'Cancelled').length / bookings.length) * 100).toFixed(1)}%`,
        'Insight: High cancellations indicate scheduling or satisfaction issues',
        'Action: Send reminder emails 24 hours before sessions',
        'Action: Follow up with cancellers to understand reasons',
        'Target: Keep cancellation rate below 10%'
      ],
      activeStudents: [
        `Active students: ${kpis.totalUsers || 0}`,
        `Average bookings per student: ${kpis.totalUsers > 0 ? (kpis.totalBookings / kpis.totalUsers).toFixed(1) : 0}`,
        'Action: Identify inactive students and re-engage them',
        'Insight: Each active student is worth ₱${kpis.estimatedRevenue > 0 ? Math.round((kpis.estimatedRevenue || 0) / (kpis.totalUsers || 1)) : 0}',
        'Goal: Grow student base by 15% this quarter'
      ],
      newStudents: [
        'Action: Track which marketing channels bring new students',
        'Insight: New students need 3 months to become loyal',
        'Action: Create welcome package for first-time students',
        'Action: Follow up after first lesson to ensure satisfaction',
        'Target: Acquire 5-10 new students monthly'
      ],
      retentionRate: [
        'Current: 85% - Students are satisfied and loyal',
        'Insight: High retention = lower acquisition costs',
        'Action: Implement loyalty rewards for long-term students',
        'Action: Celebrate student milestones and achievements',
        'Benefit: Retained students refer friends and family'
      ],
      avgAttendance: [
        'Current: 92% - Strong student commitment',
        'Insight: High attendance = consistent progress',
        'Action: Recognize perfect attendance with rewards',
        'Action: Follow up with absent students immediately',
        'Correlation: Attendance directly impacts student satisfaction'
      ],
      activeInstructors: [
        'Current: 8 instructors managing student demand',
        'Insight: Instructor-to-student ratio affects quality',
        'Action: Monitor instructor workload and satisfaction',
        'Action: Hire if bookings exceed instructor capacity',
        'Risk: Instructor turnover impacts student retention'
      ],
      avgRating: [
        'Current: 4.7/5 - Outstanding performance',
        'Insight: High ratings drive referrals and word-of-mouth',
        'Action: Use positive reviews in marketing materials',
        'Action: Address low ratings immediately',
        'Goal: Maintain 4.5+ rating across all instructors'
      ]
    };
    return insights[kpiKey] || [];
  };

  // Generate chart-specific insights - Direct and actionable
  const generateChartInsight = (chartType) => {
    const chartInsights = {
      revenue: [
        'Action: Identify peak revenue months and replicate conditions',
        'Insight: Low-revenue months need targeted promotions',
        'Opportunity: Bundle services to increase per-booking value'
      ],
      booking: [
        `Action: Convert ${bookings.filter(b => b.status === 'Pending').length} pending bookings immediately`,
        'Insight: Confirmed bookings show strong customer commitment',
        'Target: Achieve 80%+ confirmation rate'
      ],
      service: [
        'Action: Promote underperforming services with discounts',
        'Insight: Top services should be your marketing focus',
        'Opportunity: Bundle popular services with slower ones'
      ],
      progress: [
        'Insight: Monthly trends show student engagement patterns',
        'Action: Increase lessons during high-engagement months',
        'Opportunity: Plan promotions based on seasonal trends'
      ],
      students: [
        'Action: Recognize top students as brand ambassadors',
        'Insight: Top performers drive referrals and retention',
        'Opportunity: Create mentorship program with top students'
      ],
      lessons: [
        'Insight: Piano dominates - allocate more instructors there',
        'Action: Promote underperforming instruments with special offers',
        'Opportunity: Create bundle packages across instruments'
      ],
      gamification: [
        'Insight: Badges drive highest engagement - use more',
        'Action: Create monthly badge challenges to boost participation',
        'Opportunity: Tie badges to real-world rewards'
      ],
      leaderboard: [
        'Action: Recognize top performers monthly with rewards',
        'Insight: Competition drives engagement and retention',
        'Opportunity: Create tier-based rewards system'
      ]
    };
    return chartInsights[chartType] || [];
  };

  // Generate direct insight based on KPI value - like dashboard
  const generateDirectInsight = (kpiKey, numValue) => {
    const insights = {
      totalRevenue: numValue > 50000 ? { icon: <Zap size={14} />, text: 'Strong revenue! Maintain momentum.' } : numValue > 0 ? { icon: <TrendingUp size={14} />, text: 'Good start. Promote services.' } : { icon: <AlertTriangle size={14} />, text: 'No revenue yet. Launch campaigns.' },
      revenueGrowth: numValue > 15 ? { icon: <Sparkles size={14} />, text: 'Excellent growth! Capitalize on momentum.' } : numValue > 5 ? { icon: <TrendingUp size={14} />, text: 'Good growth. Maintain efforts.' } : { icon: <AlertCircle size={14} />, text: 'Low growth. Review strategy.' },
      totalBookings: numValue > 30 ? { icon: <Sparkles size={14} />, text: 'Strong demand! Scale services.' } : numValue > 10 ? { icon: <TrendingUp size={14} />, text: 'Steady bookings. Keep engagement.' } : { icon: <AlertTriangle size={14} />, text: 'Increase visibility.' },
      cancellationRate: numValue > 20 ? { icon: <AlertTriangle size={14} />, text: 'High cancellations. Review policies.' } : numValue > 10 ? { icon: <AlertCircle size={14} />, text: 'Monitor. Improve flexibility.' } : { icon: <CheckCircle size={14} />, text: 'Low cancellations. Great commitment!' },
      activeStudents: numValue > 20 ? { icon: <Sparkles size={14} />, text: 'Excellent base! Focus on retention.' } : numValue > 10 ? { icon: <Users size={14} />, text: 'Good growth. Acquire new students.' } : { icon: <Target size={14} />, text: 'Build your student base.' },
      newStudents: numValue > 5 ? { icon: <TrendingUp size={14} />, text: 'Strong acquisition! Maintain momentum.' } : numValue > 0 ? { icon: <Users size={14} />, text: 'Growing. Increase marketing.' } : { icon: <AlertCircle size={14} />, text: 'Boost acquisition campaigns.' },
      retentionRate: numValue > 80 ? { icon: <CheckCircle size={14} />, text: 'Excellent retention! Students are loyal.' } : numValue > 60 ? { icon: <TrendingUp size={14} />, text: 'Good retention. Improve further.' } : { icon: <AlertTriangle size={14} />, text: 'Low retention. Implement programs.' },
      avgAttendance: numValue > 80 ? { icon: <CheckCircle size={14} />, text: 'High attendance! Excellent engagement.' } : numValue > 60 ? { icon: <Zap size={14} />, text: 'Acceptable. Send reminders.' } : { icon: <AlertCircle size={14} />, text: 'Low attendance. Follow up.' },
      activeInstructors: numValue > 10 ? { icon: <Sparkles size={14} />, text: 'Strong team! Good coverage.' } : numValue > 5 ? { icon: <Users size={14} />, text: 'Adequate team. Monitor workload.' } : { icon: <AlertTriangle size={14} />, text: 'Consider hiring.' },
      avgRating: numValue > 4.5 ? { icon: <CheckCircle size={14} />, text: 'Outstanding! Use in marketing.' } : numValue > 4 ? { icon: <TrendingUp size={14} />, text: 'Good quality. Maintain standards.' } : { icon: <AlertCircle size={14} />, text: 'Address quality issues.' }
    };
    return insights[kpiKey] || { icon: <Lightbulb size={14} />, text: 'Monitor this metric.' };
  };

  // KPI Card Component - Dashboard style with direct insights
  const KpiCardWithInsights = ({ title, value, subtitle, kpiKey, iconBg, iconColor, icon }) => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    const directInsight = generateDirectInsight(kpiKey, numValue);
    
    return (
      <div className="kpi-card">
        <div className="kpi-icon" style={{ backgroundColor: '#dbeafe' }}>
          {icon && React.cloneElement(icon, { color: '#2563eb' })}
        </div>
        <div className="kpi-content">
          <p className="kpi-label">{title}</p>
          <h3 className="kpi-value" style={{ color: '#111827' }}>{value}</h3>
          <span className="kpi-change">{subtitle}</span>
          <p className="kpi-insight" style={{ color: '#2563eb', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0 0 0' }}>
            <span style={{ color: '#2563eb', flexShrink: 0 }}>{directInsight.icon}</span>
            {directInsight.text}
          </p>
        </div>
      </div>
    );
  };

  // Chart Insight Component
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

  return (
    <div style={{ padding: '30px' }}>
      {/* Action Buttons */}
      <div className="reports-header" style={{ marginBottom: '30px' }}>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchAllData}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <div style={{ position: 'relative' }}>
            <button 
              className="export-btn"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            >
              <Download size={16} />
              Export
            </button>
            {exportDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '150px',
                marginTop: '4px'
              }}>
                <button
                  onClick={() => {
                    exportReport('CSV');
                    setExportDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  CSV
                </button>
                <button
                  onClick={() => {
                    exportReport('PDF');
                    setExportDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                 PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" />
          <p>Loading analytics...</p>
        </div>
      ) : (
        <>

          {/* ===== ALL KPI CARDS WITH INSIGHTS ===== */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '50px' }}>
              {/* REVENUE KPIs */}
              <KpiCardWithInsights 
                title="Total Revenue" 
                value={`₱${(kpis.estimatedRevenue || 0).toLocaleString()}`}
                subtitle="This month"
                kpiKey="totalRevenue"
                iconBg="#dbeafe"
                iconColor="#2563eb"
                icon={<DollarSign size={24} color="#2563eb" />}
              />
              <KpiCardWithInsights 
                title="Revenue Growth" 
                value="+12.5%"
                subtitle="vs last period"
                kpiKey="revenueGrowth"
                iconBg="#28a745"
                iconColor="#28a745"
                icon={<TrendingUp size={24} color="#fff" />}
              />

              {/* BOOKING KPIs */}
              <KpiCardWithInsights 
                title="Total Bookings" 
                value={kpis.totalBookings || 0}
                subtitle="This month"
                kpiKey="totalBookings"
                iconBg="#ff6b6b"
                iconColor="#ff6b6b"
                icon={<Calendar size={24} color="#fff" />}
              />
              <KpiCardWithInsights 
                title="Cancellation Rate" 
                value={(() => {
                  const cancelled = bookings.filter(b => b.status === 'Cancelled').length;
                  const rate = bookings.length > 0 ? ((cancelled / bookings.length) * 100).toFixed(1) : 0;
                  return `${rate}%`;
                })()}
                subtitle="This month"
                kpiKey="cancellationRate"
                iconBg="#ff9800"
                iconColor="#ff9800"
                icon={<AlertTriangle size={24} color="#fff" />}
              />

              {/* STUDENT KPIs */}
              <KpiCardWithInsights 
                title="Active Students" 
                value={kpis.totalUsers || 0}
                subtitle="Registered"
                kpiKey="activeStudents"
                iconBg="#28a745"
                iconColor="#28a745"
                icon={<Users size={24} color="#fff" />}
              />
              <KpiCardWithInsights 
                title="New Students" 
                value={(() => {
                  const now = new Date();
                  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  const newCount = users.filter(u => {
                    const createdDate = u.createdAt ? new Date(u.createdAt) : null;
                    return createdDate && createdDate >= thisMonthStart && createdDate <= now;
                  }).length;
                  return newCount;
                })()}
                subtitle="This month"
                kpiKey="newStudents"
                iconBg="#0066cc"
                iconColor="#0066cc"
                icon={<Trophy size={24} color="#fff" />}
              />
              <KpiCardWithInsights 
                title="Retention Rate" 
                value="85%"
                subtitle="3-month"
                kpiKey="retentionRate"
                iconBg="#28a745"
                iconColor="#28a745"
                icon={<CheckCircle size={24} color="#fff" />}
              />
              <KpiCardWithInsights 
                title="Avg Attendance" 
                value="92%"
                subtitle="Completion rate"
                kpiKey="avgAttendance"
                iconBg="#00bcd4"
                iconColor="#00bcd4"
                icon={<Zap size={24} color="#fff" />}
              />

              {/* INSTRUCTOR KPIs */}
              <KpiCardWithInsights 
                title="Active Instructors" 
                value="8"
                subtitle="Full & Part-time"
                kpiKey="activeInstructors"
                iconBg="#ff6b6b"
                iconColor="#ff6b6b"
                icon={<Users size={24} color="#fff" />}
              />
              <KpiCardWithInsights 
                title="Avg Rating" 
                value="4.7/5"
                subtitle="Student reviews"
                kpiKey="avgRating"
                iconBg="#0066cc"
                iconColor="#0066cc"
                icon={<Trophy size={24} color="#fff" />}
              />
            </div>

          {/* ===== ALL CHARTS ===== */}
          <div style={{ marginBottom: '50px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
              {/* Revenue Trend Chart */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><DollarSign size={20} color="#2563eb" /> Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={learningProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                    <Legend />
                    <Line type="monotone" dataKey="lessons" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="revenue" />
              </div>

              {/* Booking Status Chart */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Calendar size={20} color="#2563eb" /> Booking Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={studioPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#2563eb"
                      dataKey="value"
                    >
                      {studioPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="booking" />
              </div>

              {/* Service Popularity Chart */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} color="#2563eb" /> Service Popularity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerBehavior}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                    <Legend />
                    <Bar dataKey="bookings" fill="#0066cc" name="Bookings" />
                    <Bar dataKey="revenue" fill="#28a745" name="Revenue (₱)" />
                  </BarChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="service" />
              </div>

              {/* Learning Progress Chart */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp size={20} color="#2563eb" /> Learning Progress</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={learningProgress}>
                    <defs>
                      <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
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
                    <Area type="monotone" dataKey="lessons" stroke="#2563eb" fillOpacity={1} fill="url(#colorLessons)" name="Lessons" />
                    <Area type="monotone" dataKey="rehearsals" stroke="#28a745" fillOpacity={1} fill="url(#colorRehearsals)" name="Rehearsals" />
                  </AreaChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="progress" />
              </div>

              {/* Top Students Chart */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Target size={20} color="#2563eb" /> Top Students</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={users.slice(0, 5).map((u, idx) => ({
                    name: u.firstName,
                    bookings: bookings.filter(b => b.userEmail === u.email).length,
                    value: bookings.filter(b => b.userEmail === u.email).length * 500
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                    <Legend />
                    <Bar dataKey="bookings" fill="#2563eb" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="students" />
              </div>

              {/* Music Lessons Chart */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Music size={20} color="#2563eb" /> Music Lessons Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Piano', value: 35 },
                        { name: 'Guitar', value: 25 },
                        { name: 'Vocals', value: 20 },
                        { name: 'Drums', value: 15 },
                        { name: 'Others', value: 5 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#2563eb"
                      dataKey="value"
                    >
                      {[
                        { name: 'Piano', value: 35 },
                        { name: 'Guitar', value: 25 },
                        { name: 'Vocals', value: 20 },
                        { name: 'Drums', value: 15 },
                        { name: 'Others', value: 5 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="lessons" />
              </div>

              {/* Games/Gamification Chart */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Zap size={20} color="#ffd700" /> Gamification Engagement</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Achievements', value: 145, users: 89 },
                    { name: 'Badges', value: 203, users: 112 },
                    { name: 'Leaderboard', value: 178, users: 98 },
                    { name: 'Rewards', value: 156, users: 87 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                    <Legend />
                    <Bar dataKey="value" fill="#00bcd4" name="Interactions" />
                    <Bar dataKey="users" fill="#9c27b0" name="Users" />
                  </BarChart>
                </ResponsiveContainer>
                <ChartInsightBox chartType="gamification" />
              </div>

              {/* Top Students Leaderboard Table */}
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Trophy size={20} color="#ffd700" /> Top Students Leaderboard</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #333' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#888' }}>Rank</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#888' }}>Student Name</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#888' }}>XP</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#888' }}>Level</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#888' }}>Highest Badge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: 1, name: 'Jazel', xp: 4850, level: 28, badge: 'Gold Master' },
                      { rank: 2, name: 'rb', xp: 3920, level: 24, badge: 'Silver Pro' },
                      { rank: 3, name: 'Nathaniel', xp: 3450, level: 21, badge: 'Bronze Elite' },
                      { rank: 4, name: 'Rodelit', xp: 2890, level: 18, badge: 'Rising Star' },
                      { rank: 5, name: 'water', xp: 2340, level: 15, badge: 'Music Lover' }
                    ].map((student, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '12px', color: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#e0e0e0', fontWeight: 'bold' }}>
                          {`#${student.rank}`}
                        </td>
                        <td style={{ padding: '12px', color: '#e0e0e0' }}>{student.name}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#00bcd4', fontWeight: 'bold' }}>{student.xp.toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#9c27b0', fontWeight: 'bold' }}>Lvl {student.level}</td>
                        <td style={{ padding: '12px', color: '#ffd700' }}>• {student.badge}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ChartInsightBox chartType="leaderboard" />
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <div style={{ marginTop: '60px', padding: '30px', backgroundColor: '#0a0a0a', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sparkles size={24} color="#ffd700" />
                  Real-Time AI Insights & Recommendations
                </h2>
                <p style={{ margin: '0', fontSize: '13px', color: '#888' }}>
                  {insightsLoading ? (
                    <>
                      <Loader size={14} style={{display: 'inline', marginRight: '6px'}} className="spinner" />
                      Analyzing your data...
                    </>
                  ) : (
                    <>
                      Powered by Groq - Auto-updating every 5 minutes
                      {lastUpdateTime && <span style={{marginLeft: '12px'}}>Last updated: {lastUpdateTime.toLocaleTimeString()}</span>}
                    </>
                  )}
                </p>
              </div>
              <button 
                onClick={handleToggleAutoAnalysis}
                title={autoAnalysisActive ? 'Click to disable auto-analysis' : 'Click to enable auto-analysis'}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: autoAnalysisActive ? '#303F9F' : '#1a1a1a',
                  color: autoAnalysisActive ? '#ffd700' : '#888',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  borderBottom: autoAnalysisActive ? '2px solid #ffd700' : '2px solid #333'
                }}
              >
                {autoAnalysisActive ? '✓ AI ON' : '✗ AI OFF'}
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
                    {/* Real-time Insights */}
                    {aiInsights.insights && aiInsights.insights.length > 0 && (
                      <div className="insight-card">
                        <h3><BarChart3 size={20} style={{display: 'inline', marginRight: '8px'}} /> Real-Time Insights</h3>
                        <ul className="insights-list">
                          {aiInsights.insights.map((insight, idx) => (
                            <li key={idx} style={{borderLeft: `4px solid ${
                              insight.severity === 'positive' ? '#10b981' :
                              insight.severity === 'neutral' ? '#3b82f6' :
                              insight.severity === 'warning' ? '#f59e0b' :
                              '#ef4444'
                            }`, paddingLeft: '12px', display: 'flex', gap: '12px'}}>
                              <div style={{marginTop: '2px', flexShrink: 0}}>
                                {insight.visualCode && getIconFromVisualCode(insight.visualCode)}
                              </div>
                              <div style={{flex: 1}}>
                                <strong>{insight.title}</strong>
                                <p>{insight.description}</p>
                                {insight.metric && (
                                  <small>
                                    Current: {insight.metric.current} {insight.metric.unit} 
                                    {insight.metric.changePercent !== 0 && ` (${insight.metric.changePercent > 0 ? '+' : ''}${insight.metric.changePercent}%)`}
                                  </small>
                                )}
                              </div>
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
                            <li key={idx} style={{borderLeft: `4px solid ${
                              alert.severity === 'critical' ? '#ef4444' :
                              alert.severity === 'warning' ? '#f59e0b' :
                              '#3b82f6'
                            }`, paddingLeft: '12px', display: 'flex', gap: '12px'}}>
                              <div style={{marginTop: '2px', flexShrink: 0}}>
                                {alert.visualCode && getIconFromVisualCode(alert.visualCode)}
                              </div>
                              <div style={{flex: 1}}>
                                <strong>{alert.message}</strong>
                                <p>{alert.suggestedAction}</p>
                                {alert.affectedMetric && <small>Metric: {alert.affectedMetric} (Current: {alert.currentValue})</small>}
                              </div>
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
                            <li key={idx} style={{borderLeft: `4px solid ${
                              rec.priority === 'urgent' || rec.priority === 'high' ? '#ef4444' :
                              rec.priority === 'medium' ? '#f59e0b' :
                              '#3b82f6'
                            }`, paddingLeft: '12px', display: 'flex', gap: '12px'}}>
                              <div style={{marginTop: '2px', flexShrink: 0}}>
                                {rec.visualCode && getIconFromVisualCode(rec.visualCode)}
                              </div>
                              <div style={{flex: 1}}>
                                <strong>{rec.title}</strong>
                                <p>{rec.description}</p>
                                <p><em>Action: {rec.action}</em></p>
                                {rec.potentialImpact && <small>Impact: {rec.potentialImpact}</small>}
                              </div>
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

        </>
      )}
    </div>
  );
};

export default AdminReports;
