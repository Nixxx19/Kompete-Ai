import React, { useEffect, useRef, useState } from "react";
import * as mpPose from "@mediapipe/pose";
import * as drawingUtils from "@mediapipe/drawing_utils";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft, Download, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import PerformanceInsights from "@/components/PerformanceInsights.tsx";



export default function PushupTracker() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseInstance = useRef<any>(null);
  const rafIdRef = useRef<number | null>(null);

  // Load player data from sessionStorage
  const getPlayerData = () => {
    const savedDetails = sessionStorage.getItem('playerDetails');
    if (savedDetails) {
      try {
        const details = JSON.parse(savedDetails);
        return {
          name: details.name || "Player",
          age: parseInt(details.age) || 18,
          gender: details.gender || "Male",
          weight: parseInt(details.weight) || 65,
          height: parseInt(details.height) || 170
        };
      } catch (error) {
        console.error('Error parsing player details:', error);
      }
    }
    // Fallback to default data
    return {
      name: "Player",
      age: 18,
      gender: "Male", 
      weight: 65,
      height: 170
    };
  };

  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const repCountRef = useRef(0);
  const poseScoresRef = useRef<number[]>([]);
  const pauseStartRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode"); // 'upload' or null for live camera

  const exerciseName = searchParams.get("exercise") || "Push-ups";
  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("Waiting...");
  const [pauseTime, setPauseTime] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [showFRT, setShowFRT] = useState(false);

  const downAngleThreshold = 90;
  const upAngleThreshold = 160;

  const calculateAngle = (a: any, b: any, c: any) => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    const angle = Math.abs((radians * 180.0) / Math.PI);
    return angle > 180 ? 360 - angle : angle;
  };

  function evaluateStamina(
    age: number,
    weight: number,
    reps: number,
    duration: number,
    avgScore: number,
    pauseTimeSec: number
  ) {
    let score = 0;
    duration = duration > 0 ? duration : 1;
    const repRate = (reps / duration) * 60;

    if (repRate > 30) score += 2;
    else if (repRate >= 20) score += 1;

    if (avgScore > 0.8) score += 2;
    else if (avgScore >= 0.6) score += 1;

    if (pauseTimeSec < 5) score += 2;
    else if (pauseTimeSec < 10) score += 1;

    if (age < 25) score += 2;
    else if (age <= 35) score += 1;

    if (score >= 8) return "Elite 💎";
    else if (score >= 7) return "Excellent 💪";
    else if (score >= 5) return "Good 🙂";
    else if (score >= 3) return "Average 😐";
    else return "Needs Improvement 😓";
  }

  function calculateCaloriesDynamic(
    reps: number,
    durationSec: number,
    weightKg: number,
    age: number,
    gender: string,
    exerciseType = "generic"
  ) {
    const durationMin = durationSec / 60;
    if (durationMin === 0) return 0.0;

    let bmr;
    if (gender.toLowerCase() === "male" || gender.toLowerCase() === "m") {
      bmr = 10 * weightKg + 6.25 * 170 - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * 160 - 5 * age - 161;
    }

    const caloriesPerMin = bmr / 1440;
    const multiplierMap: Record<string, number> = {
      jumping_jacks: 8,
      high_knees: 8.5,
      squats: 6.5,
      pushups: 7.0,
      generic: 6.0,
    };
    const multiplier = multiplierMap[exerciseType.toLowerCase()] || 6.0;
    const totalCalories = caloriesPerMin * durationMin * (multiplier / 1.5);

    return parseFloat(totalCalories.toFixed(2));
  }

  // Safe constructor resolution: prefer module export, fallback to window global
  const getPoseCtor = () => {
    const w = window as any;
    return (mpPose as any)?.Pose || w.Pose;
  };

  useEffect(() => {
    let stage: "down" | "up" | null = null;
    let timerStarted = false;

    const onResults = (results: any) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // keep canvas in sync with video intrinsic size
      if (video.videoWidth && video.videoHeight) {
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (results.image) {
        ctx.drawImage(results.image as HTMLVideoElement, 0, 0, canvas.width, canvas.height);
      }

      if (results.poseLandmarks) {
        const lm = results.poseLandmarks;

        drawingUtils.drawConnectors(
          ctx,
          lm,
          (mpPose as any).POSE_CONNECTIONS,
          { color: "#00FF00", lineWidth: 2 }
        );
        drawingUtils.drawLandmarks(ctx, lm, { color: "#FF0000", lineWidth: 1 });

        // KEEPING YOUR ORIGINAL INDICES AS REQUESTED:
        const shoulder = lm[11];
        const elbow = lm[1];
        const wrist = lm[2];

        let isValidPose = false;

        if (shoulder && elbow && wrist) {
          if (!timerStarted) {
            timerStarted = true;
            startTimeRef.current = Date.now();
          }

          const angle = calculateAngle(shoulder, elbow, wrist);

          if (angle < downAngleThreshold && stage !== "down") {
            stage = "down";
          }
          if (angle > upAngleThreshold && stage === "down") {
            stage = "up";
            repCountRef.current++;
            setReps(repCountRef.current);
          }

          isValidPose = true;
        }

        const score =
          lm.reduce((sum: number, l: any) => sum + (l.visibility ?? 0), 0) / lm.length;
        poseScoresRef.current.push(score);

        if (!isValidPose) {
          if (!pauseStartRef.current) {
            pauseStartRef.current = Date.now();
          }
        } else {
          if (pauseStartRef.current) {
            const pauseDuration = (Date.now() - pauseStartRef.current) / 1000;
            setPauseTime((prev) => prev + pauseDuration);
            pauseStartRef.current = null;
          }
        }

        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setStatus(`Reps: ${repCountRef.current} | Time: ${Math.floor(elapsed)}s`);
        } else {
          setStatus("Waiting...");
        }
      }
    };

    const init = async () => {
      await startWebcam();

      const PoseCtor = getPoseCtor();
      if (!PoseCtor) {
        console.error("MediaPipe Pose constructor not found. Ensure scripts and assets are loading.");
        return;
      }

      // init Pose after webcam is ready, and register onResults before processing loop
      const pose = new PoseCtor({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onResults);
      poseInstance.current = pose;

      // kick off processing loop once pose is ready
      processFrameLoop();
    };

    init();

    return () => {
      // cleanup: stop RAF and camera tracks
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      const video = videoRef.current;
      if (video && video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFrameLoop = () => {
    const video = videoRef.current;
    const pose = poseInstance.current as any;
    if (!video || !pose) return;

    const step = async () => {
      if (!video || !pose) return;
      if (video.paused || video.ended) return;

      try {
        await pose.send({ image: video });
      } catch (e) {
        // keep loop alive on frame errors
      }

      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
  };

  const processUploadedVideo = (videoUrl: string) => {
    // Reset tracking data
    poseScoresRef.current = [];
    setPauseTime(0);
    repCountRef.current = 0;

    const video = videoRef.current;
    if (!video) return;

    video.src = videoUrl;

    video.onloadedmetadata = () => {
      // match canvas size to video
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    video.onloadeddata = () => {
      video.play();
      processFrameLoop();
    };

    video.onended = () => {
      const totalTime = startTimeRef.current
        ? (Date.now() - startTimeRef.current) / 1000
        : 0;
      const scores = poseScoresRef.current;
      let avgScore = scores.length
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      const user = getPlayerData();
      const staminaLevel = evaluateStamina(
        user.age,
        user.weight,
        repCountRef.current,
        totalTime,
        avgScore,
        pauseTime
      );
      const caloriesBurned = calculateCaloriesDynamic(
        repCountRef.current,
        totalTime,
        user.weight,
        user.age,
        user.gender,
        "jumping_jacks"
      );

      const summaryData = {
        ...user,
        duration_sec: totalTime.toFixed(1),
        reps: repCountRef.current,
        avg_pose_score: (avgScore * 100).toFixed(2),
        pause_time: pauseTime.toFixed(1),
        stamina: staminaLevel,
        calories: caloriesBurned.toFixed(2),
      };

      setSummary(summaryData);
    };
  };

  const startWebcam = async () => {
    const video = videoRef.current;
    if (!video) return;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    await video.play();

    // set canvas to camera size
    const canvas = canvasRef.current;
    if (canvas) {
      const setSize = () => {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      };
      if (video.readyState >= 1) {
        setSize();
      } else {
        video.onloadedmetadata = setSize;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden z-[-1]">

      
      <div className="relative z-10">
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/80">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/exercise">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Exercise
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {exerciseName} Analysis
                  </h1>
                  <p className="text-sm text-muted-foreground">Live camera analysis</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-4 flex justify-center">
          <p className="px-6 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-kompte-purple to-velocity-orange text-white shadow-lg border border-white/10 backdrop-blur-md">
            {status}
          </p>
          <button
            className={
              "px-6 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-kompte-purple to-velocity-orange text-white shadow-lg border border-white/10 backdrop-blur-md"
            }
            onClick={() => {
              const video = videoRef.current;
              if (video && video.srcObject) {
                (video.srcObject as MediaStream)
                  .getTracks()
                  .forEach((track) => track.stop());
                video.srcObject = null;
                video.removeAttribute("src");
                video.load();
              }

              const totalTime = startTimeRef.current
                ? (Date.now() - startTimeRef.current) / 1000
                : 0;

              const scores = poseScoresRef.current;
              const avgScore = scores.length
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : 0;

              const user = getPlayerData();
              const staminaLevel = evaluateStamina(
                user.age,
                user.weight,
                repCountRef.current,
                totalTime,
                avgScore,
                pauseTime
              );
              const caloriesBurned = calculateCaloriesDynamic(
                repCountRef.current,
                totalTime,
                user.weight,
                user.age,
                user.gender,
                "pushups"
              );

              const summaryData = {
                ...user,
                duration_sec: totalTime.toFixed(1),
                reps: repCountRef.current,
                avg_pose_score: (avgScore * 100).toFixed(2),
                pause_time: pauseTime.toFixed(1),
                stamina: staminaLevel,
                calories: caloriesBurned.toFixed(2),
              };

              setSummary(summaryData);
            }}
            style={{ marginLeft: "10px" }}
          >
            🛑 Stop Webcam
          </button>
        </div>

        <div className="flex items-center justify-center mt-4 ">
          <div
            style={{
              position: "relative",
              width: "640px",
              height: "480px",
            }}
          >
            <video
              ref={videoRef}
              width={640}
              height={480}
              playsInline
              muted
              autoPlay
              style={{
                borderRadius: "10px",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                maxHeight: "60vh",
              }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                maxHeight: "60vh",
              }}
            />
          </div>
        </div>



        
        {summary && (
          <>
            <section className="animate-fade-in mb-8">
              <Card className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-card/90 via-card/80 to-card/70 border-0 shadow-2xl glow-primary">
                <div className="absolute inset-0 bg-gradient-to-br from-kompte-purple/5 via-transparent to-velocity-orange/5"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-kompte-purple via-velocity-orange to-accuracy-green"></div>

                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-2">
                        Session Results
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {mode === "upload"
                          ? "Video Analysis Complete"
                          : "Live Analysis Complete"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-kompte-purple/10 to-kompte-purple/5 border border-kompte-purple/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <div className="text-xs uppercase tracking-wider text-kompte-purple font-semibold mb-2">
                        Name
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {summary.name}
                      </div>
                    </div>

                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-velocity-orange/10 to-velocity-orange/5 border border-velocity-orange/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <div className="text-xs uppercase tracking-wider text-velocity-orange font-semibold mb-2">
                        Age
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {summary.age}
                      </div>
                    </div>

                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-data-blue/10 to-data-blue/5 border border-data-blue/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <div className="text-xs uppercase tracking-wider text-data-blue font-semibold mb-2">
                        Reps
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {summary.reps}
                      </div>
                    </div>

                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-accuracy-green/10 to-accuracy-green/5 border border-accuracy-green/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <div className="text-xs uppercase tracking-wider text-accuracy-green font-semibold mb-2">
                        Pause Time
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {summary.pause_time}
                      </div>
                    </div>

                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-kompte-purple/10 to-kompte-purple/5 border border-kompte-purple/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <div className="text-xs uppercase tracking-wider text-kompte-purple font-semibold mb-2">
                        Calories
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {summary.calories} kcal
                      </div>
                    </div>

                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-velocity-orange/10 to-velocity-orange/5 border border-velocity-orange/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <div className="text-xs uppercase tracking-wider text-velocity-orange font-semibold mb-2">
                        Form
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {summary.avg_pose_score}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
            
            {/* Performance Insights Charts */}
            <section className="mb-8">
              <PerformanceInsights 
                stamina={summary.stamina}
                cal={summary.calories}
                form={summary.avg_pose_score}
                recov={summary.pause_time}
              />
            </section>

          </>
        )}

        <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 z-[-1]" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent z-[-1] to-transparent" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/10 via-transparent z-[-1] to-transparent" />
      </div>
    </div>
  );
}
