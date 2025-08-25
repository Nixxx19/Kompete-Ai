import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Video, 
  PlayCircle,
  FileVideo,
  Zap,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface ExerciseUploadProps {
  selectedExercise: any;
  onVideoUpload?: (uploaded: boolean) => void;
}

export const ExerciseUpload = ({ selectedExercise, onVideoUpload }: ExerciseUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const navigate = useNavigate();

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
      // Add toast notification
      toast({
        title: "Video Uploaded",
        description: `${files[0].name} uploaded successfully`,
      });
      onVideoUpload?.(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Add toast notification
      toast({
        title: "Video Uploaded",
        description: `${file.name} uploaded successfully`,
      });
      onVideoUpload?.(true);
    }
  };

  const handleRecordLive = () => {
    navigate(`/live-analysis?exercise=${encodeURIComponent(selectedExercise.name)}`);
  };

  const handleStartAnalysis = () => {
    if (uploadedFile) {
      // Create a URL for the uploaded file and store it in sessionStorage
      const videoUrl = URL.createObjectURL(uploadedFile);
      sessionStorage.setItem('uploadedVideoUrl', videoUrl);
      sessionStorage.setItem('uploadedVideoName', uploadedFile.name);
      
      toast({
        title: "Analysis Started",
        description: "Your video is being processed. Results will be available shortly.",
      });
      
      // Navigate to live camera page with video parameter
      navigate(`/analysis?exercise=${encodeURIComponent(selectedExercise.name)}&mode=upload`);
    }
  };

  return (
    <Card className="premium-card p-6">
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
            Upload your {selectedExercise?.name || 'exercise'} recording for AI-powered performance analysis
          </p>
        </div>

        {/* Upload Process Steps */}
        <div className="flex items-center justify-center gap-1 sm:gap-4 mb-8 px-2 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2 min-w-fit">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-500 ${
              uploadedFile 
                ? 'bg-green-500 text-white scale-110 shadow-lg shadow-green-500/30' 
                : 'bg-primary text-primary-foreground'
            }`}>
              {uploadedFile ? '✓' : '1'}
            </div>
            <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
              uploadedFile ? 'text-green-500' : 'text-primary'
            }`}>
              Upload
            </span>
          </div>
          <div className={`w-3 sm:w-8 h-0.5 transition-colors duration-500 ${
            uploadedFile ? 'bg-green-500/50' : 'bg-border'
          }`}></div>
          <div className="flex items-center gap-1 sm:gap-2 min-w-fit">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs sm:text-sm font-medium">
              2
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Process</span>
          </div>
          <div className="w-3 sm:w-8 h-0.5 bg-border"></div>
          <div className="flex items-center gap-1 sm:gap-2 min-w-fit">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs sm:text-sm font-medium">
              3
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Results</span>
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
                  <div className="p-4 rounded-full bg-green-500/20 border-2 border-green-500/30 pulse-glow">
                    <FileVideo className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400 font-medium">Ready for analysis</span>
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
            disabled={!uploadedFile}
            onClick={handleStartAnalysis}
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Analysis
          </Button>
        </div>

        {/* Exercise Info */}
        {selectedExercise && (
          <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20 text-accent">
                {selectedExercise.icon}
              </div>
              <div>
                <h4 className="font-medium text-foreground">Selected Exercise: {selectedExercise.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedExercise.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};