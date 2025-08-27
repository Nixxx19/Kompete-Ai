import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    evaluateStamina,
    calculateCaloriesDynamic,
    plotWorkoutSummary,
} from "./Utils";
import {drawConnectors, drawLandmarks} from "@mediapipe/drawing_utils";
import {Pose, POSE_CONNECTIONS} from "@mediapipe/pose";
import {Camera} from "@mediapipe/camera_utils";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {ArrowLeft, Trophy, Activity} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import PerformanceInsights from "@/components/PerformanceInsights.tsx";
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

export default function JumpingJacks({ user, onFinish }) {
    const activeUser = user ?? placeholderUser;

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraRef = useRef(null);
    const poseRef = useRef(null);
    const rafRef = useRef(null);
    const streamRef = useRef(null);

    // States
    const [useCamera, setUseCamera] = useState(true);
    const [file, setFile] = useState(null);
    const [reps, setReps] = useState(0);
    const [poseScore, setPoseScore] = useState(0);
    const [running, setRunning] = useState(false);
    const [summary, setSummary] = useState(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    
    // FRT Rating states
    const [frtRating, setFrtRating] = useState(50);
    const [frtConfirmed, setFrtConfirmed] = useState(false);
    const [showPersonalizedPlan, setShowPersonalizedPlan] = useState(false);

    // Internal refs and logic
    const stateRef = useRef("closed"); // "open" or "closed"
    const startTimeRef = useRef(null);
    const poseScoresRef = useRef([]);
    const pauseStartRef = useRef(null);
    const pauseTimeRef = useRef(0);
    const repTimestampsRef = useRef([]);

    // Helper: average visibility of landmarks
    const avgVisibility = (landmarks) => {
        if (!landmarks || landmarks.length === 0) return 0;
        let sum = 0;
        landmarks.forEach((l) => (sum += l.visibility ?? 1));
        return sum / landmarks.length;
    };

    const onResults = useCallback((results) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
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
            const score = avgVisibility(lm);
            poseScoresRef.current.push(score);
            setPoseScore(Number(score.toFixed(2)));

            if (pauseStartRef.current) {
                pauseTimeRef.current += performance.now() / 1000 - pauseStartRef.current;
                pauseStartRef.current = null;
            }

            // Jumping Jacks detection logic:

            const leftWrist = lm[15];
            const rightWrist = lm[16];
            const leftShoulder = lm[11];
            const rightShoulder = lm[12];
            const leftAnkle = lm[27];
            const rightAnkle = lm[28];

            const avgWristY = (leftWrist.y + rightWrist.y) / 2;
            const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
            const ankleDist = Math.abs(leftAnkle.x - rightAnkle.x);

            // Define criteria for open and closed states:
            const handsUp = avgWristY < avgShoulderY - 0.10; // wrists significantly above shoulders
            const feetApart = ankleDist > 0.25; // feet far apart
            const feetTogether = ankleDist < 0.15; // feet close together

            if (handsUp && feetApart && stateRef.current === "closed") {
                stateRef.current = "open";
                // Start timer on first open if not started
                if (startTimeRef.current === null) {
                    startTimeRef.current = performance.now() / 1000;
                }
            } else if (!handsUp && feetTogether && stateRef.current === "open") {
                stateRef.current = "closed";
                setReps((r) => r + 1);
                repTimestampsRef.current.push(performance.now() / 1000 - (startTimeRef.current ?? 0));
            }
        } else {
            // No pose detected
            if (startTimeRef.current !== null && !pauseStartRef.current) {
                pauseStartRef.current = performance.now() / 1000;
            }
        }
    }, []);

    // Camera start
    const startWebcam = useCallback(async () => {
        if (!videoRef.current || !poseRef.current) {
            alert("Video element or Pose instance not found.");
            return;
        }

        try {
            // Ask for camera permission first and store the stream
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            // Store the stream reference for later stopping
            if (!streamRef.current) {
                streamRef.current = stream;
            }

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
    // File processing
    const processFileFrame = useCallback(async () => {
        if (!videoRef.current || !poseRef.current) return;
        if (videoRef.current.paused || videoRef.current.ended) return;
        await poseRef.current.send({ image: videoRef.current });
        rafRef.current = requestAnimationFrame(processFileFrame);
    }, []);

    const startFileProcessing = useCallback(
        (fileObj) => {
            if (!videoRef.current || !poseRef.current) return;
            
            // If video is already loaded with the same file, just start playing
            if (videoRef.current.src && videoRef.current.src.includes(fileObj.name)) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().then(() => {
                    setRunning(true);
                    rafRef.current = requestAnimationFrame(processFileFrame);
                });
            } else {
                // Load new video
                const url = URL.createObjectURL(fileObj);
                videoRef.current.src = url;
                videoRef.current.play().then(() => {
                    setRunning(true);
                    rafRef.current = requestAnimationFrame(processFileFrame);
                });
            }
        },
        [processFileFrame]
    );

    // Stop all tracking
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
        if (videoRef.current) {
            // Stop any video stream
            if (videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            // Pause video if it's a file
            if (!useCamera) {
                try {
                    videoRef.current.pause();
                } catch {}
            }
        }
        setRunning(false);
    }, [useCamera]);

    // Start session
    const startSession = useCallback(async () => {
        if (!activeUser || !activeUser.name) {
            alert("Please provide user info.");
            return;
        }

        // Reset all refs and states
        stateRef.current = "closed";
        startTimeRef.current = null;
        poseScoresRef.current = [];
        pauseTimeRef.current = 0;
        pauseStartRef.current = null;
        repTimestampsRef.current = [];
        setReps(0);
        setPoseScore(0);
        setSummary(null);
        setIsSessionActive(true);

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

    // Stop session and calculate stats
    const stopSession = useCallback(async () => {
        if (pauseStartRef.current) {
            pauseTimeRef.current += performance.now() / 1000 - pauseStartRef.current;
            pauseStartRef.current = null;
        }

        const totalDuration = startTimeRef.current
            ? Math.round(performance.now() / 1000 - startTimeRef.current)
            : 0;

        const avgPose =
            poseScoresRef.current.length > 0
                ? poseScoresRef.current.reduce((a, b) => a + b, 0) / poseScoresRef.current.length
                : 0;

        const calories = calculateCaloriesDynamic(
            reps,
            totalDuration,
            activeUser.weight,
            activeUser.age,
            activeUser.gender,
            "jumping_jacks"
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
        
        const summaryObj = {
            activeUser: currentPlayerData,
            total_reps: reps,
            total_duration: totalDuration,
            avg_pose_score: Number(avgPose.toFixed(3)),
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
        // Stop everything first
        await stopEverything();
        
        // Clear stored stream
        if (streamRef.current) {
            streamRef.current = null;
        }
        
        // Stop pose detection
        if (poseRef.current) {
            try {
                await poseRef.current.close();
            } catch (error) {
                console.log('Error closing pose:', error);
            }
            poseRef.current = null;
        }
        
        // Stop everything else
        await stopEverything();
        setFile(null);
        setUseCamera(true);
        setSummary(null);
        poseScoresRef.current = [];
        
        // Stop camera stream if it's running
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            videoRef.current.srcObject = null;
        }
        
        // Force stop all media streams
        try {
            const streams = await navigator.mediaDevices.enumerateDevices();
            console.log('Available devices:', streams.length);
        } catch (error) {
            console.log('Error enumerating devices:', error);
        }
        
        // Clear the video element
        if (videoRef.current) {
            videoRef.current.src = '';
            videoRef.current.load();
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            // Force clear any cached video data
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
            
            // Clear the canvas
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }
        }
        repTimestampsRef.current = [];
        pauseTimeRef.current = 0;
        setReps(0);
        setPoseScore(0);
        setIsSessionActive(false);
    }, [stopEverything]);

    // Setup MediaPipe Pose
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

    // Plot workout summary on session end
    useEffect(() => {
        if (!summary) return;

        plotWorkoutSummary(
            {
                repsChart: "jj-reps-chart",
                poseChart: "jj-pose-chart",
                activityChart: "jj-activity-chart",
                summaryBox: "jj-summary-text",
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
    };

    const handlePersonalizedPlan = () => {
        // Handle the personalized plan purchase/action
        console.log('Personalized plan requested for INR XX');
        // You can add payment integration, navigation to payment page, etc.
        alert('Redirecting to personalized fitness plan purchase for INR XX...');
    };

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
                                        <div className="p-3 rounded-xl bg-orange-500/30 border border-orange-500/20">
                                            <Activity className="w-7 h-7 text-orange-300" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-foreground">Jumping jacks Analysis</h1>
                                            <p className="text-sm text-muted-foreground">Live camera analysis</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Premium Control Panel */}
                    <div className="px-[10rem] mt-6">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-foreground mb-2">Exercise Control Panel</h3>
                            <p className="text-muted-foreground">Choose your input method and control your session</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-center">
                                        {/* Input Selection */}
                                        <div className="space-y-6">
                                            <h4 className="text-lg font-semibold text-foreground mb-4">Input Method</h4>
                                            
                                            {/* Premium Radio Buttons */}
                                            <div className="space-y-4">
                                                <label className="group cursor-pointer">
                                                    <div className={`flex items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                                                        useCamera 
                                                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                                                            : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
                                                    }`}>
                                                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all duration-300 ${
                                                            useCamera 
                                                                ? 'border-primary bg-primary' 
                                                                : 'border-border/50 group-hover:border-primary/50'
                                                        }`}>
                                                            {useCamera && (
                                                                <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-primary/20">
                                                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-foreground">Live Camera</p>
                                                                    <p className="text-sm text-muted-foreground">Real-time analysis</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        checked={useCamera}
                                                        onChange={() => setUseCamera(true)}
                                                        className="sr-only"
                                                    />
                                                </label>

                                                <label className="group cursor-pointer">
                                                    <div className={`flex items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                                                        !useCamera 
                                                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                                                            : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
                                                    }`}>
                                                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all duration-300 ${
                                                            !useCamera 
                                                                ? 'border-primary bg-primary' 
                                                                : 'border-border/50 group-hover:border-primary/50'
                                                        }`}>
                                                            {!useCamera && (
                                                                <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-primary/20">
                                                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="font-semibold text-foreground">Upload Video</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm text-muted-foreground">Analyze recorded video</p>
                                                                        {running && (
                                                                            <div className="flex items-center gap-1">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                                                                <span className="text-xs text-green-400 font-medium">Active</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        checked={!useCamera}
                                                        onChange={() => setUseCamera(false)}
                                                        className="sr-only"
                                                    />
                                                </label>
                                            </div>

                                            {/* File Upload */}
                                            {!useCamera && !file && (
                                                <div className="mt-6">
                                                    <div className="relative">
                                                        <input 
                                                            type="file" 
                                                            accept="video/*" 
                                                            onChange={handleFileSelect}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                        <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                                                            <div className="p-3 rounded-full bg-primary/20 w-fit mx-auto mb-3">
                                                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                </svg>
                                                            </div>
                                                            <p className="font-medium text-foreground">Click to upload video</p>
                                                            <p className="text-sm text-muted-foreground">MP4, MOV, AVI supported</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            

                                        </div>

                                        {/* Session Controls */}
                                        <div className="space-y-6">
                                            <h4 className="text-lg font-semibold text-foreground mb-4">Session Controls</h4>
                                            
                                            <div className="grid grid-cols-1 gap-4">
                                                <Button 
                                                    onClick={startSession} 
                                                    disabled={running}
                                                    className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-full bg-white/20">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <span>Start Session</span>
                                                    </div>
                                                </Button>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <Button 
                                                        onClick={stopSession} 
                                                        disabled={!running}
                                                        variant="outline"
                                                        className="h-12 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                            <span>Stop</span>
                                                        </div>
                                                    </Button>

                                                    <Button 
                                                        onClick={reset}
                                                        variant="outline"
                                                        className="h-12 bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20 hover:border-gray-500/50 font-semibold transition-all duration-300"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            <span>Reset</span>
                                                        </div>
                                                    </Button>
                                                </div>
                                            </div>


                                            

                                        </div>
                                    </div>
                                </div>
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

                            <div className="flex-1 max-w-lg">
                                {reps === 0 ? (
                                    <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/40 shadow-2xl transition-all duration-500">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5"></div>
                                        
                                        <div className="relative p-8">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg">
                                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Instructions</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">Follow these steps for proper form</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-5">
                                                <div className="group/step flex items-start gap-5 p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg">
                                                        1
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-foreground mb-2 text-lg">Start Position</h4>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            Stand straight with your feet together and arms relaxed at your sides.
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="group/step flex items-start gap-5 p-5 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/25 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/80 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg">
                                                        2
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-foreground mb-2 text-lg">Jump Out</h4>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            Jump up, spreading your feet shoulder-width apart while raising your arms overhead.
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="group/step flex items-start gap-5 p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg">
                                                        3
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-foreground mb-2 text-lg">Jump In</h4>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            Jump again to bring your feet back together and arms back to your sides.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/40 shadow-2xl transition-all duration-500">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5"></div>
                                        
                                        <div className="relative p-8">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg">
                                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Live Stats</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">Real-time performance metrics</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="group/stat text-center p-6 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                                                    <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-2">{reps}</div>
                                                    <div className="text-sm text-muted-foreground font-medium">Reps</div>
                                                </div>
                                                <div className="group/stat text-center p-6 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/25 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
                                                    <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-2">
                                                        {summary
                                                            ? `${summary.total_duration}s`
                                                            : startTimeRef.current
                                                                ? Math.round(performance.now() / 1000 - startTimeRef.current) + "s"
                                                                : "0s"}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground font-medium">Time</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                                    <PerformanceInsights stamina={summary.stamina} cal={summary.calories} form={summary.avg_pose_score} recov={summary
                                        ? `${summary.total_duration}`
                                        : startTimeRef.current
                                            ? Math.round(performance.now() / 1000 - startTimeRef.current) + "s"
                                            : "0s"}/>
                                </section>
                                <div
                                    style={{ marginTop: 1, background: "hsl(var(--card))", padding: 80,borderRadius: 25 , }}
                                >
                                    <h4 className="text-lg font-bold text-foreground">Charts</h4>
                                    {/*<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>*/}
                                    <div className="grid grid-cols-3 gap-x-24 gap-y-24">
                                        <div style={{ flex: "1 1 600px", height: 360 }}>
                                            <canvas id="jj-reps-chart" style={{ width: "100%", height: "100%" }} />
                                        </div>
                                        <div style={{ flex: "1 1 600px", height: 360 }}>
                                            <canvas id="jj-pose-chart" style={{ width: "100%", height: "100%" }} />
                                        </div>
                                        <div style={{ flex: "1 1 600px", height: 360 }}>
                                            <canvas
                                                id="jj-activity-chart"
                                                style={{ width: "100%", height: "100%" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* FRT Slider - appears after Performance Insights and charts */}
                                <div
                                    style={{
                                        marginTop: 100,
                                        background: "hsl(var(--background))",
                                        padding: 10,
                                        borderRadius: 25,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                    }}
                                >
                                    {/* Header */}
                                    <div className="text-center mb-12 animate-fade-in w-full">
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
                                    <Card className="pt-6 pb-16 px-10 space-y-10 max-w-5xl mx-auto bg-card border border-border hover:shadow-2xl transition-all duration-500 hover:scale-105 w-full">
                                        <div className="text-center space-y-4">
                                            <h3 className="text-2xl font-bold text-foreground">Rate Your Difficulty</h3>
                                            <p className="text-lg text-muted-foreground">Easy to Hard</p>
                                        </div>

                                        {/* Simple Range Slider */}
                                        <div className="space-y-6 w-full">
                                            <div className="flex justify-between items-center w-full">
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

                                            <div className="relative w-full mt-2" style={{ minHeight: 32 }}>
                                                <div className="flex justify-between text-xs text-muted-foreground w-full relative">
                                                    <span
                                                        className={`absolute left-0 transform -translate-x-1/2 ${frtRating === 0 ? 'text-green-400 font-semibold' : ''}`}
                                                        style={{ left: "0%" }}
                                                    >Very<br />Easy</span>
                                                    <span
                                                        className={`absolute left-1/4 transform -translate-x-1/2 ${frtRating === 25 ? 'text-green-400 font-semibold' : ''}`}
                                                        style={{ left: "25%" }}
                                                    >Easy</span>
                                                    <span
                                                        className={`absolute left-1/2 transform -translate-x-1/2 ${frtRating === 50 ? 'text-green-400 font-semibold' : ''}`}
                                                        style={{ left: "50%" }}
                                                    >Moderate</span>
                                                    <span
                                                        className={`absolute left-3/4 transform -translate-x-1/2 ${frtRating === 75 ? 'text-red-400 font-semibold' : ''}`}
                                                        style={{ left: "75%" }}
                                                    >Hard</span>
                                                    <span
                                                        className={`absolute left-full transform -translate-x-1/2 ${frtRating === 100 ? 'text-red-400 font-semibold' : ''}`}
                                                        style={{ left: "100%" }}
                                                    >Very Hard</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full">
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
                                        <div className="mt-12 text-center w-full flex flex-col items-center" data-testid="personalized-plan-section">
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
    );
}
