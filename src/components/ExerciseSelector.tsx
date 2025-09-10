import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Zap, 
  Dumbbell, 
  Target,
  Clock,
  BarChart3,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface ExerciseSelectorProps {
  onExerciseSelect: (exercise: ExerciseType) => void;
  selectedExercise: ExerciseType | null;
}

export interface ExerciseType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
  calories: string;
  color: string;
}

const exercises: ExerciseType[] = [
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    icon: <Activity className="w-6 h-6" />,
    description: 'Full body cardio exercise for endurance',
    difficulty: 'Easy',
    duration: '30 sec',
    calories: '8-12',
    color: 'blue'
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    icon: <Zap className="w-6 h-6" />,
    description: 'Cardio and leg strength builder',
    difficulty: 'Medium',
    duration: '30 sec',
    calories: '10-15',
    color: 'yellow'
  },
  {
    id: 'push-ups',
    name: 'Push Ups',
    icon: <Dumbbell className="w-6 h-6" />,
    description: 'Upper body strength training',
    difficulty: 'Medium',
    duration: '30 sec',
    calories: '5-8',
    color: 'orange'
  },
  {
    id: 'squats',
    name: 'Squats',
    icon: <Target className="w-6 h-6" />,
    description: 'Lower body strength and stability',
    difficulty: 'Easy',
    duration: '30 sec',
    calories: '6-10',
    color: 'green'
  }
];

export const ExerciseSelector = ({ onExerciseSelect, selectedExercise }: ExerciseSelectorProps) => {
  const exerciseCardsRef = useRef<HTMLDivElement>(null);

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is on the Start Analysis button
      const startAnalysisButton = document.querySelector('[data-testid="start-analysis-button"]');
      if (startAnalysisButton && startAnalysisButton.contains(target)) {
        return; // Don't deselect if clicking on Start Analysis button
      }
      
      if (exerciseCardsRef.current && !exerciseCardsRef.current.contains(target)) {
        onExerciseSelect(null as any);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onExerciseSelect]);

  // Auto-scroll when exercise is selected
  useEffect(() => {
    if (selectedExercise) {
      // Scroll to the Start Analysis button
      const startAnalysisButton = document.querySelector('[data-testid="start-analysis-button"]');
      if (startAnalysisButton) {
        startAnalysisButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [selectedExercise]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/20';
      default: return 'text-muted-foreground bg-muted/20';
    }
  };

  return (
    <Card className="glass-card shadow-2xl group hover:shadow-3xl transition-all duration-500 animate-fade-in hover:-translate-y-1" style={{animationDelay: '0.2s'}}>
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/20 transition-all duration-300">
            <BarChart3 className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground transition-colors duration-300">
              Choose Exercise
            </h3>
            <p className="text-sm text-muted-foreground">Select your workout type</p>
          </div>
          <div className="ml-auto">
            <Sparkles className="w-5 h-5 text-primary opacity-50 transition-opacity duration-300" />
          </div>
        </div>
        
        <div ref={exerciseCardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className={`relative group/item cursor-pointer transition-all duration-500 animate-scale-in w-65 h-55 rounded-lg ${
                selectedExercise?.id === exercise.id
                  ? ''
                  : 'hover:scale-[1.02]'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onExerciseSelect(exercise)}
            >
              <Card className={`h-full bg-card p-3 hover:bg-secondary/40 transition-all duration-500 group-hover/item:shadow-xl rounded-lg ${
                selectedExercise?.id === exercise.id
                  ? 'border-2 border-purple-800'
                  : 'border border-border/50'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg bg-${exercise.color}-500/20 text-${exercise.color}-400 transition-all duration-300`}>
                      {React.cloneElement(exercise.icon as React.ReactElement, { 
                        className: "w-9 h-9"
                      })}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="text-lg font-bold text-foreground/90 mb-1">
                          {exercise.name}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {exercise.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getDifficultyColor(exercise.difficulty)}`}>
                          {exercise.difficulty}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {exercise.duration}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {exercise.calories} cal
                        </div>
                      </div>
                      
                      <div className="flex items-center text-primary opacity-0 group-hover/item:opacity-100 transition-all duration-300 group-hover/item:translate-x-2">
                        <span className="text-xs font-medium">Select exercise</span>
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
