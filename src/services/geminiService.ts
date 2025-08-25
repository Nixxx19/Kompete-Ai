// Gemini API Service for Exercise Analysis
const GEMINI_API_KEY = "AIzaSyDOyYws8K4ZQeWtZARFUEw01YLLVGZ5vlQ";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Supported video formats
const ALLOWED_EXTENSIONS = ["mp4", "mov", "avi"];

// Prompt for badminton analysis
const PROMPT = `
You are a professional badminton coach and computer vision expert. Your task is to analyze an uploaded video and determine whether it shows a valid badminton activity involving visible rallies or drills with clear shuttle movement between players. If not, respond with:

"Please upload a valid badminton video showing visible rallies or drills."

If the video is valid, perform a detailed shot-by-shot, frame-level analysis. Format your response with bold headings and bullet points for each detail. For each shot, extract and return the following structured insights:

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

Repeat this analysis for every shot sequentially in the rally or drill.

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

    // Make API call to Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('No analysis result received from the API.');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    
    return {
      rawAnalysis: analysisText,
      exerciseType: extractExerciseType(analysisText),
      formQuality: extractFormQuality(analysisText),
      performanceLevel: extractPerformanceLevel(analysisText),
      calories: extractCalories(analysisText),
      duration: extractDuration(analysisText),
      recommendations: extractRecommendations(analysisText)
    };

  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(`Error during analysis: ${error.message}`);
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

// Mock analysis for development/testing
export const mockAnalyzeExerciseVideo = async (videoFile: File): Promise<ExerciseAnalysis> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    rawAnalysis: `**Player Identity:**
• Player 1 (near side)

**Shot Type:**
• clear

**Trajectory Classification:**
• Defensive Clear

**Technique Zone:**
• Forehand – overhead

**Estimated Shuttle Speed:**
• 45 km/h

**Contact Point on Racket:**
• sweet spot

**Player Posture at Contact:**
• ready stance

**Balance or Recovery Status:**
• recovered well

**Shot Quality:**
• tight to net

**Improvement Suggestions:**
• Focus on better footwork positioning

**Player Identity:**
• Player 2 (far side)

**Shot Type:**
• smash

**Trajectory Classification:**
• Smash

**Technique Zone:**
• Forehand – overhead

**Estimated Shuttle Speed:**
• 120 km/h

**Contact Point on Racket:**
• sweet spot

**Player Posture at Contact:**
• jump smash posture

**Balance or Recovery Status:**
• recovered well

**Shot Quality:**
• attacking clear

**Improvement Suggestions:**
• Improve recovery after smash

**Tactical Patterns:**
• Good mix of defensive and attacking shots

**Shot Selection Tendencies:**
• Varied shot selection with good strategy

**Strengths and Weaknesses:**
• Strong overhead shots, good footwork

**Final Coaching Suggestions:**
• Continue working on shot variety and positioning`,
    exerciseType: "Badminton",
    formQuality: "tight to net",
    performanceLevel: "Analyzed",
    calories: "5",
    duration: "6",
    recommendations: [
      "Focus on better footwork positioning",
      "Improve recovery after smash",
      "Continue working on shot variety and positioning"
    ]
  };
};
