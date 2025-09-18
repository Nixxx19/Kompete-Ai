import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Clock, Calendar, Activity, Target, Trophy, Download, ArrowLeft, CheckCircle, Video, Target as TargetIcon, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ExerciseAnalysis } from "@/services/geminiService";
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';

interface Props {
  analysis: ExerciseAnalysis;
  onBack: () => void;
  videoFile?: File;
}

interface ShotAnalysis {
  shotNumber: number;
  playerIdentity: string;
  shotType: string;
  trajectoryClassification: string;
  techniqueZone: string;
  estimatedShuttleSpeed: string;
  contactPointOnRacket: string;
  playerPostureAtContact: string;
  balanceOrRecoveryStatus: string;
  shotQuality: string;
  improvementSuggestions: string;
}

// Function to parse analysis text and extract individual shots
const parseShotsFromAnalysis = (analysisText: string): ShotAnalysis[] => {
  const shots: ShotAnalysis[] = [];
  
  console.log("Full analysis text:", analysisText);
  
  // Extract total shot count from API response
  const totalShotsMatch = analysisText.match(/\*\*Total Shots Analyzed:\*\*\s*•\s*(\d+)/i);
  const totalShotsFromAPI = totalShotsMatch ? parseInt(totalShotsMatch[1], 10) : null;
  console.log("Total shots from API:", totalShotsFromAPI);
  
  // Split by "Shot X:" pattern - this should work with the API format
  const shotSections = analysisText.split(/(?=Shot\s+\d+:)/gi);
  console.log("Found Shot X sections:", shotSections.length);
  
  shotSections.forEach((section, index) => {
    const trimmedSection = section.trim();
    
    // Check if this section contains shot data
    if (trimmedSection && trimmedSection.toLowerCase().includes("shot")) {
      console.log(`Processing section ${index}:`, trimmedSection.substring(0, 300) + "...");

      // Extract actual shot number
      let shotNumber = index;
      const numberMatch = trimmedSection.match(/Shot\s+(\d+):/i);
      if (numberMatch) {
        shotNumber = parseInt(numberMatch[1], 10);
      }

      // Extract each field using line-by-line parsing (more reliable)
      const lines = trimmedSection.split('\n');
      const shot: ShotAnalysis = {
        shotNumber,
        playerIdentity: '',
        shotType: '',
        trajectoryClassification: '',
        techniqueZone: '',
        estimatedShuttleSpeed: '',
        contactPointOnRacket: '',
        playerPostureAtContact: '',
        balanceOrRecoveryStatus: '',
        shotQuality: '',
        improvementSuggestions: ''
      };
      
      // Parse each line to extract field values
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Debug: log each line being processed
        if (line.includes('**') && line.includes(':')) {
          console.log("Processing line:", line);
        }
        
        // Check if line contains field header and extract value from same line or next line
        if (line.includes('**Player Identity:**')) {
          // Try multiple patterns
          let value = '';
          const patterns = [
            /\*\*Player Identity:\*\*\s*•\s*(.+)/,
            /\*\*Player Identity:\*\*\s*(.+)/,
            /Player Identity:\s*•\s*(.+)/,
            /Player Identity:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            // Fallback to next line
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.playerIdentity = value;
          console.log("Player Identity extracted:", shot.playerIdentity);
        } else if (line.includes('**Shot Type:**')) {
          let value = '';
          const patterns = [
            /\*\*Shot Type:\*\*\s*•\s*(.+)/,
            /\*\*Shot Type:\*\*\s*(.+)/,
            /Shot Type:\s*•\s*(.+)/,
            /Shot Type:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.shotType = value;
          console.log("Shot Type extracted:", shot.shotType);
        } else if (line.includes('**Trajectory Classification:**')) {
          let value = '';
          const patterns = [
            /\*\*Trajectory Classification:\*\*\s*•\s*(.+)/,
            /\*\*Trajectory Classification:\*\*\s*(.+)/,
            /Trajectory Classification:\s*•\s*(.+)/,
            /Trajectory Classification:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.trajectoryClassification = value;
          console.log("Trajectory Classification extracted:", shot.trajectoryClassification);
        } else if (line.includes('**Technique Zone:**')) {
          let value = '';
          const patterns = [
            /\*\*Technique Zone:\*\*\s*•\s*(.+)/,
            /\*\*Technique Zone:\*\*\s*(.+)/,
            /Technique Zone:\s*•\s*(.+)/,
            /Technique Zone:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.techniqueZone = value;
          console.log("Technique Zone extracted:", shot.techniqueZone);
        } else if (line.includes('**Estimated Shuttle Speed:**')) {
          let value = '';
          const patterns = [
            /\*\*Estimated Shuttle Speed:\*\*\s*•\s*(.+)/,
            /\*\*Estimated Shuttle Speed:\*\*\s*(.+)/,
            /Estimated Shuttle Speed:\s*•\s*(.+)/,
            /Estimated Shuttle Speed:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.estimatedShuttleSpeed = value;
          console.log("Estimated Shuttle Speed extracted:", shot.estimatedShuttleSpeed);
        } else if (line.includes('**Contact Point on Racket:**')) {
          let value = '';
          const patterns = [
            /\*\*Contact Point on Racket:\*\*\s*•\s*(.+)/,
            /\*\*Contact Point on Racket:\*\*\s*(.+)/,
            /Contact Point on Racket:\s*•\s*(.+)/,
            /Contact Point on Racket:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.contactPointOnRacket = value;
          console.log("Contact Point on Racket extracted:", shot.contactPointOnRacket);
        } else if (line.includes('**Player Posture at Contact:**')) {
          let value = '';
          const patterns = [
            /\*\*Player Posture at Contact:\*\*\s*•\s*(.+)/,
            /\*\*Player Posture at Contact:\*\*\s*(.+)/,
            /Player Posture at Contact:\s*•\s*(.+)/,
            /Player Posture at Contact:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.playerPostureAtContact = value;
          console.log("Player Posture at Contact extracted:", shot.playerPostureAtContact);
        } else if (line.includes('**Balance or Recovery Status:**')) {
          let value = '';
          const patterns = [
            /\*\*Balance or Recovery Status:\*\*\s*•\s*(.+)/,
            /\*\*Balance or Recovery Status:\*\*\s*(.+)/,
            /Balance or Recovery Status:\s*•\s*(.+)/,
            /Balance or Recovery Status:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.balanceOrRecoveryStatus = value;
          console.log("Balance or Recovery Status extracted:", shot.balanceOrRecoveryStatus);
        } else if (line.includes('**Shot Quality:**')) {
          let value = '';
          const patterns = [
            /\*\*Shot Quality:\*\*\s*•\s*(.+)/,
            /\*\*Shot Quality:\*\*\s*(.+)/,
            /Shot Quality:\s*•\s*(.+)/,
            /Shot Quality:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.shotQuality = value;
          console.log("Shot Quality extracted:", shot.shotQuality);
        } else if (line.includes('**Improvement Suggestions:**')) {
          let value = '';
          const patterns = [
            /\*\*Improvement Suggestions:\*\*\s*•\s*(.+)/,
            /\*\*Improvement Suggestions:\*\*\s*(.+)/,
            /Improvement Suggestions:\s*•\s*(.+)/,
            /Improvement Suggestions:\s*(.+)/
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              value = match[1].replace(/\*\*/g, '').trim();
              break;
            }
          }
          
          if (!value) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && (nextLine.startsWith('•') || nextLine.includes(':'))) {
              value = nextLine.replace(/^•\s*/, '').replace(/\*\*/g, '').trim();
            }
          }
          
          shot.improvementSuggestions = value;
          console.log("Improvement Suggestions extracted:", shot.improvementSuggestions);
        }
      }

      console.log("Created shot object:", shot);
      console.log("Raw section being parsed:", trimmedSection.substring(0, 500));

      // Add shot if it has meaningful data
      if (shot.playerIdentity || shot.shotType || shot.trajectoryClassification) {
        shots.push(shot);
        console.log("✅ Added shot:", shot);
      } else {
        console.log("❌ Skipped shot - insufficient data:", shot);
      }
    }
  });

  console.log("🎯 Final shots array length:", shots.length);
  console.log("🎯 API expected shots:", totalShotsFromAPI);
  console.log("🎯 All shots:", shots);
  return shots;
};

const AnalyticsResults = ({ analysis, onBack, videoFile }: Props) => {
  const [showRawAnalysis, setShowRawAnalysis] = useState(false);
  const [showPlayerSummary, setShowPlayerSummary] = useState(false);
  const shots = parseShotsFromAnalysis(analysis.rawAnalysis);
  
  // Extract total shot count from API response
  const totalShotsMatch = analysis.rawAnalysis.match(/\*\*Total Shots Analyzed:\*\*\s*•\s*(\d+)/i);
  const totalShotsFromAPI = totalShotsMatch ? parseInt(totalShotsMatch[1], 10) : null;
  
  // Debug logging
  console.log('Analysis text:', analysis.rawAnalysis);
  console.log('Parsed shots:', shots);
  console.log('Number of shots found:', shots.length);
  console.log('Total shots from API:', totalShotsFromAPI);
  
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

  // Extract detailed player summaries from raw analysis
  const extractDetailedPlayerSummaries = (rawAnalysis: string) => {
    const summaries: { [key: string]: any } = {};
    
    console.log("Raw analysis for parsing:", rawAnalysis.substring(0, 1000));
    
    // Look for Player 1 and Player 2 summary patterns with more flexible matching
    const player1Match = rawAnalysis.match(/Player 1 Summary:([\s\S]*?)(?=Player 2 Summary:|$)/i);
    const player2Match = rawAnalysis.match(/Player 2 Summary:([\s\S]*?)(?=Player \d+ Summary:|$)/i);
    
    console.log("Player 1 match:", player1Match ? player1Match[1].substring(0, 200) : "No match");
    console.log("Player 2 match:", player2Match ? player2Match[1].substring(0, 200) : "No match");
    
    if (player1Match) {
      summaries['Player 1'] = parsePlayerSummary(player1Match[1]);
    }
    if (player2Match) {
      summaries['Player 2'] = parsePlayerSummary(player2Match[1]);
    }
    
    // Also try to match with the actual player names from shots
    shots.forEach(shot => {
      const playerName = shot.playerIdentity;
      if (playerName && !summaries[playerName]) {
        // Try to find summary for this specific player name
        const playerMatch = rawAnalysis.match(new RegExp(`${playerName} Summary:([\\s\\S]*?)(?=\\w+ Summary:|$)`, 'i'));
        if (playerMatch) {
          summaries[playerName] = parsePlayerSummary(playerMatch[1]);
        }
      }
    });
    
    // Map Player 1/Player 2 to actual player names from shots
    const playerNames = [...new Set(shots.map(shot => shot.playerIdentity).filter(Boolean))];
    if (playerNames.length >= 1 && summaries['Player 1']) {
      summaries[playerNames[0]] = summaries['Player 1'];
    }
    if (playerNames.length >= 2 && summaries['Player 2']) {
      summaries[playerNames[1]] = summaries['Player 2'];
    }
    
    console.log("Extracted summaries:", summaries);
    return summaries;
  };

  const parsePlayerSummary = (summaryText: string) => {
    const summary: any = {
      tacticalPatterns: '',
      shotSelectionTendencies: '',
      strengthsAndWeaknesses: '',
      coachingSuggestions: ''
    };
    
    console.log("Parsing summary text:", summaryText.substring(0, 500));
    
    // Extract each section with more flexible patterns
    const patterns = [
      { key: 'tacticalPatterns', regex: /• Tactical Patterns: (.+?)(?=•|$)/s },
      { key: 'shotSelectionTendencies', regex: /• Shot Selection Tendencies: (.+?)(?=•|$)/s },
      { key: 'strengthsAndWeaknesses', regex: /• Strengths and Weaknesses: (.+?)(?=•|$)/s },
      { key: 'coachingSuggestions', regex: /• Final Coaching Suggestions: (.+?)(?=•|$)/s }
    ];
    
    patterns.forEach(({ key, regex }) => {
      const match = summaryText.match(regex);
      if (match) {
        summary[key] = match[1].trim().replace(/•\s*$/, '').trim();
        console.log(`Found ${key}:`, summary[key].substring(0, 100));
      }
    });
    
    // Also try alternative patterns without bullet points
    if (!summary.tacticalPatterns) {
      const altMatch = summaryText.match(/Tactical Patterns: (.+?)(?=Shot Selection|Strengths|Coaching|$)/s);
      if (altMatch) summary.tacticalPatterns = altMatch[1].trim().replace(/•\s*$/, '').trim();
    }
    
    if (!summary.shotSelectionTendencies) {
      const altMatch = summaryText.match(/Shot Selection Tendencies: (.+?)(?=Strengths|Coaching|$)/s);
      if (altMatch) summary.shotSelectionTendencies = altMatch[1].trim().replace(/•\s*$/, '').trim();
    }
    
    if (!summary.strengthsAndWeaknesses) {
      const altMatch = summaryText.match(/Strengths and Weaknesses: (.+?)(?=Coaching|$)/s);
      if (altMatch) summary.strengthsAndWeaknesses = altMatch[1].trim().replace(/•\s*$/, '').trim();
    }
    
    if (!summary.coachingSuggestions) {
      const altMatch = summaryText.match(/Final Coaching Suggestions: (.+?)(?=$)/s);
      if (altMatch) summary.coachingSuggestions = altMatch[1].trim().replace(/•\s*$/, '').trim();
    }
    
    // Try even more flexible patterns for the exact format shown
    if (!summary.tacticalPatterns) {
      const flexMatch = summaryText.match(/\*\*Tactical Patterns:\*\* (.+?)(?=\*\*|$)/s);
      if (flexMatch) summary.tacticalPatterns = flexMatch[1].trim().replace(/•\s*$/, '').trim();
    }
    
    if (!summary.shotSelectionTendencies) {
      const flexMatch = summaryText.match(/\*\*Shot Selection Tendencies:\*\* (.+?)(?=\*\*|$)/s);
      if (flexMatch) summary.shotSelectionTendencies = flexMatch[1].trim().replace(/•\s*$/, '').trim();
    }
    
    if (!summary.strengthsAndWeaknesses) {
      const flexMatch = summaryText.match(/\*\*Strengths and Weaknesses:\*\* (.+?)(?=\*\*|$)/s);
      if (flexMatch) summary.strengthsAndWeaknesses = flexMatch[1].trim().replace(/•\s*$/, '').trim();
    }
    
    if (!summary.coachingSuggestions) {
      const flexMatch = summaryText.match(/\*\*Final Coaching Suggestions:\*\* (.+?)(?=\*\*|$)/s);
      if (flexMatch) summary.coachingSuggestions = flexMatch[1].trim().replace(/•\s*$/, '').trim();
    }
    
    console.log("Parsed summary:", summary);
    return summary;
  };

  // Calculate player summaries
  const calculatePlayerSummary = () => {
    const playerStats: { [key: string]: any } = {};
    const detailedSummaries = extractDetailedPlayerSummaries(analysis.rawAnalysis);
    
    shots.forEach(shot => {
      const player = shot.playerIdentity || 'Unknown Player';
      
      if (!playerStats[player]) {
        playerStats[player] = {
          totalShots: 0,
          shotTypes: {},
          trajectoryClassifications: {},
          techniqueZones: {},
          shotQualities: {},
          avgShuttleSpeed: 0,
          speedValues: [],
          improvementSuggestions: [],
          detailedSummary: detailedSummaries[player] || null
        };
      }
      
      playerStats[player].totalShots++;
      
      // Count shot types
      if (shot.shotType) {
        playerStats[player].shotTypes[shot.shotType] = (playerStats[player].shotTypes[shot.shotType] || 0) + 1;
      }
      
      // Count trajectory classifications
      if (shot.trajectoryClassification) {
        playerStats[player].trajectoryClassifications[shot.trajectoryClassification] = (playerStats[player].trajectoryClassifications[shot.trajectoryClassification] || 0) + 1;
      }
      
      // Count technique zones
      if (shot.techniqueZone) {
        playerStats[player].techniqueZones[shot.techniqueZone] = (playerStats[player].techniqueZones[shot.techniqueZone] || 0) + 1;
      }
      
      // Count shot qualities
      if (shot.shotQuality) {
        playerStats[player].shotQualities[shot.shotQuality] = (playerStats[player].shotQualities[shot.shotQuality] || 0) + 1;
      }
      
      // Extract shuttle speed for average calculation
      if (shot.estimatedShuttleSpeed) {
        const speedMatch = shot.estimatedShuttleSpeed.match(/(\d+)/);
        if (speedMatch) {
          playerStats[player].speedValues.push(parseInt(speedMatch[1]));
        }
      }
      
      // Collect improvement suggestions
      if (shot.improvementSuggestions) {
        playerStats[player].improvementSuggestions.push(shot.improvementSuggestions);
      }
    });
    
    // Calculate averages
    Object.keys(playerStats).forEach(player => {
      if (playerStats[player].speedValues.length > 0) {
        playerStats[player].avgShuttleSpeed = Math.round(
          playerStats[player].speedValues.reduce((a, b) => a + b, 0) / playerStats[player].speedValues.length
        );
      }
    });
    
    return playerStats;
  };

  const playerStats = calculatePlayerSummary();

  // Player Summary Component
  const PlayerSummaryCard = ({ playerName, stats, index }: { playerName: string; stats: any; index: number }) => (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl animate-fade-in" style={{animationDelay: `${index * 150}ms`}}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-accent/20 to-transparent rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-500/15 to-transparent rounded-full blur-lg"></div>
      
      <CardHeader className="relative pb-3">
        <CardTitle className="flex items-center gap-3 text-lg font-bold bg-gradient-to-r from-primary via-accent to-green-400 bg-clip-text text-transparent">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shadow-md shadow-primary/25">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-base">{playerName}</div>
            <div className="text-xs text-muted-foreground font-normal">Summary</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
            <div className="text-xl font-bold text-blue-400">{stats.totalShots}</div>
            <div className="text-xs text-muted-foreground">Total Shots</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
            <div className="text-xl font-bold text-green-400">{stats.avgShuttleSpeed} km/h</div>
            <div className="text-xs text-muted-foreground">Avg Speed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
            <div className="text-xl font-bold text-purple-400">{Object.keys(stats.shotTypes).length}</div>
            <div className="text-xs text-muted-foreground">Shot Types</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20">
            <div className="text-xl font-bold text-orange-400">{Object.keys(stats.techniqueZones).length}</div>
            <div className="text-xs text-muted-foreground">Technique Zones</div>
          </div>
        </div>

        {/* Shot Types Breakdown */}
        {Object.keys(stats.shotTypes).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Shot Types</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.shotTypes).map(([shotType, count]) => (
                <Badge key={shotType} variant="outline" className="text-xs text-blue-400 border-blue-400/30 bg-blue-400/10 px-2 py-1">
                  {shotType} ({count as number})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Trajectory Classifications */}
        {Object.keys(stats.trajectoryClassifications).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Trajectories</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.trajectoryClassifications).map(([trajectory, count]) => (
                <Badge key={trajectory} variant="outline" className="text-xs text-green-400 border-green-400/30 bg-green-400/10 px-2 py-1">
                  {trajectory} ({count as number})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Shot Quality Distribution */}
        {Object.keys(stats.shotQualities).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Shot Quality</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.shotQualities).map(([quality, count]) => (
                <Badge key={quality} variant="outline" className="text-xs text-purple-400 border-purple-400/30 bg-purple-400/10 px-2 py-1">
                  {quality} ({count as number})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Summary from Gemini */}
        {stats.detailedSummary && (
          <div className="space-y-3">
            {/* Tactical Patterns */}
            {stats.detailedSummary.tacticalPatterns && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <h4 className="font-bold text-blue-400 mb-2 text-sm">Tactical Patterns</h4>
                <p className="text-foreground text-xs leading-relaxed">
                  {stats.detailedSummary.tacticalPatterns}
                </p>
              </div>
            )}

            {/* Shot Selection Tendencies */}
            {stats.detailedSummary.shotSelectionTendencies && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <h4 className="font-bold text-green-400 mb-2 text-sm">Shot Selection</h4>
                <p className="text-foreground text-xs leading-relaxed">
                  {stats.detailedSummary.shotSelectionTendencies}
                </p>
              </div>
            )}

            {/* Strengths and Weaknesses */}
            {stats.detailedSummary.strengthsAndWeaknesses && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                <h4 className="font-bold text-purple-400 mb-2 text-sm">Strengths & Weaknesses</h4>
                <p className="text-foreground text-xs leading-relaxed">
                  {stats.detailedSummary.strengthsAndWeaknesses}
                </p>
              </div>
            )}

            {/* Final Coaching Suggestions */}
            {stats.detailedSummary.coachingSuggestions && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <h4 className="font-bold text-amber-400 mb-2 text-sm">Coaching Suggestions</h4>
                <p className="text-foreground text-xs leading-relaxed">
                  {stats.detailedSummary.coachingSuggestions}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Debug: Show if no detailed summary found */}
        {!stats.detailedSummary && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20">
            <h4 className="font-bold text-gray-400 mb-2 text-sm">Debug Info</h4>
            <p className="text-foreground text-xs leading-relaxed">
              No detailed summary found for {playerName}. Check console for parsing details.
            </p>
          </div>
        )}

        {/* Fallback: Individual Shot Improvement Suggestions */}
        {!stats.detailedSummary && stats.improvementSuggestions.length > 0 && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <h4 className="font-bold text-amber-400 mb-2 text-sm">Key Areas</h4>
            <div className="space-y-1">
              {stats.improvementSuggestions.slice(0, 2).map((suggestion, idx) => (
                <p key={idx} className="text-foreground text-xs leading-relaxed">
                  • {suggestion}
                </p>
              ))}
              {stats.improvementSuggestions.length > 2 && (
                <p className="text-muted-foreground text-xs">
                  +{stats.improvementSuggestions.length - 2} more...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Shot Card Component
  const ShotCard = ({ shot, index }: { shot: ShotAnalysis; index: number }) => (
    <div className="space-y-4">
      <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/20 to-transparent rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/15 to-transparent rounded-full blur-xl"></div>
        
        <CardHeader className="relative pb-6">
          <div className="relative">
            <div className="relative bg-gradient-to-r from-card/90 to-card/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/20">
              <CardTitle className="flex items-center gap-4 text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                  <TargetIcon className="w-7 h-7 text-blue-300" />
                </div>
                <div>
                  <div className="tracking-wide">Shot {shot.shotNumber}</div>
                </div>
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">
                Player Identity
              </Badge>
              <span className="text-foreground font-medium">{shot.playerIdentity}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10">
                Shot Type
              </Badge>
              <span className="text-foreground font-medium">{shot.shotType}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-400 border-purple-400/30 bg-purple-400/10">
                Trajectory Classification
              </Badge>
              <span className="text-foreground font-medium">{shot.trajectoryClassification}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-400 border-orange-400/30 bg-orange-400/10">
                Technique Zone
              </Badge>
              <span className="text-foreground font-medium">{shot.techniqueZone}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 bg-cyan-400/10">
                Estimated Shuttle Speed
              </Badge>
              <span className="text-foreground font-medium">{shot.estimatedShuttleSpeed}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-pink-400 border-pink-400/30 bg-pink-400/10">
                Contact Point on Racket
              </Badge>
              <span className="text-foreground font-medium">{shot.contactPointOnRacket}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10">
                Player Posture at Contact
              </Badge>
              <span className="text-foreground font-medium">{shot.playerPostureAtContact}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 bg-indigo-400/10">
                Balance or Recovery Status
              </Badge>
              <span className="text-foreground font-medium">{shot.balanceOrRecoveryStatus}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                Shot Quality
              </Badge>
              <span className="text-foreground font-medium">{shot.shotQuality}</span>
            </div>
          </div>
          {/* Improvement Suggestions */}
          {shot.improvementSuggestions && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💡</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-400 mb-2 text-sm">Improvement Suggestions</h4>
                  <p className="text-foreground text-xs leading-relaxed">
                    {shot.improvementSuggestions}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <section className="pt-4 pb-20 px-6 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
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
                <CardTitle className="flex items-center gap-4 text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
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

        {/* Shot Analysis Section */}
        <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-700 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl animate-fade-in mt-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-500/15 to-transparent rounded-full blur-2xl"></div>
          
          <CardHeader className="relative">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Activity className="w-10 h-10 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Shot Analysis
                  </h2>
                  <p className="text-lg text-muted-foreground font-normal mt-2">AI-Powered Performance Insights</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {totalShotsFromAPI ? `Kompete AI Analysis: ${totalShotsFromAPI} Shots Detected` : `Found ${shots.length} Shot${shots.length !== 1 ? 's' : ''} in Analysis`}
                </h3>
                <p className="text-muted-foreground">
                  {totalShotsFromAPI && shots.length !== totalShotsFromAPI 
                    ? `Parsed ${shots.length} of ${totalShotsFromAPI} shots from API response`
                    : 'Each shot analyzed with detailed performance metrics'
                  }
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            {/* Shot Cards or Raw Analysis */}
            {!showRawAnalysis ? (
              <div className="space-y-8">
                {shots.length > 0 ? (
                  <>
                    {shots.map((shot, index) => (
                      <ShotCard key={index} shot={shot} index={index} />
                    ))}
                  </>
                ) : (
                  <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-700 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                    <CardContent className="relative p-8 text-center">
                      <div className="text-muted-foreground text-lg mb-4">
                        No individual shots detected in the analysis. 
                      </div>
                      <div className="text-sm text-muted-foreground mb-6">
                        The analysis may not contain the expected "Shot 1:", "Shot 2:" format.
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRawAnalysis(true)}
                        className="mt-4"
                      >
                        View Raw Analysis
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Player Summary Section */}
        {Object.keys(playerStats).length > 0 && (
          <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-700 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl animate-fade-in mt-12">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-green-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/15 to-transparent rounded-full blur-2xl"></div>
            
            <CardHeader className="relative">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/30 to-purple-500/30 flex items-center justify-center shadow-lg shadow-green-500/25">
                    <Users className="w-10 h-10 text-green-300" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                      Player Performance Summary
                    </h2>
                    <p className="text-lg text-muted-foreground font-normal mt-2">Comprehensive analysis of each player's performance</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowPlayerSummary(!showPlayerSummary)}
                    className="group relative overflow-hidden bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 hover:from-green-500/90 hover:via-purple-500/90 hover:to-blue-500/90 transition-all duration-500 px-8 py-4 text-lg font-semibold hover:shadow-xl hover:shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/40"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Users className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative z-10">
                      {showPlayerSummary ? 'Hide Player Performance Summary' : 'Show Player Performance Summary'}
                    </span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative">
              {showPlayerSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(playerStats).map(([playerName, stats], index) => (
                    <PlayerSummaryCard 
                      key={playerName} 
                      playerName={playerName} 
                      stats={stats} 
                      index={index} 
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
            variant="outline" 
            size="lg" 
            className="group relative overflow-hidden bg-gradient-to-r from-secondary/50 to-secondary/30 border-2 border-border/50 hover:border-primary/50 hover:bg-gradient-to-r hover:from-secondary/70 hover:to-secondary/50 transition-all duration-500 px-8 py-4 text-lg font-semibold"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Download className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="relative z-10">Download Report</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsResults;
