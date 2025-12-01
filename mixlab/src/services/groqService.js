// Groq API Service for Llama 3 Integration
import { Groq } from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const groq = apiKey ? new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Allows API calls from browser
}) : null;

// Expert analyst prompt template for studio performance analysis
const createAnalystPrompt = (dataSummary) => {
  return `You are an expert data analyst specializing in studio performance optimization and business intelligence. Your role is to analyze comprehensive studio metrics and provide actionable, data-driven insights and recommendations.

## STUDIO PERFORMANCE DATA
- Total Bookings: ${dataSummary.totalBookings}
- Confirmed Bookings: ${dataSummary.confirmedBookings}
- Booking Conversion Rate: ${dataSummary.conversionRate}%
- Total Active Users: ${dataSummary.totalUsers}
- Estimated Revenue: ₱${dataSummary.revenue?.toLocaleString() || 0}
- Top Services: ${dataSummary.topServices?.map(s => `${s.name} (${s.bookings} bookings, ₱${s.revenue?.toLocaleString() || 0} revenue)`).join('; ') || 'None'}
- Data Period: ${dataSummary.totalMonths} months

## ANALYSIS REQUIREMENTS

Analyze this data and provide insights in JSON format with these exact keys:

1. **keyInsights** (array of 4-5 strings): Most significant patterns and metrics
   - Use specific numbers and percentages
   - Connect findings to business impact
   - Identify both positive trends and concerns

2. **growthOpportunities** (array of 4-5 strings): Revenue and engagement expansion opportunities
   - Break down by service categories or customer segments
   - Include concrete action steps
   - Prioritize by impact potential

3. **riskAlerts** (array of 2-3 strings): Areas requiring immediate attention
   - Flag conversion rate issues, pending bookings, or service imbalances
   - Suggest possible root causes

4. **recommendedActions** (array of 5-6 strings): Specific, prioritized recommendations
   - Format: "[Priority: HIGH/MEDIUM] Action - Expected Impact"
   - Include success metrics to track
   - Estimate potential business impact when possible

## TONE & STYLE
- Be clear, concise, and data-focused
- Use comparative language (e.g., "up 23% vs average", "2.5x higher")
- Prioritize insights that directly impact revenue or customer satisfaction
- Avoid jargon; explain technical terms when necessary

Return ONLY valid JSON with no markdown, code blocks, or extra text.`;
};

// Real-time analysis prompt - optimized for fast processing
const createRealTimePrompt = (studioData) => {
  return `You are a real-time business intelligence system for MixLab Studio. Analyze current studio metrics and generate IMMEDIATE, ACTIONABLE insights focused on NOW.

## REAL-TIME STUDIO DATA (Current State)
Generated: ${new Date().toISOString()}
Analysis Period: Last 30 days + Today

**Today's Performance:**
- Sessions Today: ${studioData.sessionsToday || 0}
- Revenue Today: ₱${studioData.todayRevenue?.toLocaleString() || 0}
- Active Students Now: ${studioData.activeStudentsNow || 0}
- Studios Occupied: ${studioData.studiosOccupiedNow || 0}/${studioData.totalStudios || 3}
- Upcoming in 1 Hour: ${studioData.upcomingIn1Hour || 0} sessions

**Key Metrics:**
- Total Bookings: ${studioData.totalBookings}
- Confirmed: ${studioData.confirmedBookings}
- Cancellations Today: ${studioData.cancelledToday || 0}
- No-shows: ${studioData.noShowsToday || 0}
- Conversion Rate: ${studioData.conversionRate}%
- Active Users: ${studioData.totalUsers}
- Total Revenue: ₱${studioData.revenue?.toLocaleString() || 0}

**Comparisons (vs Yesterday/Last Week):**
- Revenue Change: ${studioData.revenueChangePercent || 0}%
- Booking Change: ${studioData.bookingChangePercent || 0}%
- Occupancy Trend: ${studioData.occupancyTrend || 'stable'}

**Top Services:** ${studioData.topServices?.map(s => `${s.name} (${s.bookings} bookings)`).join(', ') || 'N/A'}

## REAL-TIME ANALYSIS REQUIREMENTS

Generate insights in this EXACT JSON format (no markdown, no extra text):

{
  "generatedAt": "ISO timestamp",
  "processingTime": "1.5s",
  "summary": "One sentence about current studio status with today's key metric",
  "insights": [
    {
      "type": "insight",
      "category": "revenue|engagement|booking|operational",
      "severity": "positive|neutral|warning|critical",
      "priority": "urgent|high|medium|low",
      "title": "Specific headline focused on NOW (max 70 chars)",
      "description": "Current state with real-time context (2-3 sentences)",
      "metric": {
        "current": number,
        "previous": number,
        "changePercent": number,
        "unit": "bookings|students|PHP|percent",
        "timeContext": "today|this_week"
      },
      "impact": "high|medium|low",
      "icon": "TrendingUp|TrendingDown|Users|Calendar|DollarSign|AlertCircle|CheckCircle|Zap"
    }
  ],
  "recommendations": [
    {
      "type": "recommendation",
      "category": "revenue|engagement|scheduling|retention",
      "priority": "urgent|high|medium|low",
      "title": "Action-oriented headline with timing (max 70 chars)",
      "description": "Why this matters NOW with supporting data",
      "action": "Specific immediate step (e.g., 'Send SMS for 3 empty slots at 4pm')",
      "potentialImpact": "Quantified benefit (e.g., 'Could generate ₱2,400 today')",
      "timeframe": "now|today|this_week",
      "icon": "Target|TrendingUp|Users|Zap|Shield"
    }
  ],
  "alerts": [
    {
      "type": "alert",
      "severity": "warning|critical",
      "message": "Urgent real-time issue",
      "affectedMetric": "metric name",
      "currentValue": "current state",
      "suggestedAction": "immediate action to take NOW"
    }
  ],
  "liveMetrics": {
    "studiosOccupiedNow": number,
    "sessionsToday": number,
    "revenueToday": number,
    "activeStudentsNow": number,
    "upcomingIn1Hour": number
  }
}

## PRIORITY RULES (Process in this order):
1. CRITICAL issues happening NOW (revenue crash, mass cancellations, system issues)
2. TODAY's performance anomalies (high cancellations, capacity issues)
3. Week-over-week changes (trends, patterns)
4. Positive achievements and wins

## TONE:
- Use present tense: "happening now", "today", "currently"
- Include specific timestamps and deadlines
- Compare to yesterday/last week
- Highlight immediate opportunities with urgency
- Show live operational status
- Provide "right now" actionable steps

## LIMITS:
- Generate 4-6 insights MAXIMUM (for speed)
- Focus on high-impact, recent changes
- Prioritize current day/week metrics
- Surface urgent alerts immediately
- Return ONLY valid JSON with no markdown or code blocks`;
};

