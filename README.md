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
- **Framer Motion** - Smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
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
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 📱 Usage

### Video Analysis
1. Navigate to the **Exercise** page
2. Enter player details (name, age, etc.)
3. Select your exercise type
4. Upload a video file (MP4, MOV, AVI)
5. Wait for AI analysis to complete
6. Review detailed insights and recommendations

### Live Camera Analysis
1. Go to **Live Camera** page
2. Allow camera permissions
3. Select your exercise
4. Start real-time analysis
5. Get instant feedback and corrections

### Analytics Dashboard
1. Visit the **Analytics** page
2. View performance trends
3. Track progress over time
4. Export data for further analysis

## 🏗️ Project Structure

```
kompete-ai-website/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── Exercise*.tsx  # Exercise-specific components
│   │   └── *.tsx          # Feature components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
└── tailwind.config.ts     # Tailwind configuration
```

## 🔧 Configuration

### API Keys
The application requires a Google Gemini API key for video analysis:

