// Real-Time Analytics Service for MixLab Studio
// Handles automatic analysis triggers, caching, and data change detection

import { generateRealTimeAnalysis } from './groqService';

let analysisCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let lastAnalyzedData = null;

// Check if data has changed significantly (>10% deviation)
const hasSignificantChange = (newData, oldData) => {
  if (!oldData) return true;

  const checkMetric = (key, threshold = 0.1) => {
    const newVal = newData[key];
    const oldVal = oldData[key];
    if (typeof newVal !== 'number' || typeof oldVal !== 'number') return false;
    if (oldVal === 0) return newVal !== 0;
    const changePercent = Math.abs((newVal - oldVal) / oldVal);
    return changePercent > threshold;
  };

  // Check critical metrics for >10% change
  return (
    checkMetric('todayRevenue', 0.1) ||
    checkMetric('sessionsToday', 0.1) ||
    checkMetric('cancelledToday', 0.15) ||
    checkMetric('conversionRate', 0.1)
  );
};

// Build studio data object from current state
const buildStudioData = (kpis, customerBehavior, learningProgress, bookings, users) => {
  const today = new Date().toDateString();
  const todayBookings = bookings.filter(b => new Date(b.date).toDateString() === today);
  const cancelledToday = todayBookings.filter(b => b.status === 'Cancelled').length;
  const noShowsToday = todayBookings.filter(b => b.status === 'NoShow').length;
  const completedToday = todayBookings.filter(b => b.status === 'Done').length;

  // Calculate revenue for today
  const todayRevenue = todayBookings
    .filter(b => b.status === 'Done' || b.status === 'Confirmed')
    .reduce((sum, b) => sum + (b.price || 500), 0);

  // Calculate yesterday's revenue for comparison
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const yesterdayBookings = bookings.filter(b => new Date(b.date).toDateString() === yesterday);
  const yesterdayRevenue = yesterdayBookings
    .filter(b => b.status === 'Done' || b.status === 'Confirmed')
    .reduce((sum, b) => sum + (b.price || 500), 0);

  const revenueChangePercent = yesterdayRevenue > 0 
    ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)
    : 0;

  // Calculate booking change
  const bookingChangePercent = yesterdayBookings.length > 0
    ? (((todayBookings.length - yesterdayBookings.length) / yesterdayBookings.length) * 100).toFixed(1)
    : 0;

  return {
    // Today's metrics
    sessionsToday: todayBookings.length,
    todayRevenue,
    activeStudentsNow: users.length, // Simplified - ideally track active sessions
    studiosOccupiedNow: Math.min(completedToday, 3), // Assuming 3 studios
    totalStudios: 3,
    upcomingIn1Hour: todayBookings.filter(b => {
      const bookingTime = new Date(b.date);
      const now = new Date();
      const diff = (bookingTime - now) / (1000 * 60);
      return diff > 0 && diff <= 60;
    }).length,
    cancelledToday,
    noShowsToday,

    // Overall metrics
    totalBookings: kpis.totalBookings || 0,
    confirmedBookings: kpis.confirmedBookings || 0,
    conversionRate: kpis.bookingConversionRate || 0,
    totalUsers: kpis.totalUsers || 0,
    revenue: kpis.estimatedRevenue || 0,
    topServices: customerBehavior.slice(0, 3),

    // Comparisons
    revenueChangePercent,
    bookingChangePercent,
    occupancyTrend: revenueChangePercent > 0 ? 'up' : revenueChangePercent < 0 ? 'down' : 'stable'
  };
};

// Main function: Generate real-time analysis
export const generateAutoAnalysis = async (kpis, customerBehavior, learningProgress, bookings, users) => {
  try {
    console.log('Starting auto-analysis with data:', { kpis, behaviorCount: customerBehavior?.length, bookingsCount: bookings?.length, usersCount: users?.length });
    
    const studioData = buildStudioData(kpis, customerBehavior, learningProgress, bookings, users);
    console.log('Built studio data:', studioData);

    // Check cache
    const now = Date.now();
    if (analysisCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      // Check if data changed significantly
      if (!hasSignificantChange(studioData, lastAnalyzedData)) {
        console.log('Using cached analysis (no significant data change)');
        return {
          ...analysisCache,
          cached: true,
          cacheAge: Math.round((now - cacheTimestamp) / 1000)
        };
      }
    }

    // Generate new analysis
    console.log('Generating new real-time analysis...');
    const analysis = await generateRealTimeAnalysis(studioData);
    console.log('Analysis result:', analysis);

    // If analysis failed, use fallback
    if (!analysis) {
      console.warn('Real-time analysis returned null, using fallback');
      const fallback = getDefaultRealTimeAnalysis();
      analysisCache = fallback;
      cacheTimestamp = now;
      lastAnalyzedData = studioData;
      return {
        ...fallback,
        cached: false,
        generatedAt: new Date().toISOString()
      };
    }

    // Cache the result
    analysisCache = analysis;
    cacheTimestamp = now;
    lastAnalyzedData = studioData;

    return {
      ...analysis,
      cached: false,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in auto-analysis:', error);
    const fallback = getDefaultRealTimeAnalysis();
    return fallback;
  }
};

// Fallback analysis when API fails
const getDefaultRealTimeAnalysis = () => {
  return {
    generatedAt: new Date().toISOString(),
    processingTime: '0.5s',
    summary: 'Studio dashboard loaded. Real-time analysis unavailable.',
    insights: [
      {
        type: 'insight',
        category: 'operational',
        severity: 'neutral',
        priority: 'medium',
        title: 'Dashboard Ready',
        description: 'Real-time analytics system is active and monitoring studio metrics.',
        metric: {
          current: 0,
          previous: 0,
          changePercent: 0,
          unit: 'percent',
          timeContext: 'today'
        },
        impact: 'medium',
        icon: 'CheckCircle'
      }
    ],
    recommendations: [],
    alerts: [],
    liveMetrics: {
      studiosOccupiedNow: 0,
      sessionsToday: 0,
      revenueToday: 0,
      activeStudentsNow: 0,
      upcomingIn1Hour: 0
    }
  };
};

// Clear cache on demand
export const clearAnalysisCache = () => {
  analysisCache = null;
  cacheTimestamp = null;
  lastAnalyzedData = null;
};

// Get cache status
export const getCacheStatus = () => {
  if (!cacheTimestamp) return { cached: false };
  const age = Date.now() - cacheTimestamp;
  return {
    cached: age < CACHE_DURATION,
    ageSeconds: Math.round(age / 1000),
    maxAge: Math.round(CACHE_DURATION / 1000)
  };
};
