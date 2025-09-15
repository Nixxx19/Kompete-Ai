# KOMPTE AI - Badminton Performance Analytics

<div align="center">
  <img src="public/favicon1.ico" alt="KOMPTE AI Logo" width="80" height="80">
  
  **AI-Powered Badminton Analysis & Performance Tracking**
  
  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF.svg)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.11-38B2AC.svg)](https://tailwindcss.com/)
</div>

## 🚀 Overview

KOMPTE AI is a specialized badminton performance analytics platform that leverages artificial intelligence to analyze badminton videos and provide detailed insights for players and coaches. Built with modern web technologies, it offers shot-by-shot analysis, real-time performance tracking, and personalized coaching recommendations specifically designed for badminton.

## ✨ Features

### 🎯 Core Capabilities
- **AI-Powered Badminton Analysis**: Upload badminton videos for detailed shot-by-shot analysis using Google Gemini
- **Real-Time Performance Tracking**: Live camera analysis with instant feedback
- **Shot Analysis**: Comprehensive analysis of all badminton shot types
- **Professional Analytics**: Detailed form analysis, performance metrics, and coaching insights
- **Player Detection**: Advanced computer vision for player identification and tracking
- **Drill Tracking**: Court-based movement analysis and drill performance

### 🏸 Badminton Features
- **Shot Type Analysis**: Smash, clear, drop, net shot, drive, lift, push, block
- **Trajectory Classification**: Defensive clear, attacking clear, drive, smash, drop, net-drop
- **Technique Zones**: Forehand overhead, backhand underarm analysis
- **Shuttle Speed Estimation**: Real-time speed calculation in km/h
- **Contact Point Analysis**: Sweet spot, frame, off-center, top of strings
- **Player Posture Assessment**: Ready stance, crouch, jump smash, off-balance detection
- **Tactical Pattern Recognition**: Shot selection tendencies and strategic analysis

### 📊 Analytics & Insights
- **Badminton-Specific Metrics**: Shot accuracy, rally analysis, court coverage
- **Performance Tracking**: Speed, technique, and tactical analysis
- **Coaching Recommendations**: Personalized badminton improvement suggestions
- **Progress Visualization**: Charts and graphs for performance trends
- **Rally Analysis**: Complete rally breakdown with tactical insights

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
- **Google Gemini 1.5 Flash** - Badminton video analysis and shot insights
- **MediaPipe** - Pose detection and player tracking

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
   git clone https://github.com/Nixxx19/kompete-Ai-Website.git
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

### 🏸 Badminton Video Analysis
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

### 📹 Live Badminton Analysis
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

### 🏃‍♂️ Badminton Drill Tracking
1. Visit the **Drills** page
2. Set up court calibration with 4 corner points
3. Configure 3x3 grid zones
4. Start drill tracking session
5. Monitor movement patterns and court coverage
6. Get real-time statistics:
   - Valid cycles completed
   - Total moves and distance
   - Average speed
   - Session duration
7. Export drill analysis data

### 👥 Badminton Player Detection
1. Access **Player Detection** feature
2. Set up multi-player tracking for badminton
3. Monitor individual player performance
4. Generate heatmaps and movement analysis
5. Export player-specific data

### 📊 Badminton Analytics Dashboard
1. Visit the **Analytics** page
2. View badminton performance trends and charts
3. Track shot accuracy and technique over time
4. Analyze rally patterns and tactical decisions
5. Review court coverage and movement efficiency
6. Export data for further analysis

### 📈 Badminton Performance Insights
- **Shot Analysis Charts**: Shot type distribution, accuracy trends
- **Rally Breakdown**: Complete rally analysis with tactical insights
- **Technique Assessment**: AI-powered badminton technique evaluation
- **Court Coverage**: Movement patterns and positioning analysis
- **Tactical Patterns**: Shot selection tendencies and strategic analysis

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

