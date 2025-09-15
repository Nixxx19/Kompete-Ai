// Gemini API Service for Exercise Analysis
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Supported video formats
const ALLOWED_EXTENSIONS = ["mp4", "mov", "avi"];

// Prompt for badminton analysis
const PROMPT = `
You are a professional badminton coach and computer vision expert. Your task is to analyze an uploaded video and determine whether it shows a valid badminton activity involving visible rallies or drills with clear shuttle movement between players. If not, respond with:

"Please upload a valid badminton video showing visible rallies or drills."

If the video is valid, perform a detailed shot-by-shot, frame-level analysis. 

IMPORTANT: Start your analysis with a shot count summary:
**Total Shots Analyzed:**
• [Number] shots detected in this video

Then, for each shot, number them sequentially as "Shot 1:", "Shot 2:", "Shot 3:", etc. and extract the following structured insights:

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

At the end of the video, provide a summary for each player, including:
**Tactical Patterns:**
• overuse of clears, avoidance of backhand

**Shot Selection Tendencies:**
• variety and patterns

**Strengths and Weaknesses:**
• footwork, posture, and recovery

**Final Coaching Suggestions:**
• specific improvements for gameplay, positioning, and decision-making

Format your response with bold headings (**Heading:**) and bullet points (•) for each detail. Use this format for all shots and summaries.
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
    
    // Prepare the request payload
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

// Note: Mock analysis removed - using only real API data