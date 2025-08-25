import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Clock, Calendar, Activity, Target, Trophy } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, BarChart, Bar } from "recharts";

interface Props {
  stamina: string;
  cal: string;
  form: string;
  recov:string

}

// Enhanced stamina data with more detailed tracking
const staminaOverTimeData = [
  { time: "0:00", stamina: 100, rally: 1, heartRate: 65, gameTime: "Set 1 - 0:00" },
  { time: "2:15", stamina: 95, rally: 2, heartRate: 72, gameTime: "Set 1 - 2:15" },
  { time: "4:30", stamina: 88, rally: 3, heartRate: 78, gameTime: "Set 1 - 4:30" },
  { time: "7:00", stamina: 92, rally: 4, heartRate: 74, gameTime: "Set 1 - 7:00" },
  { time: "9:45", stamina: 85, rally: 5, heartRate: 82, gameTime: "Set 1 - 9:45" },
  { time: "12:30", stamina: 78, rally: 6, heartRate: 88, gameTime: "Set 2 - 0:30" },
  { time: "15:15", stamina: 82, rally: 7, heartRate: 85, gameTime: "Set 2 - 3:15" },
  { time: "18:00", stamina: 75, rally: 8, heartRate: 91, gameTime: "Set 2 - 6:00" },
  { time: "20:45", stamina: 70, rally: 9, heartRate: 95, gameTime: "Set 2 - 8:45" },
  { time: "23:30", stamina: 68, rally: 10, heartRate: 98, gameTime: "Set 2 - 11:30" },
  { time: "26:15", stamina: 72, rally: 11, heartRate: 93, gameTime: "Set 3 - 2:15" },
  { time: "29:00", stamina: 65, rally: 12, heartRate: 102, gameTime: "Set 3 - 5:00" },
  { time: "31:45", stamina: 60, rally: 13, heartRate: 105, gameTime: "Set 3 - 7:45" },
  { time: "34:20", stamina: 58, rally: 14, heartRate: 108, gameTime: "Set 3 - 10:20" },
  { time: "37:10", stamina: 55, rally: 15, heartRate: 110, gameTime: "Set 3 - 13:10" },
];

const dailyStaminaData = [
  { day: "Monday", dayShort: "Mon", avgStamina: 78, sessions: 2, peakStamina: 92, minStamina: 64 },
  { day: "Tuesday", dayShort: "Tue", avgStamina: 82, sessions: 1, peakStamina: 88, minStamina: 76 },
  { day: "Wednesday", dayShort: "Wed", avgStamina: 85, sessions: 3, peakStamina: 96, minStamina: 72 },
  { day: "Thursday", dayShort: "Thu", avgStamina: 79, sessions: 2, peakStamina: 89, minStamina: 68 },
  { day: "Friday", dayShort: "Fri", avgStamina: 88, sessions: 1, peakStamina: 94, minStamina: 81 },
  { day: "Saturday", dayShort: "Sat", avgStamina: 92, sessions: 2, peakStamina: 98, minStamina: 85 },
  { day: "Sunday", dayShort: "Sun", avgStamina: 75, sessions: 1, peakStamina: 82, minStamina: 68 },
];

const chartConfig = {
  stamina: {
    label: "Stamina %",
    color: "hsl(var(--primary))",
  },
  avgStamina: {
    label: "Average Stamina",
    color: "hsl(var(--accent))",
  },
};

