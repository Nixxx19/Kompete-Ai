import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User, Sparkles, CheckCircle, Save } from 'lucide-react';

interface PlayerDetailsProps {
  onDetailsChange: (details: PlayerDetails) => void;
}

export interface PlayerDetails {
  name: string;
  age: string;
  height: string;
  weight: string;
  gender: string;
}

export const PlayerDetails = ({ onDetailsChange }: PlayerDetailsProps) => {
  const [details, setDetails] = useState<PlayerDetails>({
    name: '',
    age: '',
    height: '',
    weight: '',
    gender: ''
  });

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialDetails, setInitialDetails] = useState<PlayerDetails>({
    name: '',
    age: '',
    height: '',
    weight: '',
    gender: ''
  });

  // Load player details from sessionStorage on component mount
  useEffect(() => {
    const savedDetails = sessionStorage.getItem('playerDetails');
    if (savedDetails) {
      try {
        const parsedDetails = JSON.parse(savedDetails);
        setDetails(parsedDetails);
        setInitialDetails(parsedDetails);
        onDetailsChange(parsedDetails);
      } catch (error) {
        console.error('Error parsing saved player details:', error);
      }
    }
  }, []);

  const updateDetails = (field: keyof PlayerDetails, value: string) => {
    const newDetails = { ...details, [field]: value };
    setDetails(newDetails);
    
    // Check if there are changes compared to initial details
    const hasChanges = JSON.stringify(newDetails) !== JSON.stringify(initialDetails);
    setHasUnsavedChanges(hasChanges);
  };

  // Handle input validation
  const handleValidatedInput = (field: keyof PlayerDetails, value: string) => {
    if (['age', 'height', 'weight'].includes(field)) {
      // Only allow numbers for age, height, weight
      const numericValue = value.replace(/[^0-9]/g, '');
      updateDetails(field, numericValue);
    } else if (field === 'name') {
      // Only allow letters and spaces for name
      const nameValue = value.replace(/[^a-zA-Z\s]/g, '');
      updateDetails(field, nameValue);
    } else {
      updateDetails(field, value);
    }
  };

  // Prevent invalid key input
  const handleKeyDown = (e: React.KeyboardEvent, field: keyof PlayerDetails) => {
    // Allow backspace, delete, tab, escape, enter, and arrow keys for all fields
    if ([8, 9, 27, 13, 37, 38, 39, 40, 46].includes(e.keyCode)) {
      return;
    }
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X for all fields
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
      return;
    }
    
    if (['age', 'height', 'weight'].includes(field)) {
      // Prevent if not a number
      if (e.keyCode < 48 || (e.keyCode > 57 && e.keyCode < 96) || e.keyCode > 105) {
        e.preventDefault();
      }
    } else if (field === 'name') {
      // Allow letters (a-z, A-Z) and space (32)
      const isLetter = (e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 97 && e.keyCode <= 122);
      const isSpace = e.keyCode === 32;
      if (!isLetter && !isSpace) {
        e.preventDefault();
      }
    }
  };

  const confirmAllChanges = () => {
    // Save to sessionStorage
    sessionStorage.setItem('playerDetails', JSON.stringify(details));
    
    // Update initial details to current details
    setInitialDetails(details);
    
    // Call the callback prop
    onDetailsChange(details);
    
    // Reset unsaved changes flag and content flag
    setHasUnsavedChanges(false);
    // Keep hasContent as true since we now have saved content
  };

  const discardChanges = () => {
    // Reset to initial details
    setDetails(initialDetails);
    setHasUnsavedChanges(false);
  };

  return (
    <Card className="glass-card shadow-2xl group hover:shadow-3xl transition-all duration-500 animate-fade-in hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-all duration-300 group-hover:scale-110">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
              Player Details
            </h3>
            <p className="text-sm text-muted-foreground">Enter your personal information</p>
          </div>
          <div className="ml-auto">
            <Sparkles className="w-5 h-5 text-accent opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={details.name}
              onChange={(e) => handleValidatedInput('name', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'name')}
              className="bg-secondary/50 border-border/50 backdrop-blur-sm hover:bg-secondary/70 focus:bg-secondary/70 transition-all duration-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium text-muted-foreground">
              Age
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              value={details.age}
              onChange={(e) => handleValidatedInput('age', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'age')}
              className="bg-secondary/50 border-border/50 backdrop-blur-sm hover:bg-secondary/70 focus:bg-secondary/70 transition-all duration-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="height" className="text-sm font-medium text-muted-foreground">
              Height (cm)
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="175"
              value={details.height}
              onChange={(e) => handleValidatedInput('height', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'height')}
              className="bg-secondary/50 border-border/50 backdrop-blur-sm hover:bg-secondary/70 focus:bg-secondary/70 transition-all duration-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-sm font-medium text-muted-foreground">
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              placeholder="70"
              value={details.weight}
              onChange={(e) => handleValidatedInput('weight', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'weight')}
              className="bg-secondary/50 border-border/50 backdrop-blur-sm hover:bg-secondary/70 focus:bg-secondary/70 transition-all duration-300"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="gender" className="text-sm font-medium text-muted-foreground">
              Gender
            </Label>
            <Select value={details.gender} onValueChange={(value) => updateDetails('gender', value)}>
              <SelectTrigger className="bg-secondary/50 border-border/50 backdrop-blur-sm hover:bg-secondary/70 transition-all duration-300">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="glass-card">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Confirmation Buttons */}
        {hasUnsavedChanges && (
          <div className="mt-6 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                You have unsaved changes
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={discardChanges}
                  className="bg-secondary/50 hover:bg-secondary/70 border-border/50"
                >
                  Discard Changes
                </Button>
                <Button
                  onClick={confirmAllChanges}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Confirm & Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};