import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Exercise from "./pages/Exercise";
import LiveCamera from "./pages/LiveCamera";
import NotFound from "./pages/NotFound";
import AnalyticsGemini from "./pages/AnalyticsGemini";
import JumpingJacks from "@/components/JumpingJacks.tsx";
import JumpingJacksLive from "@/components/JumpingJacksLive.tsx";
import Pushup from "@/components/Pushup.tsx";
import { useSearchParams } from 'react-router-dom';
import exerciseComponentMap from './components/ExerciseRouter';
import PushupLive from "@/components/PushupLive.tsx";
import exerciseLiveComponentMap from "@/components/LiveExerciseRouter.tsx";
import HighKneesApp from "@/components/HighKnees.tsx";
import SquatsTracker from "@/components/SquatsTracker.tsx";
import HighKnees from "@/components/HighKnees.tsx";
import PlayerDetection from "@/components/PlayerDetection.tsx";
import Drills from "./pages/Drills";

const GenericAnalysis = () => {
  const [searchParams] = useSearchParams();
  const exercise = searchParams.get("exercise");

  const Component = exerciseComponentMap[exercise];

  if (!Component) return <p>Exercise not supported: {exercise}</p>;

  return <Component />;
};
const GenericAnalysisLive = () => {
  const [searchParams] = useSearchParams();
  const exercise = searchParams.get("exercise");

  const Component = exerciseLiveComponentMap[exercise];

  if (!Component) return <p>Exercise not supported: {exercise}</p>;

  return <Component />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/exercise" element={<Exercise />} />
          <Route path="/live-camera" element={<LiveCamera />} />
          <Route path="/analytics" element={<AnalyticsGemini />} />
          {/* <Route path="/analysis" element={<JumpingJacks user={...} onFinish={...} />} /> */}
          <Route path="/test" element={<HighKnees user={null} onFinish={() => {}} />} />
          <Route path="/analysis" element={<GenericAnalysis />} />
          <Route path="/live-analysis" element={<GenericAnalysisLive />} />

          <Route path={"/exercise/JumpingJacks/live"} element={<JumpingJacksLive />} />

          <Route path="/drills" element={<Drills />} />

          <Route path="/player-detection" element={<PlayerDetection />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
