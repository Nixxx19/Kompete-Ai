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
    // Navigate to exercise analysis page
    if (selectedExercise) {
      const exerciseName = selectedExercise.name;
      const url = `/analysis?exercise=${encodeURIComponent(exerciseName)}`;
      console.log('Selected exercise:', selectedExercise);
      console.log('Exercise name:', exerciseName);
      console.log('Navigating to URL:', url);
      
      try {
        navigate(url);
        console.log('Navigation called successfully');
      } catch (error) {
        console.error('Navigation error:', error);
        toast({
          title: "Navigation Error",
          description: "Failed to navigate to analysis page",
          variant: "destructive"
        });
      }
    } else {
      console.error('No exercise selected');
      toast({
        title: "Error",
        description: "Please select an exercise first",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex justify-center">
      <Button 
        className="btn-premium px-12 py-6 text-lg min-w-[200px]"
        data-testid="start-analysis-button"
        onClick={() => {
          console.log('Button clicked!');
          handleStartAnalysis();
        }}
      >
        <Zap className="w-5 h-5 mr-3 opacity-70" />
        Start Analysis
      </Button>
    </div>
  );
};
