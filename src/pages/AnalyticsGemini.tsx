import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Video, 
  PlayCircle,
  FileVideo,
  Zap,
  ArrowLeft,
  Activity,
  BarChart3,
  Target,
  Sparkles,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { analyzeExerciseVideo, ExerciseAnalysis } from '@/services/geminiService';
import AnalyticsResults from '@/components/AnalyticsResults';

const AnalyticsGemini = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ExerciseAnalysis | null>(null);
  const navigate = useNavigate();

  /* ---------- static colour maps so Tailwind JIT keeps the classes ---------- */
  const featureColour = {
    green:  'bg-green-500/20  text-green-400',
    orange: 'bg-orange-500/20 text-orange-400',
    blue:   'bg-blue-500/20  text-blue-400'
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      setUploadedFile(files[0]);
      toast({
        title: "Video Uploaded",
        description: `${files[0].name} uploaded successfully`,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "Video Uploaded",
        description: `${file.name} uploaded successfully`,
      });
    }
  };

  const handleRecordLive = () => {
    navigate('/live-camera');
  };

  const handleStartAnalysis = async () => {
    if (uploadedFile) {
      setIsAnalyzing(true);
      
      try {
        // Use real Gemini API for analysis
        const results = await analyzeExerciseVideo(uploadedFile);
        setAnalysisResults(results);
        
        toast({
          title: "Analysis Complete",
          description: "Your video has been analyzed successfully!",
        });
      } catch (error) {
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to analyze video. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleBackToUpload = () => {
    setAnalysisResults(null);
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
      
      {/* Animated particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{animationDelay: '0s'}} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent/40 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-primary/20 rounded-full animate-pulse" style={{animationDelay: '2s'}} />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/80">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link to="/" className="self-start">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-2">
                  <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Back to Home</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-foreground">Analytics </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">AI-powered performance analytics</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {analysisResults ? (
              <AnalyticsResults analysis={analysisResults} onBack={handleBackToUpload} videoFile={uploadedFile} />
            ) : (
              <>
                {/* Hero Section */}
                <div className="text-center mb-12 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                    <Sparkles className="w-4 h-4" />
                    Powered by AI
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                    Advanced <span className="gradient-text">Analytics</span> Platform
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Upload your exercise videos for comprehensive AI-powered performance analysis with detailed insights and recommendations.
                  </p>
                </div>

            {/* Upload Card */}
            <Card className="premium-card p-6 mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/3 rounded-lg" />
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Upload Exercise Video</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Upload your exercise recording for AI-powered performance analysis
                  </p>
                </div>

                {/* Upload Process Steps */}
                <div className="flex items-center justify-center gap-1 sm:gap-4 mb-8 px-2 overflow-x-auto">
                  <div className="flex items-center gap-1 sm:gap-2 min-w-fit">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-500 border-2 ${
                      uploadedFile 
                        ? 'bg-green-500 text-white border-green-500 scale-110 shadow-lg shadow-green-500/30' 
                        : 'bg-primary/20 text-primary border-primary/30'
                    }`}>
                      {uploadedFile ? '✓' : '1'}
                    </div>
                    <span className={`text-sm sm:text-base font-semibold transition-colors duration-300 whitespace-nowrap ${
                      uploadedFile ? 'text-green-400' : 'text-primary'
                    }`}>
                      Upload
                    </span>
                  </div>
                  <div className={`w-4 sm:w-10 h-1 rounded-full transition-colors duration-500 ${
                    uploadedFile ? 'bg-green-500/60' : 'bg-border/50'
                  }`}></div>
                  <div className="flex items-center gap-1 sm:gap-2 min-w-fit">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold border-2 transition-all duration-500 ${
                      isAnalyzing 
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 scale-110 shadow-lg shadow-orange-500/30' 
                        : 'bg-muted/20 text-muted-foreground border-muted/30'
                    }`}>
                      {isAnalyzing ? '⟳' : '2'}
                    </div>
                    <span className={`text-sm sm:text-base font-semibold whitespace-nowrap transition-colors duration-300 ${
                      isAnalyzing ? 'text-orange-400' : 'text-muted-foreground'
                    }`}>
                      Process
                    </span>
                  </div>
                  <div className={`w-4 sm:w-10 h-1 rounded-full transition-colors duration-500 ${
                    analysisResults ? 'bg-green-500/60' : 'bg-border/50'
                  }`}></div>
                  <div className="flex items-center gap-1 sm:gap-2 min-w-fit">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold border-2 transition-all duration-500 ${
                      analysisResults 
                        ? 'bg-green-500 text-white border-green-500 scale-110 shadow-lg shadow-green-500/30' 
                        : 'bg-muted/20 text-muted-foreground border-muted/30'
                    }`}>
                      {analysisResults ? '✓' : '3'}
                    </div>
                    <span className={`text-sm sm:text-base font-semibold whitespace-nowrap transition-colors duration-300 ${
                      analysisResults ? 'text-green-400' : 'text-muted-foreground'
                    }`}>
                      Results
                    </span>
                  </div>
                </div>

                {/* Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                    isDragging 
                      ? 'border-primary bg-primary/5 scale-105' 
                      : 'border-border/50 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    {uploadedFile ? (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-center">
                          <div className={`p-4 rounded-full border-2 pulse-glow ${
                            isAnalyzing 
                              ? 'bg-orange-500/20 border-orange-500/30' 
                              : 'bg-green-500/20 border-green-500/30'
                          }`}>
                            {isAnalyzing ? (
                              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                            ) : (
                              <FileVideo className="w-8 h-8 text-green-400" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {isAnalyzing ? (
                              <>
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-orange-400 font-medium">Analyzing...</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-400 font-medium">Ready for analysis</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="p-4 rounded-full bg-primary/20">
                            <Video className="w-8 h-8 text-primary" />
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-medium text-foreground mb-2">
                            Upload Exercise Video
                          </p>
                          <p className="text-muted-foreground mb-4">
                            Drag and drop your video file here
                            <br />
                            or click to browse files
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Supported formats: MP4, MOV, AVI • Recommended: 1080p, 30+ fps, clear view
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-secondary/50 border-border/50 hover:bg-secondary/70"
                    onClick={handleRecordLive}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Record Live Video
                  </Button>
                  <Button 
                    className="flex-1 btn-premium"
                    disabled={!uploadedFile || isAnalyzing}
                    onClick={handleStartAnalysis}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Start Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: 'Precision Tracking',
                  description: 'Advanced AI algorithms track every movement with millimeter precision.',
                  color: 'green',
                  delay: '0ms'
                },
                {
                  icon: BarChart3,
                  title: 'Detailed Analytics',
                  description: 'Comprehensive performance metrics and actionable insights.',
                  color: 'orange',
                  delay: '100ms'
                },
                {
                  icon: Activity,
                  title: 'Real-time Feedback',
                  description: 'Instant feedback and recommendations for improvement.',
                  color: 'blue',
                  delay: '200ms'
                }
              ].map((feature, i) => (
                <Card
                  key={i}
                  className="glass-card p-8 shadow-2xl group hover:shadow-3xl transition-all duration-500 animate-scale-in hover:-translate-y-2"
                  style={{ animationDelay: feature.delay }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className={`p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300 ${featureColour[feature.color]}`}>
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    <div className="mt-6 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-2">
                      <span className="text-sm font-medium">Learn more</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnalyticsGemini;
