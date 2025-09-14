# KOMPTE AI - Performance Analytics Platform

<div align="center">
  <img src="public/favicon1.ico" alt="KOMPTE AI Logo" width="80" height="80">
  
  **AI-Powered Exercise Analysis & Performance Tracking**
  
  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF.svg)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.11-38B2AC.svg)](https://tailwindcss.com/)
</div>

## 🚀 Overview

KOMPTE AI is a cutting-edge performance analytics platform that leverages artificial intelligence to analyze exercise videos and provide detailed insights for athletes and coaches. Built with modern web technologies, it offers real-time analysis, comprehensive performance tracking, and personalized recommendations.

## ✨ Features

### 🎯 Core Capabilities
- **AI-Powered Video Analysis**: Upload exercise videos for detailed AI analysis using Google Gemini
- **Real-Time Performance Tracking**: Live camera analysis with instant feedback
- **Multi-Exercise Support**: Jumping jacks, push-ups, squats, high knees, and more
- **Professional Analytics**: Detailed form analysis, performance metrics, and coaching insights
- **Player Detection**: Advanced computer vision for athlete identification and tracking

### 🏃‍♂️ Supported Exercises
- **Jumping Jacks**: Form analysis and repetition counting
- **Push-ups**: Technique evaluation and performance tracking
- **Squats**: Movement quality assessment
- **High Knees**: Cardio exercise monitoring
- **Badminton**: Shot-by-shot analysis with tactical insights
- **Custom Drills**: Extensible framework for new exercises

### 📊 Analytics & Insights
- **Form Quality Assessment**: AI-powered technique evaluation
- **Performance Metrics**: Speed, accuracy, and efficiency tracking
- **Coaching Recommendations**: Personalized improvement suggestions
- **Progress Visualization**: Charts and graphs for performance trends
- **Calorie Estimation**: Activity-based calorie tracking

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - Modern UI library
- **TypeScript 5.5.3** - Type-safe development
- **Vite 5.4.1** - Fast build tool and dev server
- **Tailwind CSS 3.4.11** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Router 6.26.2** - Client-side routing
- **React Query 5.56.2** - Server state management

### AI & Computer Vision
- **Google Gemini 1.5 Flash** - Video analysis and insights
- **MediaPipe** - Pose detection and tracking
- **Custom ML Models** - Exercise-specific analysis

### UI Components
- **shadcn/ui** - Modern component library
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization

## 🚀 Quick Start

### Prerequisites
- **JavaScript runtime** (Node.js, Bun, or Deno)
- **npm** package manager
- Modern web browser with camera access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/kompete-ai-website.git
   cd kompete-ai-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   **Note**: This project uses MediaPipe for pose detection. The required MediaPipe packages are included in the dependencies:
   - `@mediapipe/camera_utils`
   - `@mediapipe/drawing_utils` 
   - `@mediapipe/pose`

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 📱 Usage

### 🎯 Exercise Analysis
1. Navigate to the **Exercise** page
2. Enter player details (name, age, height, weight, gender)
3. Select your exercise type:
   - **Jumping Jacks** - Full body cardio exercise
   - **Push-ups** - Upper body strength training
   - **Squats** - Lower body strength and stability
   - **High Knees** - Cardio and leg strength builder
4. Upload a video file (MP4, MOV, AVI)
5. Wait for AI analysis to complete
6. Review detailed insights and recommendations

### 📹 Live Camera Analysis
1. Go to **Live Camera** page
2. Allow camera permissions
3. Select your exercise (Jumping Jacks or Push-ups)
4. Start real-time analysis
5. Get instant feedback and corrections
6. View live performance metrics

### 🏸 Badminton Analysis
1. Upload badminton video through Exercise page
2. AI analyzes shot-by-shot performance
3. Get detailed insights on:
   - Shot types (smash, clear, drop, net shot, drive, lift, push, block)
   - Trajectory classification
   - Technique zones (forehand/backhand)
   - Shuttle speed estimation
   - Contact point analysis
   - Player posture and balance
   - Tactical patterns and shot selection

### 🏃‍♂️ Drill Tracking
1. Visit the **Drills** page
2. Set up court calibration with 4 corner points
3. Configure 3x3 grid zones
4. Start drill tracking session
5. Monitor movement patterns and zone coverage
6. Get real-time statistics:
   - Valid cycles completed
   - Total moves and distance
   - Average speed
   - Session duration
7. Export drill analysis data

### 👥 Player Detection
1. Access **Player Detection** feature
2. Set up multi-player tracking
3. Monitor individual player performance
4. Generate heatmaps and movement analysis
5. Export player-specific data

### 📊 Analytics Dashboard
1. Visit the **Analytics** page
2. View performance trends and charts
3. Track progress over time
4. Analyze form quality and stamina levels
5. Review calorie burn and recovery metrics
6. Export data for further analysis

### 📈 Performance Insights
- **Real-time Charts**: Reps over time, pose scores, activity levels
- **Stamina Assessment**: Age and weight-based evaluation
- **Calorie Tracking**: Dynamic calculation based on exercise type
- **Form Analysis**: AI-powered technique evaluation
- **Progress Visualization**: Performance trends and improvements

## 🏗️ Project Structure

```
kompete-ai-website/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── Exercise*.tsx  # Exercise components
│   │   ├── PerformanceInsights.tsx
│   │   ├── PlayerDetection.tsx
│   │   └── Utils.tsx
│   ├── pages/             # Page components
│   │   ├── Index.tsx
│   │   ├── Exercise.tsx
│   │   ├── LiveCamera.tsx
│   │   ├── Drills.tsx
│   │   └── AnalyticsGemini.tsx
│   ├── services/          # API services
│   │   └── geminiService.ts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
└── index.html            # HTML entry point
```

## 🔧 Configuration

### API Keys
The application requires a Google Gemini API key for video analysis:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your environment variables:
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

### Camera Permissions
For live analysis features, ensure your browser has camera access permissions.

## 🚀 Deployment

This project is deployed on Vercel. You can test the live application by visiting the deployed URL.

