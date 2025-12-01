// Llama 3 AI Service using Replicate API
// Get your free API token from https://replicate.com/account/api-tokens

const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN || 'r8_3c4Ks1Q5L9xZ2vWmN8pQr7t';

export const generateLlamaInsights = async (analyticsData) => {
  try {
    const prompt = formatAnalyticsPrompt(analyticsData);
    
    // Call Replicate API with Llama 3
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'e951f18578850b652510200860fc4ea62b3b16fac280f83ff32282f87bbd2e48', // Llama 3 70B model
        input: {
          prompt: prompt,
          max_tokens: 1500,
          temperature: 0.7,
          top_p: 0.9,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const output = data.output ? data.output.join('') : '';
    
    return parseInsights(output);
  } catch (error) {
    console.error('Llama API Error:', error);
    // Return fallback insights if API fails
    return generateFallbackInsights(analyticsData);
  }
};

const formatAnalyticsPrompt = (data) => {
  const topServicesText = data.topServices?.map(s => `${s.name} (${s.bookings} bookings)`).join(', ') || 'N/A';
  
  return `You are a business analytics AI expert. Analyze this music studio data and provide insights in JSON format:

Studio Analytics Data:
- Total Bookings: ${data.totalBookings}
- Confirmed Bookings: ${data.confirmedBookings}
- Conversion Rate: ${data.conversionRate}%
- Active Users: ${data.totalUsers}
- Estimated Revenue: PHP ${data.revenue}
- Top Services: ${topServicesText}
- Time Period: Last ${data.totalMonths} months

Provide analysis in this JSON format:
{
  "keyInsights": ["insight 1", "insight 2", "insight 3", "insight 4"],
  "growthOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "riskAlerts": ["risk 1", "risk 2", "risk 3"],
  "recommendedActions": ["action 1", "action 2", "action 3", "action 4", "action 5"]
}

Focus on:
1. Customer behavior patterns
2. Revenue optimization
3. Service demand trends
4. Operational improvements
5. Risk mitigation strategies

Return ONLY valid JSON, no markdown or additional text.`;
};

const parseInsights = (output) => {
  try {
    // Extract JSON from output
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!parsed.keyInsights || !parsed.growthOpportunities || !parsed.riskAlerts || !parsed.recommendedActions) {
      throw new Error('Invalid insights structure');
    }
    
    return {
      keyInsights: ensureArray(parsed.keyInsights).map(addEmojis),
      growthOpportunities: ensureArray(parsed.growthOpportunities).map(addEmojis),
      riskAlerts: ensureArray(parsed.riskAlerts).map(addEmojis),
      recommendedActions: ensureArray(parsed.recommendedActions).map(addEmojis),
      source: 'Llama 3 AI Analysis'
    };
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
};

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
};

const addEmojis = (text) => {
  if (!text) return text;
  
  const emojiMap = {
    'booking': '📊',
    'revenue': '💰',
    'user': '👥',
    'growth': '🚀',
    'increase': '📈',
    'improve': '⬆️',
    'risk': '⚠️',
    'alert': '🚨',
    'action': '✅',
    'recommend': '💡',
    'monitor': '👀',
    'service': '🎵',
    'customer': '👤',
    'promotion': '📢',
    'marketing': '📣',
    'feedback': '📋',
    'loyalty': '🎁',
    'repeat': '🔄',
    'conversion': '📊',
    'pending': '⏳',
    'schedule': '📅',
    'trend': '📉',
  };

  let result = text;
  for (const [key, emoji] of Object.entries(emojiMap)) {
    const regex = new RegExp(`\\b${key}\\w*`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, `${emoji} $&`);
      break;
    }
  }
  
  return result;
};

const generateFallbackInsights = (data) => {
  const conversionRate = parseFloat(data.conversionRate);
  const bookingsPerUser = data.totalUsers > 0 ? (data.totalBookings / data.totalUsers).toFixed(2) : 0;

  return {
    keyInsights: [
      `📊 Total ${data.totalBookings} bookings with ${data.confirmedBookings} confirmed (${data.conversionRate}% conversion)`,
      `👥 ${bookingsPerUser} average bookings per user from ${data.totalUsers} active users`,
      `💰 Estimated ₱${data.revenue?.toLocaleString()} revenue from confirmed bookings`,
      data.topServices?.[0] ? `🎵 "${data.topServices[0].name}" is your top service with ${data.topServices[0].bookings} bookings` : 'Monitor service performance'
    ],
    growthOpportunities: [
      conversionRate < 50 ? `🚀 Improve conversion rate from ${data.conversionRate}% with targeted promotions` : '🚀 Strong conversion rate - maintain quality',
      `📈 Implement loyalty program to boost repeat bookings`,
      `📢 Cross-promote underperforming services to balance revenue`
    ],
    riskAlerts: [
      conversionRate < 30 ? `⚠️ LOW CONVERSION RATE (${data.conversionRate}%) - Investigate cancellations` : '⚠️ Monitor booking trends regularly',
      `🚨 Track seasonal variations to prepare for peak periods`,
      `📋 Collect customer feedback to identify improvement areas`
    ],
    recommendedActions: [
      '✅ Send follow-ups to pending bookings to improve conversion',
      '✅ Create personalized campaigns for top customers',
      '✅ Analyze monthly trends and adjust pricing',
      '✅ Implement automated booking reminders',
      '✅ Survey customers for satisfaction and feedback'
    ],
    source: 'Fallback Analysis (Llama API Unavailable)'
  };
};

// For streaming/polling if needed
export const pollPrediction = async (predictionId) => {
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Poll error:', error);
    throw error;
  }
};