export const generateLlamaInsights = async (input) => {
  try {
    if (!groq || !apiKey) {
      throw new Error('Groq API key not configured. Please add VITE_GROQ_API_KEY to .env.local');
    }
    
    // Support both custom prompts and data summaries
    let prompt;
    if (input.isCustomPrompt && input.prompt) {
      prompt = input.prompt;
    } else {
      // Use expert analyst prompt for data summary format
      const dataSummary = input;
      prompt = createAnalystPrompt(dataSummary);
    }

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile', // Fast Groq model
      temperature: 0.7,
      max_tokens: 1024
    });

    // Extract the response text
    const responseText = message.choices[0].message.content || '';
    
    console.log('Groq API Response:', responseText);
    
    // Return raw response for custom prompts, parse JSON for data summaries
    if (input.isCustomPrompt) {
      return responseText;
    }
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from response');
      return null;
    }

    const insights = JSON.parse(jsonMatch[0]);
    return insights;
  } catch (error) {
    console.error('Error generating Llama insights:', error);
    throw error;
  }
};

export const generateRealTimeAnalysis = async (studioData) => {
  try {
    if (!groq || !apiKey) {
      throw new Error('Groq API key not configured');
    }

    const startTime = performance.now();
    const prompt = createRealTimePrompt(studioData);

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048
    });

    const responseText = message.choices[0].message.content || '';
    const processingTime = ((performance.now() - startTime) / 1000).toFixed(2);

    console.log('Real-time analysis response:', responseText);

    // Parse JSON from response - find complete JSON object
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from real-time response');
      return null;
    }

    let jsonStr = jsonMatch[0];
    
    // Try to parse, if it fails due to truncation, try to fix it
    try {
      const analysis = JSON.parse(jsonStr);
      analysis.processingTime = `${processingTime}s`;
      return analysis;
    } catch (parseError) {
      console.warn('JSON parse error, attempting to fix truncated response:', parseError.message);
      
      // Try to close any unclosed arrays/objects
      let fixedJson = jsonStr;
      const openBraces = (fixedJson.match(/\{/g) || []).length;
      const closeBraces = (fixedJson.match(/\}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;
      
      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += '}';
      }
      // Add missing closing brackets
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += ']';
      }
      
      try {
        const analysis = JSON.parse(fixedJson);
        analysis.processingTime = `${processingTime}s`;
        console.log('Successfully parsed fixed JSON');
        return analysis;
      } catch (secondError) {
        console.error('Could not fix JSON:', secondError.message);
        return null;
      }
    }
  } catch (error) {
    console.error('Error generating real-time analysis:', error);
    throw error;
  }
};

export const generateCustomRecommendation = async (question, context) => {
  try {
    if (!groq || !apiKey) {
      throw new Error('Groq API key not configured');
    }

    const prompt = `You are a music studio business consultant. 
    
Context: ${JSON.stringify(context)}

Question: ${question}

Provide a practical, actionable recommendation in 2-3 sentences.`;

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 256
    });

    return message.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating recommendation:', error);
    throw error;
  }
};
