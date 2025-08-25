import React, { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import * as drawingUtils from "@mediapipe/drawing_utils";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {ArrowLeft, Download, Trophy} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import PerformanceInsights from "@/components/PerformanceInsights.tsx";

const JumpingJacks = () => {
    const repCountRef = useRef(0);
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [reps, setReps] = useState(0);
    const [status, setStatus] = useState("Waiting...");
    const [isWebcam, setIsWebcam] = useState(false);
    const poseInstance = useRef(null); // ⬅️ Use ref to persist pose instance
    // new stuff
    // const [startTime, setStartTime] = useState(null);
    const startTimeRef = useRef(null);

    const [endTime, setEndTime] = useState(null);
    // const [poseScores, setPoseScores] = useState([]);
    const poseScoresRef = useRef([]);

    const [summary, setSummary] = useState(null);
    const [pauseTime, setPauseTime] = useState(0);
    const [stamina, setStamina] = useState("");
    const pauseStartRef = useRef(null);



    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        startWebcam()

        // new


        // Setup Pose
        poseInstance.current = new Pose({
            locateFile: (file) =>
                `/node_modules/@mediapipe/pose/${file}`, // ← not necessary in dev, but kept explicit
        });

        poseInstance.current.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        let repCount = 0;

        let state = "closed";
        let timerStarted = false;
        // let startTime = null;

        poseInstance.current.onResults((results) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (results.image) {
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            }

            if (results.poseLandmarks) {
                const lm = results.poseLandmarks;
                const avgWristY = (lm[15].y + lm[16].y) / 2;
                const avgShoulderY = (lm[11].y + lm[12].y) / 2;
                const ankleDist = Math.abs(lm[27].x - lm[28].x);
                const handsUp = avgWristY < avgShoulderY - 0.1;
                const feetApart = ankleDist > 0.25;
                const feetTogether = ankleDist < 0.15;

                if (!timerStarted && handsUp && feetApart) {
                    timerStarted = true;
                    startTimeRef.current = Date.now();
                }

                if (timerStarted) {
                    // const now = Date.now();

                    if (handsUp && feetApart && state === "closed") {
                        state = "open";
                    } else if (!handsUp && feetTogether && state === "open") {
                        state = "closed";
                        repCount++;
                        setReps(repCount);
                        repCountRef.current++;
                        setReps(repCountRef.current);

                    }else {
                        // This is the "pause" state
                        if (!pauseStartRef.current) {
                            pauseStartRef.current = Date.now();  // pause started
                        }
                    }

                    const elapsed = (Date.now() - startTimeRef.current) / 1000;
                    const score = results.poseLandmarks.reduce((sum, lm) => sum + lm.visibility, 0) / results.poseLandmarks.length;
                    // setPoseScores((prev) => [...prev, score]);
                    poseScoresRef.current.push(score);
                    // const avgScore = poseScores.reduce((a, b) => a + b, 0) / poseScores.length;
                    const scores = poseScoresRef.current;
                    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

                    if (pauseStartRef.current && (handsUp && feetApart || !handsUp && feetTogether)) {
                        const pauseDuration = (Date.now() - pauseStartRef.current) / 1000;
                        setPauseTime(prev => prev + pauseDuration);
                        pauseStartRef.current = null;
                    }


                    setStatus(`Reps: ${repCount} | Time: ${Math.floor(elapsed)}s`);
                } else {
                    setStatus("Waiting for hands up + feet apart...");
                }

                drawingUtils.drawConnectors(ctx, lm, POSE_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 2,
                });
                drawingUtils.drawLandmarks(ctx, lm, {
                    color: "#FF0000",
                    lineWidth: 1,
                });
            }
        });

        return () => {
            // Clean up if needed
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);
    function evaluateStamina(age, weight, reps, duration, avgScore, pauseTime) {
        let score = 0;
        duration = duration > 0 ? duration : 1;
        const repRate = (reps / duration) * 60;

        // Repetition Rate
        if (repRate > 30) score += 2;
        else if (repRate >= 20) score += 1;

        // Pose Quality
        if (avgScore > 0.8) score += 2;
        else if (avgScore >= 0.6) score += 1;

        // Pause Time
        if (pauseTime < 5) score += 2;
        else if (pauseTime < 10) score += 1;

        // Age
        if (age < 25) score += 2;
        else if (age <= 35) score += 1;

        // Final Levels
        if (score >= 8) return "Elite 💎";
        else if (score >= 7) return "Excellent 💪";
        else if (score >= 5) return "Good 🙂";
        else if (score >= 3) return "Average 😐";
        else return "Needs Improvement 😓";
    }

    function calculateCaloriesDynamic(reps, durationSec, weightKg, age, gender, exerciseType = "generic") {
        const durationMin = durationSec / 60;
        if (durationMin === 0) return 0.0;

        let bmr;
        if (gender.toLowerCase() === "male" || gender.toLowerCase() === "m") {
            bmr = 10 * weightKg + 6.25 * 170 - 5 * age + 5;
        } else {
            bmr = 10 * weightKg + 6.25 * 160 - 5 * age - 161;
        }

        const caloriesPerMin = bmr / 1440;
        const multiplierMap = {
            jumping_jacks: 8,
            high_knees: 8.5,
            squats: 6.5,
            pushups: 7.0,
            generic: 6.0
        };
        const multiplier = multiplierMap[exerciseType.toLowerCase()] || 6.0;
        const totalCalories = caloriesPerMin * durationMin * (multiplier / 1.5);

        return parseFloat(totalCalories.toFixed(2));
    }


    const processFrameLoop = () => {
        const video = videoRef.current;
        const pose = poseInstance.current;

        const step = async () => {
            await pose.send({ image: video });
            if (!video.paused && !video.ended) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    const handleVideoUpload = (e) => {
        // setPoseScores([]);
        poseScoresRef.current = [];

        setPauseTime(0);
        repCountRef.current = 0;

        const file = e.target.files[0];
        if (!file) return;

        setIsWebcam(false);
        const video = videoRef.current;
        video.src = URL.createObjectURL(file);
        video.onloadeddata = () => {
            video.play();
            processFrameLoop();
        };
        video.onended = () => {
            // const totalTime = (Date.now() - startTime) / 1000;
            const totalTime = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;

            // const avgScore = poseScores.reduce((a, b) => a + b, 0) / poseScores.length;
            const scores = poseScoresRef.current;
            const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

            // const summaryData = {
            //     name: "Anonymous",
            //     age: 20,
            //     gender: "Unspecified",
            //     weight: 70,
            //     duration_sec: totalTime.toFixed(1),
            //     reps: repCountRef.current,
            //     avg_pose_score: avgScore.toFixed(2),
            //     pause_time: pauseTime.toFixed(1),
            //     stamina: avgScore > 0.7 ? "High" : "Low",
            //     calories: (0.1 * reps + 0.035 * totalTime).toFixed(2),
            // };
            const user = {
                name: "Adi",
                age: 18,
                gender: "Male",
                weight: 65,
            };
            const staminaLevel = evaluateStamina(user.age, user.weight, repCountRef.current, totalTime, avgScore, pauseTime);
            const caloriesBurned = calculateCaloriesDynamic(repCountRef.current, totalTime, user.weight, user.age, user.gender, "jumping_jacks");

            const summaryData = {
                ...user,
                duration_sec: totalTime.toFixed(1),
                reps: repCountRef.current,
                avg_pose_score: avgScore.toFixed(2),
                pause_time: pauseTime.toFixed(1),
                stamina: staminaLevel,
                calories: caloriesBurned.toFixed(2),
            };

            setSummary(summaryData);
        };

    };

    const startWebcam = async () => {
        setIsWebcam(true);
        const video = videoRef.current;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        const camera = new Camera(video, {
            onFrame: async () => {
                await poseInstance.current.send({ image: video });
            },
            width: 640,
            height: 480,
        });

        camera.start();
    };

    return (
        <div className="min-h-screen bg-background overflow-hidden z-[-1]" >
            <div className="relative z-10">
                {/* Header */}
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
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Jumping Jacks Analysis</h1>
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
                </div>
            <div style={{ marginBottom: "10px" }} className={"mt-4 flex justify-center"}>
                {/*<button onClick={startWebcam}>📷 Start Webcam</button>*/}
                <button className={"px-6 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-kompte-purple to-velocity-orange text-white shadow-lg border border-white/10 backdrop-blur-md"}
                    onClick={() => {
                        const video = videoRef.current;
                        if (video.srcObject) {
                            video.srcObject.getTracks().forEach((track) => track.stop());
                            video.srcObject = null; // 👈 Clear the source
                            video.removeAttribute("src"); // 👈 Optional: clear URL if needed
                            video.load(); // 👈 Force a reset of the <video> element

                        }
                        // const totalTime = (Date.now() - startTime) / 1000;
                        const totalTime = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;

                        // const avgScore = poseScores.reduce((a, b) => a + b, 0) / poseScores.length;
                        // const avgScore = poseScores.length
                        //     ? poseScores.reduce((a, b) => a + b, 0) / poseScores.length
                        //     : 0;
                        const scores = poseScoresRef.current;
                        const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

                        const user = {
                            name: "Adi",
                            age: 18,
                            gender: "Male",
                            weight: 65,
                        };
                        const staminaLevel = evaluateStamina(user.age, user.weight, repCountRef.current, totalTime, avgScore, pauseTime);
                        const caloriesBurned = calculateCaloriesDynamic(repCountRef.current, totalTime, user.weight, user.age, user.gender, "jumping_jacks");

                        const summaryData = {
                            ...user,
                            duration_sec: totalTime.toFixed(1),
                            reps: repCountRef.current,
                            avg_pose_score: avgScore.toFixed(2),
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

                <div className="flex items-center  justify-center">
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
                            }}
                        />
                    </div>
                </div>



                {summary && (

                    <>
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
                                            Live Analysis Complete
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
                                        <div className="text-xl font-bold text-foreground">{summary.name}</div>
                                    </div>

                                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-velocity-orange/10 to-velocity-orange/5 border border-velocity-orange/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                        <div className="text-xs uppercase tracking-wider text-velocity-orange font-semibold mb-2">Age</div>
                                        <div className="text-xl font-bold text-foreground">{summary.age}</div>
                                    </div>

                                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-data-blue/10 to-data-blue/5 border border-data-blue/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                        <div className="text-xs uppercase tracking-wider text-data-blue font-semibold mb-2">Reps</div>
                                        <div className="text-xl font-bold text-foreground">{summary.reps}</div>
                                    </div>

                                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-accuracy-green/10 to-accuracy-green/5 border border-accuracy-green/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                        <div className="text-xs uppercase tracking-wider text-accuracy-green font-semibold mb-2">Stamina</div>
                                        <div className="text-xl font-bold text-foreground">{summary.stamina}</div>
                                    </div>

                                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-kompte-purple/10 to-kompte-purple/5 border border-kompte-purple/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                        <div className="text-xs uppercase tracking-wider text-kompte-purple font-semibold mb-2">Calories</div>
                                        <div className="text-xl font-bold text-foreground">{summary.calories} kcal</div>
                                    </div>

                                    <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-velocity-orange/10 to-velocity-orange/5 border border-velocity-orange/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                        <div className="text-xs uppercase tracking-wider text-velocity-orange font-semibold mb-2">Form</div>
                                        <div className="text-xl font-bold text-foreground">{summary.avg_pose_score * 100}%</div>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <Button className="gap-2 bg-gradient-to-r from-kompte-purple to-velocity-orange hover:from-kompte-purple/90 hover:to-velocity-orange/90 text-white border-0 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                        <Download className="w-5 h-5" />
                                        Download Premium Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                    <section>
                        <PerformanceInsights stamina={""} cal={""} form={""} recov={""} />
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
export default JumpingJacks;