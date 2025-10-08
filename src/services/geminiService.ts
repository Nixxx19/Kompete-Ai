// Gemini API Service for Exercise Analysis
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";


// Supported video formats
const ALLOWED_EXTENSIONS = ["mp4", "mov", "avi"];

// Prompt for badminton analysis
const PROMPT = `
You are a professional badminton coach and computer vision expert. Your task is to analyze an uploaded video and determine whether it shows a valid badminton activity involving visible rallies or drills with clear shuttle movement between players. If not, respond with:

"Please upload a valid badminton video showing visible rallies or drills."

If the video is valid, perform a comprehensive analysis including detailed shot-by-shot analysis AND comprehensive performance insights.

IMPORTANT: Start your analysis with a shot count summary:
**Total Shots Analyzed:**
• [Number] shots detected in this video

## SHOT-BY-SHOT ANALYSIS
For each shot, number them sequentially as "Shot 1:", "Shot 2:", "Shot 3:", etc. and extract the following structured insights:

**Player Identity:**
• Player 1 (near side) or Player 2 (far side)

**Shot Type:**
• smash, clear, drop, net shot, drive, lift, push, block

**Trajectory Classification:**
• Defensive Clear, Attacking Clear, Drive, Smash, Drop, Net-Drop

**Technique Zone:**
• Forehand – overhead, Backhand – underarm

**Estimated Shuttle Speed:**
• [speed] km/h

**Contact Point on Racket:**
• sweet spot, frame, off-center, top of strings

**Player Posture at Contact:**
• ready stance, crouch, jump smash posture, off-balance

**Balance or Recovery Status:**
• recovered well, off-balance, slow recovery

**Shot Quality:**
• tight to net, deceptive, weak, attacking clear

**Improvement Suggestions:**
• [specific coaching feedback]

Repeat this analysis for every shot sequentially in the rally or drill, numbering each as "Shot X:".

## COMPREHENSIVE PERFORMANCE ANALYSIS

After the shot-by-shot analysis, provide these additional comprehensive sections:

### 1. OVERALL RALLY ANALYSIS
**Overall Performance Summary:**
• Rally quality rating (1-10) with brief justification
• Shot variety count and tactical level assessment
• Overall intensity and player engagement level
• Key technical strengths and areas for improvement

**Rally Duration:**
• Exact duration in minutes and seconds
• Average time between shots
• Comparison to typical rally length
• Impact on player performance

**Match Intensity:**
• Intensity level (Low/Moderate/High/Very High)
• Average shuttle speed
• Peak intensity moments
• Defensive vs offensive shot ratio

**Rally Quality Assessment:**
• Technical execution quality rating (1-10)
• Shot accuracy and placement effectiveness
• Overall rally competitiveness and engagement
• Areas needing improvement

### 2. PERFORMANCE EFFICIENCY
**Shot Accuracy Rate:**
• Calculate percentage of shots that hit their intended target
• Analyze placement accuracy and targeting effectiveness
• Identify accuracy patterns and consistency levels

**Power Efficiency:**
• Measure average power per successful shot
• Analyze power-to-accuracy ratio
• Identify optimal power levels for different shot types

**Net Play Efficiency:**
• Analyze effectiveness of net shots and drop shots
• Evaluate precision and placement of net play
• Assess control and touch at the net

**Defensive Capability:**
• Evaluate how well players handle difficult shots
• Analyze defensive clears and lifts
• Assess recovery and defensive positioning

### 3. COMPARATIVE ANALYSIS
**Head-to-Head Comparison:**
• Direct comparison between Player 1 and Player 2, highlighting their different playing styles, strengths, and approaches

**Performance Trends:**
• Analyze how each player's performance changed throughout the rally, including any improvements or declines

**Advantage Analysis:**
• Identify which player had advantages at different points and what factors contributed to these advantages

### 4. TECHNICAL INSIGHTS
**Common Mistakes:**
• Identify recurring technical issues, poor shot execution, or tactical errors made by either player

**Consistency Analysis:**
• Evaluate shot execution consistency, power control, and accuracy throughout the rally

**Pressure Points:**
• Identify moments when players were under pressure and how they handled these situations

### 5. STRATEGIC ANALYSIS
**Tactical Evolution:**
• Analyze how the tactical approach of both players evolved during the rally and their strategic thinking

**Weakness Exploitation:**
• Identify how players targeted each other's weaknesses and exploited opportunities

**Adaptation Analysis:**
• Evaluate how well both players adapted their strategy and execution based on opponent responses

### 6. PLAYER SUMMARIES
For each player, provide detailed analysis including:

**Tactical Patterns:**
• Specific patterns in their play, such as overuse of certain shots, court positioning habits, or tactical preferences

**Shot Selection Tendencies:**
• Analyze their shot variety, preferred shot types, and decision-making patterns

**Strengths and Weaknesses:**
• Comprehensive assessment of technical strengths, areas for improvement, footwork, and overall game

**Final Coaching Suggestions:**
• Specific, actionable recommendations for improving their gameplay, positioning, and decision-making

## FORMATTING REQUIREMENTS
- Use bold headings (**Heading:**) for all major sections
- Use bullet points (•) for all details and sub-items
- Be specific and detailed in all analysis sections
- Provide concrete examples and shot numbers where relevant
- Ensure all sections are comprehensive and provide valuable insights
- Use professional coaching terminology and insights
`;

