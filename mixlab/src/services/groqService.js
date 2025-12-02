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

// Real-time analysis prompt - optimized for fast processing and minimal tokens
const createRealTimePrompt = (studioData) => {
  const cancellationRate = studioData.sessionsToday > 0 
    ? ((studioData.cancelledToday / studioData.sessionsToday) * 100).toFixed(1)
    : 0;
  
  return `You are a real-time BI system for MixLab Studio. Generate 3-4 insights, 1-2 alerts, 2-3 recommendations NOW.

## DATA
Today: ${studioData.sessionsToday} sessions, ₱${studioData.todayRevenue} revenue, ${studioData.activeStudentsNow} students
Metrics: ${studioData.totalBookings} bookings (${studioData.confirmedBookings} confirmed), ${studioData.conversionRate}% conversion
Changes: Revenue ${studioData.revenueChangePercent > 0 ? '+' : ''}${studioData.revenueChangePercent}%, Bookings ${studioData.bookingChangePercent > 0 ? '+' : ''}${studioData.bookingChangePercent}%
CRITICAL ISSUES: ${studioData.cancelledToday} cancellations (${cancellationRate}% cancellation rate), ${studioData.noShowsToday} no-shows
Top Service: ${studioData.topServices?.[0]?.name || 'N/A'} (${studioData.topServices?.[0]?.bookings || 0} bookings)

## OUTPUT FORMAT (JSON only, no markdown):
{
  "generatedAt": "ISO timestamp",
  "summary": "One sentence status",
  "insights": [{"type":"insight","category":"revenue|booking|engagement|operational","severity":"positive|neutral|warning|critical","priority":"urgent|high|medium|low","title":"Max 70 chars","description":"2-3 sentences","metric":{"current":0,"previous":0,"changePercent":0,"unit":"PHP|bookings|students|percent"},"visualCode":"🟢|🔵|🟡|🔴"}],
  "alerts": [{"type":"alert","severity":"critical|warning|opportunity","visualCode":"🚨|⚠️|💡","message":"Issue","affectedMetric":"name","currentValue":"value","suggestedAction":"action"}],
  "recommendations": [{"type":"recommendation","category":"revenue|scheduling|retention|engagement|operational","priority":"urgent|high|medium|low","visualCode":"🎯|📊|💡","title":"Action headline","description":"Why it matters","action":"Specific step","potentialImpact":"Benefit"}],
  "liveMetrics":{"sessionsToday":0,"revenueToday":0,"activeStudentsNow":0}
}

## RULES:
- 3-4 insights max (most impactful)
- 1-2 alerts max (only critical/urgent)
- 2-3 recommendations max (highest ROI)
- Use present tense
- Include numbers and percentages
- MUST flag cancellations >5% as critical alert
- MUST flag no-shows >3 as warning alert
- Return ONLY valid JSON`;
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
    console.log('generateRealTimeAnalysis called with studioData:', studioData);
    
    if (!groq || !apiKey) {
      console.error('Groq not initialized. groq:', !!groq, 'apiKey:', !!apiKey);
      throw new Error('Groq API key not configured');
    }

    console.log('Creating real-time prompt...');
    const startTime = performance.now();
    const prompt = createRealTimePrompt(studioData);
    console.log('Prompt created, length:', prompt.length);

    console.log('Calling Groq API...');
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

    console.log('Groq API response received:', message);
    const responseText = message.choices[0].message.content || '';
    const processingTime = ((performance.now() - startTime) / 1000).toFixed(2);

    console.log('Real-time analysis response text length:', responseText.length);
    console.log('Real-time analysis response:', responseText.substring(0, 500));

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