const PerformanceInsights = ({stamina, cal, form, recov}: Props) => {
  const currentStamina = 82;
  const weeklyImprovement = 8.5;

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto max-w-7xl relative">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Stamina Analytics</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Performance Endurance <span className="gradient-text">Insights</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor your stamina patterns, endurance trends, and optimize your training performance with AI-powered analytics.
          </p>
        </div>

        {/* Premium Stamina Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {/* Average Stamina Card */}
          <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium font-semibold text-muted-foreground">Average<br/>Stamina</CardTitle>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Zap className="w-10 h-11 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl mt-2 font-bold text-foreground mb-2 tra4king-tight">{stamina}</div>
              <div className="flex items-center text-sm">
                {/*<TrendingUp className="w-6 h-8 text-green-500 mr-2" />*/}
                {/*<span className="text-green-500 font-medium">{weeklyImprovement}% this week</span>*/}
              </div>
            </CardContent>
          </Card>

          {/* Peak Performance */}
          <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium font-semibold text-muted-foreground">Calories<br/>Burnt</CardTitle>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Trophy className="w-10 h-11 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl mt-2 font-bold text-foreground mb-2 tracking-tight">{cal} Kcal</div>
              {/*<div className="flex items-center text-sm">*/}
              {/*  <Target className="w-6 h-8 text-accent mr-2" />*/}
              {/*  <span className="text-muted-foreground font-medium">Saturday peak</span>*/}
              {/*</div>*/}
            </CardContent>
          </Card>

          {/* Best Duration */}
          <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-3xl font-medium font-semibold text-muted-foreground">Duration</CardTitle>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Clock className="w-10 h-11 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-5xl font-bold text-foreground mb-2 tracking-tight">{recov}s</div>
              {/*<div className="flex items-center text-sm">*/}
              {/*  <Activity className="w-6 h-8 text-primary mr-2" />*/}
              {/*  <span className="text-muted-foreground font-medium">Session length</span>*/}
              {/*</div>*/}
            </CardContent>
          </Card>

          {/* Recovery Rate */}
          <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium font-semibold text-muted-foreground">Form<br/>Score</CardTitle>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <TrendingUp className="w-10 h-11 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-foreground mb-3 tracking-tight mt-2">{form}%</div>
              <div className="flex items-center text-sm">
                {/*<Badge variant="secondary" className="text-green-500 bg-green-500/15 border-green-500/30">*/}
                {/*  Top 5%*/}
                {/*</Badge>*/}
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
          {/* Enhanced Rally-by-Rally Stamina Analysis */}
          {/*<Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-700 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl">*/}
          {/*  <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent"></div>*/}
          {/*  <CardHeader className="relative">*/}
          {/*    <div className="flex items-center justify-between">*/}
          {/*      <div>*/}
          {/*        <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">*/}
          {/*          <div className="w-16 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">*/}
          {/*            <Zap className="w-12 h-10 text-primary" />*/}
          {/*          </div>*/}
          {/*          Rally Stamina Timeline*/}
          {/*        </CardTitle>*/}
          {/*        <CardDescription className="mt-3 text-md font-semibold">*/}
          {/*          Real-time stamina tracking with precise rally timing and game context*/}
          {/*        </CardDescription>*/}
          {/*      </div>*/}
          {/*      <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-300">*/}
          {/*        <Activity className="w-4 h-4 mr-0" />*/}
          {/*        Export Analysis*/}
          {/*      </Button>*/}
          {/*    </div>*/}
          {/*  </CardHeader>*/}
          {/*  <CardContent className="relative">*/}
          {/*    <ChartContainer config={chartConfig} className="h-[400px] w-full">*/}
          {/*      <LineChart data={staminaOverTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>*/}
          {/*        <defs>*/}
          {/*          <linearGradient id="staminaGradient" x1="0" y1="0" x2="0" y2="1">*/}
          {/*            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>*/}
          {/*            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>*/}
          {/*          </linearGradient>*/}
          {/*        </defs>*/}
          {/*        <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="hsl(var(--border))" />*/}
          {/*        <XAxis */}
          {/*          dataKey="time" */}
          {/*          axisLine={false}*/}
          {/*          tickLine={false}*/}
          {/*          className="text-xs"*/}
          {/*          tick={{ fill: 'hsl(var(--muted-foreground))' }}*/}
          {/*        />*/}
          {/*        <YAxis */}
          {/*          domain={[45, 105]}*/}
          {/*          axisLine={false}*/}
          {/*          tickLine={false}*/}
          {/*          className="text-xs"*/}
          {/*          tick={{ fill: 'hsl(var(--muted-foreground))' }}*/}
          {/*          tickFormatter={(value) => `${value}%`}*/}
          {/*        />*/}
          {/*        <ChartTooltip */}
          {/*          content={({ active, payload, label }) => {*/}
          {/*            if (active && payload && payload.length) {*/}
          {/*              const data = payload[0].payload;*/}
          {/*              return (*/}
          {/*                <div className="glass-card p-4 rounded-xl shadow-2xl border border-primary/20">*/}
          {/*                  <div className="space-y-2">*/}
          {/*                    <div className="flex items-center gap-2">*/}
          {/*                      <div className="w-3 h-3 rounded-full bg-primary"></div>*/}
          {/*                      <span className="font-bold text-foreground">Rally {data.rally}</span>*/}
          {/*                    </div>*/}
          {/*                    <div className="grid grid-cols-2 gap-3 text-sm">*/}
          {/*                      <div>*/}
          {/*                        <p className="text-muted-foreground">Match Time</p>*/}
          {/*                        <p className="font-semibold text-primary">{data.gameTime}</p>*/}
          {/*                      </div>*/}
          {/*                      <div>*/}
          {/*                        <p className="text-muted-foreground">Stamina Level</p>*/}
          {/*                        <p className="font-bold text-primary text-lg">{data.stamina}%</p>*/}
          {/*                      </div>*/}
          {/*                    </div>*/}
          {/*                    <div className="pt-2 border-t border-border/30">*/}
          {/*                      <p className="text-xs text-muted-foreground">Heart Rate: <span className="text-foreground font-medium">{data.heartRate} bpm</span></p>*/}
          {/*                    </div>*/}
          {/*                  </div>*/}
          {/*                </div>*/}
          {/*              );*/}
          {/*            }*/}
          {/*            return null;*/}
          {/*          }}*/}
          {/*        />*/}
          {/*        <Line */}
          {/*          type="monotone" */}
          {/*          dataKey="stamina" */}
          {/*          stroke="hsl(var(--primary))"*/}
          {/*          strokeWidth={4}*/}
          {/*          fill="url(#staminaGradient)"*/}
          {/*          dot={{ */}
          {/*            fill: "hsl(var(--primary))", */}
          {/*            strokeWidth: 3, */}
          {/*            r: 5,*/}
          {/*            stroke: "hsl(var(--background))"*/}
          {/*          }}*/}
          {/*          activeDot={{ */}
          {/*            r: 8, */}
          {/*            stroke: "hsl(var(--primary))", */}
          {/*            strokeWidth: 3, */}
          {/*            fill: "hsl(var(--background))",*/}
          {/*            className: "drop-shadow-lg" */}
          {/*          }}*/}
          {/*        />*/}
          {/*        <ReferenceLine */}
          {/*          y={75} */}
          {/*          stroke="hsl(var(--destructive))" */}
          {/*          strokeDasharray="8 4" */}
          {/*          opacity={0.8} */}
          {/*          strokeWidth={2}*/}
          {/*          label={{ value: "Critical Zone", offset: 10, fill: "hsl(var(--destructive))" }}*/}
          {/*        />*/}
          {/*        <ReferenceLine */}
          {/*          y={90} */}
          {/*          stroke="hsl(var(--accent))" */}
          {/*          strokeDasharray="8 4" */}
          {/*          opacity={0.6} */}
          {/*          strokeWidth={2}*/}
          {/*          label={{ value: "Optimal Zone", offset: 10, fill: "hsl(var(--accent))" }}*/}
          {/*        />*/}
          {/*      </LineChart>*/}
          {/*    </ChartContainer>*/}
          {/*    <div className="mt-6 p-5 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 rounded-xl border border-border/30">*/}
          {/*      <div className="grid grid-cols-3 gap-4 text-center">*/}
          {/*        <div className="space-y-1">*/}
          {/*          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Current Stamina</div>*/}
          {/*          <div className="text-2xl font-bold text-primary">55%</div>*/}
          {/*        </div>*/}
          {/*        <div className="space-y-1">*/}
          {/*          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Match Duration</div>*/}
          {/*          <div className="text-2xl font-bold text-primary">37:10</div>*/}
          {/*        </div>*/}
          {/*        <div className="space-y-1">*/}
          {/*          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Peak Stamina</div>*/}
          {/*          <div className="text-2xl font-bold text-accent">100%</div>*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*  </CardContent>*/}
          {/*</Card>*/}

          {/* Enhanced Daily Stamina Trends with Bar Chart */}
          {/*<Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-700 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-xl">*/}
          {/*  <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-transparent"></div>*/}
          {/*  <CardHeader className="relative">*/}
          {/*    <div className="flex items-center justify-between">*/}
          {/*      <div>*/}
          {/*        <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">*/}
          {/*          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/30 flex items-center justify-center">*/}
          {/*            <Calendar className="w-6 h-6 text-accent" />*/}
          {/*          </div>*/}
          {/*          Weekly Stamina Analysis*/}
          {/*        </CardTitle>*/}
          {/*        <CardDescription className="mt-3 text-base">*/}
          {/*          Day-wise performance breakdown with detailed insights*/}
          {/*        </CardDescription>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*  </CardHeader>*/}
          {/*  <CardContent className="relative space-y-8">*/}
          {/*    /!* Bar Chart *!/*/}
          {/*    <ChartContainer config={chartConfig} className="h-[300px] w-full">*/}
          {/*      <BarChart data={dailyStaminaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>*/}
          {/*        <defs>*/}
          {/*          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">*/}
          {/*            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>*/}
          {/*            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>*/}
          {/*          </linearGradient>*/}
          {/*        </defs>*/}
          {/*        <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="hsl(var(--border))" />*/}
          {/*        <XAxis */}
          {/*          dataKey="dayShort" */}
          {/*          axisLine={false}*/}
          {/*          tickLine={false}*/}
          {/*          className="text-sm"*/}
          {/*          tick={{ fill: 'hsl(var(--muted-foreground))' }}*/}
          {/*        />*/}
          {/*        <YAxis */}
          {/*          domain={[65, 100]}*/}
          {/*          axisLine={false}*/}
          {/*          tickLine={false}*/}
          {/*          className="text-xs"*/}
          {/*          tick={{ fill: 'hsl(var(--muted-foreground))' }}*/}
          {/*          tickFormatter={(value) => `${value}%`}*/}
          {/*        />*/}
          {/*        <ChartTooltip */}
          {/*          content={({ active, payload, label }) => {*/}
          {/*            if (active && payload && payload.length) {*/}
          {/*              const data = payload[0].payload;*/}
          {/*              return (*/}
          {/*                <div className="glass-card p-4 rounded-xl shadow-2xl border border-accent/20">*/}
          {/*                  <div className="space-y-3">*/}
          {/*                    <div className="flex items-center gap-2">*/}
          {/*                      <div className="w-3 h-3 rounded-full bg-accent"></div>*/}
          {/*                      <span className="font-bold text-foreground">{data.day}</span>*/}
          {/*                    </div>*/}
          {/*                    <div className="grid grid-cols-2 gap-4 text-sm">*/}
          {/*                      <div>*/}
          {/*                        <p className="text-muted-foreground">Avg Stamina</p>*/}
          {/*                        <p className="font-bold text-accent text-lg">{data.avgStamina}%</p>*/}
          {/*                      </div>*/}
          {/*                      <div>*/}
          {/*                        <p className="text-muted-foreground">Sessions</p>*/}
          {/*                        <p className="font-semibold text-foreground">{data.sessions}</p>*/}
          {/*                      </div>*/}
          {/*                    </div>*/}
          {/*                    <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-border/30">*/}
          {/*                      <div>*/}
          {/*                        <p className="text-muted-foreground">Peak</p>*/}
          {/*                        <p className="font-semibold text-green-500">{data.peakStamina}%</p>*/}
          {/*                      </div>*/}
          {/*                      <div>*/}
          {/*                        <p className="text-muted-foreground">Lowest</p>*/}
          {/*                        <p className="font-semibold text-primary">{data.minStamina}%</p>*/}
          {/*                      </div>*/}
          {/*                    </div>*/}
          {/*                  </div>*/}
          {/*                </div>*/}
          {/*              );*/}
          {/*            }*/}
          {/*            return null;*/}
          {/*          }}*/}
          {/*        />*/}
          {/*        <Bar */}
          {/*          dataKey="avgStamina" */}
          {/*          fill="url(#barGradient)"*/}
          {/*          radius={[6, 6, 0, 0]}*/}
          {/*          className="hover:opacity-80 transition-opacity duration-200"*/}
          {/*        />*/}
          {/*      </BarChart>*/}
          {/*    </ChartContainer>*/}
          {/*    */}
          {/*    /!* Weekly Summary *!/*/}
          {/*    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">*/}
          {/*      <div className="text-center p-1 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 min-h-[180px] flex flex-col justify-center">*/}
          {/*        <div className="text-xl md:text-3xl font-bold text-accent mb-1">82.3%</div>*/}
          {/*        <div className="text-xs md:text-md text-muted-foreground mb-1">Weekly<br/>Average</div>*/}
          {/*        <div className="flex items-center justify-center">*/}
          {/*          <TrendingUp className=" md:w-5 md:h-8 text-green-500 mr-1"/>*/}
          {/*          <span className="text-green-500 font-medium text-xs md:text-sm">12% improve</span>*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*      */}
          {/*      <div className="text-center p-1 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 min-h-[180px] flex flex-col justify-center">*/}
          {/*        <div className="text-xl md:text-3xl font-bold text-green-500 mb-1">Saturday</div>*/}
          {/*        <div className="text-xs md:text-md text-muted-foreground mb-1">Peak<br/>Day</div>*/}
          {/*        <div className="text-sm md:text-base font-semibold text-green-500">92% stamina</div>*/}
          {/*      </div>*/}
          {/*      */}
          {/*      <div className="text-center p-1 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 min-h-[180px] flex flex-col justify-center">*/}
          {/*        <div className="text-xl md:text-3xl font-bold text-primary mb-1">Sunday</div>*/}
          {/*        <div className="text-xs md:text-md text-muted-foreground mb-1">Recovery<br/>Day</div>*/}
          {/*        <div className="text-sm md:text-base font-semibold text-primary">75% stamina</div>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*  </CardContent>*/}
          {/*</Card>*/}
        </div>

      </div>


    </section>
  );
};

export default PerformanceInsights;