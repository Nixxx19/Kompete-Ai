import React, { useEffect, useRef, useState, useCallback } from "react";
import { Pose } from "@mediapipe/pose";

import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import {
    evaluateStamina,
    calculateCaloriesDynamic,
    plotWorkoutSummary,
} from "./Utils";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {Activity, ArrowLeft, Download, Trophy, Zap, Dumbbell} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import PerformanceInsights from "@/components/PerformanceInsights.tsx";
import {ChartContainer, ChartTooltip} from "@/components/ui/chart.tsx";
import {CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis} from "recharts";

// Load player data from sessionStorage
const getPlayerDataFromStorage = () => {
    const savedDetails = sessionStorage.getItem('playerDetails');
    if (savedDetails) {
        try {
            const details = JSON.parse(savedDetails);
            return {
                name: details.name || "Player",
                age: parseInt(details.age) || 25,
                gender: details.gender || "male",
                weight: parseInt(details.weight) || 70,
                height: details.height ? `${details.height}cm` : "175cm"
            };
        } catch (error) {
            console.error('Error parsing player details:', error);
        }
    }
    // Fallback to default data if no sessionStorage data
    return {
        name: "Player",
        age: 25,
        weight: 70,
        gender: "male",
        height: "175cm"
    };
};

const placeholderUser = getPlayerDataFromStorage();


