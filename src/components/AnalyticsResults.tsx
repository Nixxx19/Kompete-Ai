import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Clock, Calendar, Activity, Target, Trophy, Download, ArrowLeft, CheckCircle, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { ExerciseAnalysis } from "@/services/geminiService";
import ReactMarkdown from 'react-markdown';

interface Props {
  analysis: ExerciseAnalysis;
  onBack: () => void;
  videoFile?: File;
}

const AnalyticsResults = ({ analysis, onBack, videoFile }: Props) => {
  const getPerformanceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'elite': return 'text-purple-500 bg-purple-500/15 border-purple-500/30';
      case 'excellent': return 'text-green-500 bg-green-500/15 border-green-500/30';
      case 'good': return 'text-blue-500 bg-blue-500/15 border-blue-500/30';
      case 'average': return 'text-yellow-500 bg-yellow-500/15 border-yellow-500/30';
      default: return 'text-red-500 bg-red-500/15 border-red-500/30';
    }
  };

  const getPerformanceIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'elite': return '💎';
      case 'excellent': return '💪';
      case 'good': return '🙂';
      case 'average': return '😐';
      default: return '😓';
    }
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto max-w-7xl relative">
        
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Gemini AI Analysis</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Exercise Performance <span className="gradient-text">Results</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered analysis of your exercise performance with detailed insights and recommendations.
          </p>
        </div>

        {/* Video Player */}
        {videoFile && (
          <div className="mb-12">
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-700 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/15 to-transparent rounded-full blur-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-4 text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-blue-500/25">
                    <Video className="w-10 h-10 text-blue-300" />
                  </div>
                  <div>
                    <div>Uploaded Video</div>
                    <div className="text-lg text-muted-foreground font-normal">{videoFile.name}</div>
                  </div>
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-3 text-lg">
                  Review your uploaded badminton video with AI-powered analysis
                </CardDescription>
              </CardHeader>
                              <CardContent className="relative">
                  <div className="w-full max-w-5xl mx-auto">
                    <div className="relative group/video">
                      <video 
                        controls 
                        className="w-full h-auto rounded-2xl shadow-2xl shadow-blue-500/20 border border-blue-500/20 group-hover/video:shadow-blue-500/30 transition-all duration-500"
                        src={URL.createObjectURL(videoFile)}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>
                </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis Results */}
        <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-700 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl animate-fade-in" style={{animationDelay: '200ms'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-accent/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-500/15 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-4 text-3xl font-bold bg-gradient-to-r from-primary via-accent to-green-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-primary/25">
                <Activity className="w-10 h-10 text-primary" />
              </div>
              <div>
                <div>Analysis Results</div>
                <div className="text-lg text-muted-foreground font-normal">AI-Powered Performance Insights</div>
              </div>
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-3 text-lg">
              Detailed shot-by-shot analysis with professional coaching insights
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="prose prose-invert max-w-none bg-gradient-to-br from-background/60 via-background/40 to-background/60 rounded-2xl p-8 border border-border/40 shadow-xl shadow-primary/5 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl"></div>
              <div className="relative z-10">
                <ReactMarkdown
                  components={{
                    h1: ({children}) => (
                      <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-primary via-accent to-green-400 bg-clip-text mb-8 border-b-2 border-gradient-to-r from-primary/30 to-accent/30 pb-4 animate-fade-in">
                        {children}
                      </h1>
                    ),
                    h2: ({children}) => (
                      <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-accent to-green-400 bg-clip-text mb-6 mt-10 flex items-center gap-3 animate-fade-in" style={{animationDelay: '100ms'}}>
                        <div className="w-3 h-3 bg-gradient-to-r from-accent to-green-400 rounded-full shadow-lg shadow-accent/50"></div>
                        <div className="w-8 h-0.5 bg-gradient-to-r from-accent to-green-400 rounded-full"></div>
                        {children}
                      </h2>
                    ),
                    h3: ({children}) => (
                      <h3 className="text-2xl font-semibold text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text mb-4 mt-8 flex items-center gap-3 animate-fade-in" style={{animationDelay: '200ms'}}>
                        <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full shadow-lg shadow-green-400/50"></div>
                        {children}
                      </h3>
                    ),
                    strong: ({children}) => (
                      <strong className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-bold bg-blue-400/10 px-2 py-1 rounded-lg border border-blue-400/20 shadow-sm">
                        {children}
                      </strong>
                    ),
                    ul: ({children}) => (
                      <ul className="space-y-4 my-6">
                        {children}
                      </ul>
                    ),
                    li: ({children}) => (
                      <li className="flex items-start gap-4 text-muted-foreground p-4 rounded-xl hover:bg-gradient-to-r hover:from-secondary/40 hover:to-secondary/20 transition-all duration-300 group/item animate-fade-in" style={{animationDelay: '300ms'}}>
                        <span className="text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text mt-1 text-xl font-bold group-hover/item:scale-125 transition-transform duration-300">•</span>
                        <span className="leading-relaxed text-lg group-hover/item:text-foreground transition-colors duration-300">{children}</span>
                      </li>
                    ),
                    p: ({children}) => (
                      <p className="text-muted-foreground leading-relaxed mb-6 text-lg">
                        {children}
                      </p>
                    )
                  }}
                >
                  {analysis.rawAnalysis}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={onBack}
            className="group relative overflow-hidden bg-gradient-to-r from-secondary/50 to-secondary/30 border-2 border-border/50 hover:border-primary/50 hover:bg-gradient-to-r hover:from-secondary/70 hover:to-secondary/50 transition-all duration-500 px-8 py-4 text-lg font-semibold"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="relative z-10">Analyze Another Video</span>
          </Button>
          <Button 
            size="lg" 
            className="group relative overflow-hidden bg-gradient-to-r from-primary via-accent to-purple-500 hover:from-primary/90 hover:via-accent/90 hover:to-purple-500/90 transition-all duration-500 px-8 py-4 text-lg font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Download className="w-5 h-5 mr-3 group-hover:translate-y-1 transition-transform duration-300" />
            <span className="relative z-10">Download Report</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsResults;
