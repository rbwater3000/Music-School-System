// Groq API Service for Llama 3 Integration
import { Groq } from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const groq = apiKey ? new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Allows API calls from browser
}) : null;

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
      // Legacy data summary format
      const dataSummary = input;
      prompt = `You are a music studio business intelligence expert. Analyze this business data and provide strategic insights.

BUSINESS DATA:
- Total Bookings: ${dataSummary.totalBookings}
- Confirmed Bookings: ${dataSummary.confirmedBookings}
- Conversion Rate: ${dataSummary.conversionRate}%
- Total Users: ${dataSummary.totalUsers}
- Estimated Revenue: ₱${dataSummary.revenue}
- Top Services: ${dataSummary.topServices.map(s => `${s.name} (${s.bookings} bookings)`).join(', ')}

Provide a JSON response with exactly this structure (no markdown, just JSON):
{
  "keyInsights": [
    "insight 1",
    "insight 2",
    "insight 3"
  ],
  "growthOpportunities": [
    "opportunity 1",
    "opportunity 2",
    "opportunity 3"
  ],
  "riskAlerts": [
    "alert 1",
    "alert 2"
  ],
  "recommendedActions": [
    "action 1",
    "action 2",
    "action 3"
  ]
}

Generate insights that are:
1. Specific to music studio business
2. Based on the actual data provided
3. Actionable and practical`;
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
