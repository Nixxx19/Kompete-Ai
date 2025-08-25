import { useState } from 'react';
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
    icon: <Activity className="w-8 h-8" />,
    description: 'Full body cardio exercise for endurance',
    difficulty: 'Easy',
    duration: '30 sec',
    calories: '8-12',
    color: 'blue'
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    icon: <Zap className="w-8 h-8" />,
    description: 'Cardio and leg strength builder',
    difficulty: 'Medium',
    duration: '30 sec',
    calories: '10-15',
    color: 'yellow'
  },
  {
    id: 'push-ups',
    name: 'Push Ups',
    icon: <Dumbbell className="w-8 h-8" />,
    description: 'Upper body strength training',
    difficulty: 'Medium',
    duration: '30 sec',
    calories: '5-8',
    color: 'orange'
  },
  {
    id: 'squats',
    name: 'Squats',
    icon: <Target className="w-8 h-8" />,
    description: 'Lower body strength and stability',
    difficulty: 'Easy',
    duration: '30 sec',
    calories: '6-10',
    color: 'green'
  }
];

export const ExerciseSelector = ({ onExerciseSelect, selectedExercise }: ExerciseSelectorProps) => {
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
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-all duration-300 group-hover:scale-110">
            <BarChart3 className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground group-hover:text-accent transition-colors duration-300">
              Choose Exercise
            </h3>
            <p className="text-sm text-muted-foreground">Select your workout type</p>
          </div>
          <div className="ml-auto">
            <Sparkles className="w-5 h-5 text-primary opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className={`relative group/item cursor-pointer transition-all duration-500 animate-scale-in w-65 h-55 ${
                selectedExercise?.id === exercise.id
                  ? 'ring-2 ring-primary shadow-lg shadow-primary/20 scale-105'
                  : 'hover:ring-1 hover:ring-accent/50 hover:scale-105'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onExerciseSelect(exercise)}
            >
              <Card className="h-full glass-card border-border/50 p-4 hover:bg-secondary/40 transition-all duration-500 group-hover/item:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-xl bg-${exercise.color}-500/20 text-${exercise.color}-400 group-hover/item:bg-${exercise.color}-500/30 transition-all duration-300 group-hover/item:scale-110`}>
                      {exercise.icon}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-semibold text-foreground group-hover/item:text-primary transition-colors duration-300">
                          {exercise.name}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {exercise.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
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
