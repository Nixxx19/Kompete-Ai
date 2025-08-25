import { useState } from 'react';
import { PlayerDetails, type PlayerDetails as PlayerDetailsType } from '@/components/PlayerDetails';
import { ExerciseSelector, type ExerciseType } from '@/components/ExerciseSelector';
import { ExerciseUpload } from '@/components/ExerciseUpload';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const Exercise = () => {
  const [playerDetails, setPlayerDetails] = useState<PlayerDetailsType | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [videoUploaded, setVideoUploaded] = useState(false);

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
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-foreground">Exercise Analysis</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">AI-powered performance tracking</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-4 sm:py-8">
          <div className="space-y-4 sm:space-y-8">
            {/* Player Details Section */}
            <section>
              <PlayerDetails onDetailsChange={setPlayerDetails} />
            </section>

            {/* Exercise Selection Section */}
            <section>
              <ExerciseSelector 
                onExerciseSelect={setSelectedExercise}
                selectedExercise={selectedExercise}
              />
            </section>

            {/* Upload Section - Only show if exercise is selected */}
            {selectedExercise && (
              <section>
                <ExerciseUpload 
                  selectedExercise={selectedExercise} 
                  onVideoUpload={setVideoUploaded}
                />
              </section>
            )}

            {/* Progress Summary */}
            <section>
              <div className="relative backdrop-blur-xl bg-glass border-glass-border rounded-lg p-3 sm:p-6 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/5 rounded-lg" />
                <div className="relative z-10">
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Session Progress</h3>
                  <div className="grid grid-cols-3 gap-1 sm:gap-4">
                     <div className="text-center">
                       <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-500 ${
                         playerDetails?.name ? 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20' : 'bg-muted text-muted-foreground'
                       }`}>
                         {playerDetails?.name ? '✓' : '1'}
                       </div>
                       <p className="text-xs sm:text-sm font-medium">Player</p>
                       <p className="text-xs text-muted-foreground">
                         {playerDetails?.name ? 'Complete' : 'Pending'}
                       </p>
                     </div>
                    
                     <div className="text-center">
                       <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-500 ${
                         selectedExercise ? 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20' : 'bg-muted text-muted-foreground'
                       }`}>
                         {selectedExercise ? '✓' : '2'}
                       </div>
                       <p className="text-xs sm:text-sm font-medium">Exercise</p>
                       <p className="text-xs text-muted-foreground truncate px-1">
                         {selectedExercise ? selectedExercise.name : 'Pending'}
                       </p>
                     </div>
                    
                     <div className="text-center">
                       <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-500 ${
                         videoUploaded ? 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20' : 'bg-muted text-muted-foreground'
                       }`}>
                         {videoUploaded ? '✓' : '3'}
                       </div>
                       <p className="text-xs sm:text-sm font-medium">Video</p>
                       <p className="text-xs text-muted-foreground">
                         {videoUploaded ? 'Complete' : 'Pending'}
                       </p>
                     </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Exercise;