export default function PushUps({ user, onFinish }) {
    const activeUser = user ?? placeholderUser;

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraRef = useRef(null);
    const poseRef = useRef(null);
    const rafRef = useRef(null);

    // States
    const [useCamera, setUseCamera] = useState(true);
    const [file, setFile] = useState(null);
    const [reps, setReps] = useState(0);
    const [poseScore, setPoseScore] = useState(0);
    const [running, setRunning] = useState(false);
    const [summary, setSummary] = useState(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [frtRating, setFrtRating] = useState(50);
    const [frtConfirmed, setFrtConfirmed] = useState(false);
    const [showPersonalizedPlan, setShowPersonalizedPlan] = useState(false);

    // FRT Rating options
    const frtOptions = [
        { value: 0, label: "Very Easy" },
        { value: 25, label: "Easy" },
        { value: 50, label: "Moderate" },
        { value: 75, label: "Hard" },
        { value: 100, label: "Very Hard" }
    ];

    // Internal refs
    const startTimeRef = useRef(null);
    const pauseStartRef = useRef(null);
    const pauseTimeRef = useRef(0);
    const poseScoresRef = useRef([]);
    const repTimestampsRef = useRef([]);
    const stageRef = useRef(null); // "down" or "up"

    // Thresholds (angles in degrees)
    const downThreshold = 90;
    const upThreshold = 160;

    // Calculate angle between 3 points (same as your Python logic)
    const calculateAngle = (a, b, c) => {
        const radians =
            Math.atan2(c[1] - b[1], c[0] - b[0]) -
            Math.atan2(a[1] - b[1], a[0] - b[0]);
        let angle = Math.abs((radians * 180) / Math.PI);
        return angle > 180 ? 360 - angle : angle;
    };

    // Average visibility score of landmarks
    const avgVisibility = (landmarks) => {
        if (!landmarks || landmarks.length === 0) return 0;
        let sum = 0;
        landmarks.forEach((l) => (sum += l.visibility ?? 1));
        return sum / landmarks.length;
    };

    const onResults = useCallback(
        (results) => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!canvas || !video) return;

            const ctx = canvas.getContext("2d");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            if (results.poseLandmarks && results.poseLandmarks.length > 0) {
                if (results.poseLandmarks) {
                    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
                        color: "#00FFAA",
                        lineWidth: 2,
                    });
                    drawLandmarks(ctx, results.poseLandmarks, {
                        color: "#FF0066",
                        lineWidth: 1,
                    });
                }


                const lm = results.poseLandmarks;

                // Pose visibility score
                const score = avgVisibility(lm);
                poseScoresRef.current.push(score);
                setPoseScore(Number(score.toFixed(2)));

                // Pause time tracking
                if (pauseStartRef.current) {
                    pauseTimeRef.current += performance.now() / 1000 - pauseStartRef.current;
                    pauseStartRef.current = null;
                }

                // Extract relevant landmarks for left arm
                const leftShoulder = [lm[11].x, lm[11].y];
                const leftElbow = [lm[13].x, lm[13].y];
                const leftWrist = [lm[15].x, lm[15].y];

                // Calculate elbow angle
                const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

                const now = performance.now() / 1000;

                // Start timer on first detection of "down" position
                if (startTimeRef.current === null && elbowAngle < downThreshold + 10) {
                    startTimeRef.current = now;
                    setIsSessionActive(true);
                }

                if (startTimeRef.current !== null) {
                    // Update elapsed time
                    setElapsedTime(now - startTimeRef.current);

                    // Rep counting state machine
                    if (elbowAngle < downThreshold && stageRef.current !== "down") {
                        stageRef.current = "down";
                    } else if (elbowAngle > upThreshold && stageRef.current === "down") {
                        stageRef.current = "up";
                        setReps((r) => {
                            repTimestampsRef.current.push(now - startTimeRef.current);
                            return r + 1;
                        });
                    }
                } else {
                    // If pose detected but timer not started yet, do nothing
                }
            } else {
                // No pose detected
                if (startTimeRef.current !== null && !pauseStartRef.current) {
                    pauseStartRef.current = performance.now() / 1000;
                }
            }
        },
        []
    );

    // Start webcam
    // const startWebcam = useCallback(async () => {
    //     if (!videoRef.current || !window.Camera || !poseRef.current) {
    //         alert("Camera or MediaPipe not available.");
    //         return;
    //     }
    //     cameraRef.current = new window.Camera(videoRef.current, {
    //         onFrame: async () => await poseRef.current.send({ image: videoRef.current }),
    //         width: 640,
    //         height: 480,
    //     });
    //     cameraRef.current.start();
    //     setRunning(true);
    // }, []);
    const startWebcam = useCallback(async () => {
        if (!videoRef.current || !poseRef.current) {
            alert("Video element or Pose instance not found.");
            return;
        }

        try {
            // Ask for camera permission first
            await navigator.mediaDevices.getUserMedia({ video: true });

            // Create MediaPipe camera instance
            cameraRef.current = new Camera(videoRef.current, {
                onFrame: async () => {
                    await poseRef.current.send({ image: videoRef.current });
                },
                width: 640,
                height: 480,
            });

            await cameraRef.current.start();
            setRunning(true);
        } catch (error) {
            console.error("Error starting webcam:", error);
            alert("Could not start webcam. Please check permissions.");
        }
    }, []);

    // Process video file frames
    const processFileFrame = useCallback(async () => {
        if (!videoRef.current || !poseRef.current) return;
        if (videoRef.current.paused || videoRef.current.ended) return;
        await poseRef.current.send({ image: videoRef.current });
        rafRef.current = requestAnimationFrame(processFileFrame);
    }, []);

    // Start processing uploaded file
    const startFileProcessing = useCallback(
        (fileObj) => {
            if (!videoRef.current || !poseRef.current) return;
            const url = URL.createObjectURL(fileObj);
            videoRef.current.src = url;
            videoRef.current.play().then(() => {
                setRunning(true);
                rafRef.current = requestAnimationFrame(processFileFrame);
            });
        },
        [processFileFrame]
    );
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
    // Stop all activity
    const stopEverything = useCallback(async () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (cameraRef.current) {
            try {
                cameraRef.current.stop();
            } catch {}
            cameraRef.current = null;
        }
        if (videoRef.current && !useCamera) {
            try {
                videoRef.current.pause();
            } catch {}
        }
        setRunning(false);
    }, [useCamera]);

    // Start session handler
    const startSession = useCallback(async () => {
        if (!activeUser || !activeUser.name) {
            alert("Please provide user info.");
            return;
        }

        // Reset all refs and states
        startTimeRef.current = null;
        pauseStartRef.current = null;
        pauseTimeRef.current = 0;
        poseScoresRef.current = [];
        repTimestampsRef.current = [];
        stageRef.current = null;
        setReps(0);
        setPoseScore(0);
        setElapsedTime(0);
        setSummary(null);
        setIsSessionActive(false);

        if (useCamera) {
            await startWebcam();
        } else {
            if (!file) {
                alert("Please upload a video file.");
                return;
            }
            startFileProcessing(file);
        }
    }, [file, useCamera, activeUser, startWebcam, startFileProcessing]);

    // Stop session handler
    const stopSession = useCallback(async () => {
        if (pauseStartRef.current) {
            pauseTimeRef.current += performance.now() / 1000 - pauseStartRef.current;
            pauseStartRef.current = null;
        }

        const totalDuration = startTimeRef.current
            ? Math.round(performance.now() / 1000 - startTimeRef.current)
            : 0;

        let avgPose =
            poseScoresRef.current.length > 0
                ? (poseScoresRef.current.reduce((a, b) => a + b, 0) / poseScoresRef.current.length)
                : 0;
        avgPose *= 100;
        const calories = calculateCaloriesDynamic(
            reps,
            totalDuration,
            activeUser.weight,
            activeUser.age,
            activeUser.gender,
            "pushups"
        );
        const stamina = evaluateStamina(
            activeUser.age,
            activeUser.weight,
            reps,
            totalDuration,
            avgPose,
            Math.round(pauseTimeRef.current)
        );

        const totalTime = Math.max(1, totalDuration);
        const segmentLength = 5;
        const numSegments = Math.ceil(totalTime / segmentLength);
        const counts = new Array(numSegments).fill(0);
        repTimestampsRef.current.forEach((t) => {
            const idx = Math.floor(t / segmentLength);
            if (idx >= 0 && idx < counts.length) counts[idx] += 1;
        });

        // Get fresh player data from sessionStorage for accurate results
        const currentPlayerData = getPlayerDataFromStorage();
        
        let summaryObj = {
            activeUser: currentPlayerData,
            total_reps: reps,
            total_duration: totalDuration,
            avg_pose_score: Number(avgPose.toFixed(2)),
            pause_time: Math.round(pauseTimeRef.current),
            reps_over_time: counts,
            pose_scores: [...poseScoresRef.current],
            calories,
            stamina,
        };

        await stopEverything();
        setSummary(summaryObj);
        setIsSessionActive(false);

        if (onFinish) onFinish(summaryObj);
    }, [reps, activeUser, stopEverything, onFinish]);

    // Handle file input change
    const handleFileSelect = useCallback((e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setUseCamera(false);
            if (videoRef.current) {
                videoRef.current.src = URL.createObjectURL(f);
            }
        }
    }, []);

    // Reset session
    const reset = useCallback(async () => {
        await stopEverything();
        setFile(null);
        setUseCamera(true);
        setSummary(null);
        setReps(0);
        setPoseScore(0);
        setElapsedTime(0);
        pauseTimeRef.current = 0;
        poseScoresRef.current = [];
        repTimestampsRef.current = [];
        setIsSessionActive(false);
        setFrtRating(50);
        setFrtConfirmed(false);
        setShowPersonalizedPlan(false);
    }, [stopEverything]);

    // FRT Rating handlers
    const handleFrtRatingChange = (e) => {
        setFrtRating(parseInt(e.target.value));
    };

    const handleResetToModerate = () => {
        setFrtRating(50);
        setFrtConfirmed(false);
        setShowPersonalizedPlan(false);
    };

    const handleConfirmRating = () => {
        setFrtConfirmed(true);
        setShowPersonalizedPlan(true);
        // You can add additional logic here, like saving to database or showing a success message
        console.log('FRT Rating confirmed:', frtRating);
    };

    const handlePersonalizedPlan = () => {
        // Handle the personalized plan purchase/action
        console.log('Personalized plan requested for INR XX');
        // You can add payment integration, navigation to payment page, etc.
        alert('Redirecting to personalized fitness plan purchase for INR XX...');
    };

    // Setup MediaPipe Pose on mount
    useEffect(() => {
        if (!poseRef.current) {
            poseRef.current = new Pose({
                locateFile: (file) => {
                    return `${window.location.origin}/node_modules/@mediapipe/pose/${file}`;
                },
            });


        poseRef.current.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });
            poseRef.current.onResults(onResults);
        }

        return () => {
            stopEverything();
        };
    }, [onResults, stopEverything]);

    // Plot workout summary when available
    useEffect(() => {
        if (!summary) return;

        plotWorkoutSummary(
            {
                repsChart: "pushup-reps-chart",
                poseChart: "pushup-pose-chart",
                activityChart: "pushup-activity-chart",
                summaryBox: "pushup-summary-text",
            },
            summary.activeUser,
            summary.reps_over_time,
            summary.pose_scores,
            summary.total_duration,
            summary.pause_time,
            summary.total_reps,
            summary.calories,
            summary.stamina
        );
    }, [summary]);

    // Auto-scroll to personalized plan when FRT rating is confirmed
    useEffect(() => {
        if (showPersonalizedPlan) {
            // Find the personalized plan section and scroll to it
            const personalizedPlanSection = document.querySelector('[data-testid="personalized-plan-section"]');
            if (personalizedPlanSection) {
                personalizedPlanSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [showPersonalizedPlan]);

    return (
        <div className="min-h-screen bg-background overflow-y-auto z-[-1]" >
            <div className="relative z-10">
                <div>

                <header className="border-b border-border/50 backdrop-blur-xl bg-background/80">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link to="/exercise">
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Exercise
                                    </Button>
                                </Link>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-blue-500/30 border border-blue-500/20">
                                        <Dumbbell className="w-8 h-8 text-blue-300" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-foreground">PushUps Analysis</h1>
                                        <p className="text-sm text-muted-foreground">Live camera analysis</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className={"flex justify-center items-center mt-6 px-[10rem]"}>
                    <div>
                        <label>
                            <input
                                type="radio"
                                checked={useCamera}
                                onChange={() => setUseCamera(true)}
                            />{" "}
                            Live Camera
                        </label>
                        <br />
                        <label>
                            <input
                                type="radio"
                                checked={!useCamera}
                                onChange={() => setUseCamera(false)}
                            />{" "}
                            Upload Video
                        </label>
                    </div>

                    {!useCamera && (
                        <div>
                            <input type="file" accept="video/*" onChange={handleFileSelect} />
                        </div>
                    )}

                    <div style={{ marginLeft: "auto" }} className="flex gap-4">
                        <button onClick={startSession} disabled={running}>
                            Start
                        </button>
                        <button onClick={stopSession} disabled={!running}>
                            Stop
                        </button>
                        <button onClick={reset}>Reset</button>
                    </div>
                </div>
                <div className={"px-[10rem] mt-10  "}>
                <div className={"flex gap-10"}>
                    <div
                        style={{
                            width: 800,
                            height: 600,
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: 8,
                            border: "1px solid #ccc",
                            flexShrink: 0,
                        }}
                    >
                        <video
                            ref={videoRef}
                            style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}
                            playsInline
                            muted
                        />
                        <canvas
                            ref={canvasRef}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                transform: "scaleX(-1)",
                            }}
                        />
                    </div>

                    <div className="text-2xl flex flex-col">
                        {reps === 0 ? (
                            <>
                                <p className="mb-3 font-bold">Instructions:</p>
                                <p>1. Set up – Hands slightly wider than shoulders, body straight like a plank, core tight.</p>
                                <p>2. Lower – Bend elbows, keep body straight, chest close to floor.</p>
                                <p>3. Push – Press up through palms, return to plank, repeat.</p>
                            </>
                        ) : (
                            <>
                                <p>Reps : {reps}</p>
                                <p className="mb-10">Time : {Math.floor(elapsedTime)}s</p>
                            </>
                        )}
                    </div>


                </div>
                        {summary && (
                            <div className={"mt-10"}>
                                <section className="animate-fade-in">
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
                                                        Video Analysis
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
                                                    <div className="text-xs uppercase tracking-wider text-kompte-purple font-semibold mb-2">Name</div>
                                                    <div className="text-xl font-bold text-foreground">{summary.activeUser.name}</div>
                                                </div>

                                                <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-velocity-orange/10 to-velocity-orange/5 border border-velocity-orange/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                                    <div className="text-xs uppercase tracking-wider text-velocity-orange font-semibold mb-2">Age</div>
                                                    <div className="text-xl font-bold text-foreground">{summary.activeUser.age}</div>
                                                </div>

                                                <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-data-blue/10 to-data-blue/5 border border-data-blue/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                                    <div className="text-xs uppercase tracking-wider text-data-blue font-semibold mb-2">Reps</div>
                                                    <div className="text-xl font-bold text-foreground">{summary.total_reps}</div>
                                                </div>

                                                <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-accuracy-green/10 to-accuracy-green/5 border border-accuracy-green/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                                    <div className="text-xs uppercase tracking-wider text-accuracy-green font-semibold mb-2">Height</div>
                                                    <div className="text-xl font-bold text-foreground">{summary.activeUser.height}</div>
                                                </div>

                                                <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-kompte-purple/10 to-kompte-purple/5 border border-kompte-purple/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                                    <div className="text-xs uppercase tracking-wider text-kompte-purple font-semibold mb-2">Weight</div>
                                                    <div className="text-xl font-bold text-foreground">{summary.activeUser.weight} kg</div>
                                                </div>

                                                <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-velocity-orange/10 to-velocity-orange/5 border border-velocity-orange/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                                    <div className="text-xs uppercase tracking-wider text-velocity-orange font-semibold mb-2">Gender</div>
                                                    <div className="text-xl font-bold text-foreground">{summary.activeUser.gender}</div>
                                                </div>
                                            </div>

        
                                        </CardContent>
                                    </Card>
                                </section>
                                <section>
                                    <PerformanceInsights stamina={summary.stamina} cal={summary.calories} form={summary.avg_pose_score} recov={Math.floor(elapsedTime).toString()}/>
                                </section>
                                <div
                                    style={{ marginTop: 1, background: "hsl(var(--card))", padding: 80,borderRadius: 25 , }}
                                >
                                    <h4 className="text-lg font-bold text-foreground">Charts</h4>
                                    {/*<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>*/}
                                    <div className="grid grid-cols-3 gap-x-24 gap-y-24">
                                        <div style={{ flex: "1 1 600px", height: 360 }}>
                                            <canvas id="pushup-reps-chart" style={{ width: "100%", height: "100%" }} />
                                        </div>
                                        <div style={{ flex: "1 1 600px", height: 360 }}>
                                            <canvas id="pushup-pose-chart" style={{ width: "100%", height: "100%" }} />
                                        </div>
                                        <div style={{ flex: "1 1 600px", height: 360 }}>
                                            <canvas
                                                id="pushup-activity-chart"
                                                style={{ width: "100%", height: "100%" }}
                                            />
                                        </div>

                                    </div>

                                </div>
                                {/* FRT Slider - appears after Performance Insights and charts */}
                                <div
                                    style={{ marginTop: 100, background: "hsl(var(--background))", padding: 10, borderRadius: 25 }}
                                >
                                        {/* Header */}
                                        <div className="text-center mb-12 animate-fade-in">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                                                <span className="text-sm font-medium text-primary">Functional Reach Test</span>
                                            </div>
                                            <h2 className="text-4xl font-bold tracking-tight mb-4 text-center">
                                                 Select Your <span className="gradient-text">FRT Rating</span>
                                             </h2>
                                            <p className="text-lg text-muted-foreground max-w-4xl mx-auto whitespace-nowrap">
                                                Choose the difficulty level that best represents your current functional reach capability
                                            </p>
                                        </div>

                                        {/* Simple Slider */}
                                        <Card className="pt-6 pb-16 px-10 space-y-10 max-w-5xl mx-auto bg-card border border-border hover:shadow-2xl transition-all duration-500 hover:scale-105">
                                          <div className="text-center space-y-4">
                                            <h3 className="text-2xl font-bold text-foreground">Rate Your Difficulty</h3>
                                            <p className="text-lg text-muted-foreground">Easy to Hard</p>
                                          </div>

                                          {/* Simple Range Slider */}
                                          <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm font-medium text-green-400 -ml-2">Easy</span>
                                              <span className="text-sm font-medium text-red-400 -mr-2">Hard</span>
                                            </div>

                                            <div className="w-full flex flex-col items-center">
                                              <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="25"
                                                value={frtRating}
                                                onChange={handleFrtRatingChange}
                                                className="w-full h-3 bg-secondary rounded-lg appearance-none cursor-pointer slider"
                                                style={{
                                                  background: 'linear-gradient(90deg, hsl(120 84% 60%) 0%, hsl(60 84% 70%) 50%, hsl(0 84% 60%) 100%)'
                                                }}
                                              />
                                            </div>

                                                <div className="relative w-full mt-2">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span className={`absolute left-0 transform -translate-x-1/2 ${frtRating === 0 ? 'text-green-400 font-semibold' : ''}`}>Very<br/>Easy</span>
                                                        <span className={`absolute left-1/4 transform -translate-x-1/2 ${frtRating === 25 ? 'text-green-400 font-semibold' : ''}`}>Easy</span>
                                                        <span className={`absolute left-1/2 transform -translate-x-1/2 ${frtRating === 50 ? 'text-green-400 font-semibold' : ''}`}>Moderate</span>
                                                        <span className={`absolute left-3/4 transform -translate-x-1/2 ${frtRating === 75 ? 'text-red-400 font-semibold' : ''}`}>Hard</span>
                                                        <span className={`absolute left-full transform -translate-x-1/2 ${frtRating === 100 ? 'text-red-400 font-semibold' : ''}`}>Very Hard</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 border-border/50 hover:bg-muted/50"
                                                    onClick={handleResetToModerate}
                                                >
                                                    Reset to Moderate
                                                </Button>
                                                <Button
                                                    className="btn-premium flex-1"
                                                    onClick={handleConfirmRating}
                                                    disabled={frtConfirmed}
                                                >
                                                    {frtConfirmed ? 'Rating Confirmed!' : 'Confirm Rating'}
                                                </Button>
                                            </div>

                                        </Card>
                                        
                                        {/* Personalized Plan Button - appears after confirmation, outside the card */}
                                        {showPersonalizedPlan && (
                                            <div className="mt-12 text-center" data-testid="personalized-plan-section">
                                                <Button
                                                    className="w-full max-w-lg bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white font-bold py-6 px-10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110 border-2 border-emerald-400/30 backdrop-blur-sm"
                                                    onClick={handlePersonalizedPlan}
                                                >
                                                    <div className="flex items-center justify-center gap-3">
                                                        <span className="text-2xl">💪</span>
                                                        <span className="text-lg">Pay INR XX for Personalized Fitness Plans</span>
                                                        <span className="text-2xl">✨</span>
                                                    </div>
                                                </Button>
                                                <p className="text-sm text-muted-foreground text-center mt-4 font-medium">
                                                    Get customized workout plans based on your FRT rating
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="h-16"></div> {/* Bottom spacing */}
            </div>
    );
}