export interface ExerciseAnalysis {
  rawAnalysis: string;
  exerciseType?: string;
  formQuality?: string;
  performanceLevel?: string;
  calories?: string;
  duration?: string;
  recommendations?: string[];
}

export const analyzeExerciseVideo = async (videoFile: File): Promise<ExerciseAnalysis> => {
  try {
    // Check if API key is available
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not found. Please configure your API key.');
    }
    
    console.log('Using Gemini API for analysis...');

    // Check file extension
    const fileNameParts = videoFile.name.split(".");
    if (fileNameParts.length < 2) {
      throw new Error("File must have an extension. Please upload MP4, MOV, or AVI video.");
    }

    const fileExt = fileNameParts[fileNameParts.length - 1].toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      throw new Error("Unsupported file format. Please upload MP4, MOV, or AVI video.");
    }

    // Check file size (20MB limit)
    if (videoFile.size > 20 * 1024 * 1024) {
      throw new Error("File too large. Please upload a video under 20MB.");
    }

    // Convert video to base64
    const base64Video = await fileToBase64(videoFile);
    
    // Prepare the request payload - using default settings
    const payload = {
      contents: [
        {
          parts: [
            {
              text: PROMPT
            },
            {
              inline_data: {
                mime_type: `video/${fileExt}`,
                data: base64Video.split(',')[1] // Remove data URL prefix
              }
            }
          ]
        }
      ]
    };

    console.log('Sending request to Gemini API...');
    
    // Retry mechanism for API calls
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API attempt ${attempt}/${maxRetries}...`);
        
        // Make API call to Gemini
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('API Response received:', data);
          
          if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid API response. No analysis content received.');
          }

          const analysisText = data.candidates[0].content.parts[0].text;
          console.log('Analysis text from API:', analysisText);
          
          return {
            rawAnalysis: analysisText,
            exerciseType: extractExerciseType(analysisText),
            formQuality: extractFormQuality(analysisText),
            performanceLevel: extractPerformanceLevel(analysisText),
            calories: extractCalories(analysisText),
            duration: extractDuration(analysisText),
            recommendations: extractRecommendations(analysisText)
          };
        } else {
          const errorText = await response.text();
          console.error(`API Error (attempt ${attempt}):`, response.status, errorText);
          
          // If it's a 503 error and we have retries left, wait and try again
          if (response.status === 503 && attempt < maxRetries) {
            const waitTime = attempt * 2000; // 2s, 4s, 6s
            console.log(`Model overloaded. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          lastError = new Error(`API request failed: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.error(`API attempt ${attempt} failed:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          const waitTime = attempt * 1000; // 1s, 2s, 3s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError || new Error('All API attempts failed');

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('503')) {
      throw new Error('The AI model is currently overloaded. Please try again in a few minutes. This is a temporary issue with Google\'s servers.');
    } else if (error.message.includes('API key')) {
      throw new Error('API key not found. Please check your configuration.');
    } else if (error.message.includes('All API attempts failed')) {
      throw new Error('Unable to connect to the AI service after multiple attempts. Please check your internet connection and try again.');
    } else {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper functions to extract information from analysis text
const extractExerciseType = (text: string): string => {
  // Check if it's a valid badminton video
  if (text.includes("Please upload a valid badminton video")) {
    return "Invalid Video";
  }
  return "Badminton";
};

const extractFormQuality = (text: string): string => {
  const match = text.match(/\*\*Shot Quality:\*\*\s*•\s*(.+)/i);
  return match ? match[1].trim() : "Good";
};

const extractPerformanceLevel = (text: string): string => {
  // Extract from final coaching suggestions or overall assessment
  const match = text.match(/\*\*Final Coaching Suggestions:\*\*\s*•\s*(.+)/i);
  return match ? "Analyzed" : "Good";
};

const extractCalories = (text: string): string => {
  // Count number of shots for rough calorie estimation
  const shotMatches = text.match(/\*\*Shot Type:\*\*/g);
  const shotCount = shotMatches ? shotMatches.length : 0;
  const estimatedCalories = Math.round(shotCount * 2.5); // Rough estimation
  return estimatedCalories.toString();
};

const extractDuration = (text: string): string => {
  // Count number of shots for rough duration estimation
  const shotMatches = text.match(/\*\*Shot Type:\*\*/g);
  const shotCount = shotMatches ? shotMatches.length : 0;
  const estimatedDuration = Math.round(shotCount * 3); // Rough estimation: 3 seconds per shot
  return estimatedDuration.toString();
};

const extractRecommendations = (text: string): string[] => {
  const recommendations = [];
  const lines = text.split('\n');
  let inRecommendations = false;
  
  for (const line of lines) {
    if (line.includes('**Improvement Suggestions:**') || line.includes('**Final Coaching Suggestions:**')) {
      inRecommendations = true;
      continue;
    }
    if (inRecommendations && line.includes('**') && !line.includes('Improvement Suggestions') && !line.includes('Final Coaching Suggestions')) {
      break;
    }
    if (inRecommendations && line.includes('•')) {
      const rec = line.replace('•', '').trim();
      if (rec) recommendations.push(rec);
    }
  }
  
  return recommendations.length > 0 ? recommendations : [
    "Focus on proper shot technique",
    "Improve footwork and positioning",
    "Work on shot variety and strategy"
  ];
};

