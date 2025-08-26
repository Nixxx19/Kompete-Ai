import { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// TypeScript declarations for OpenCV
declare global {
  interface Window {
    cv: any;
  }
}


export default function DrillTracker() 
{
  // --- CONFIG (match Python) ---
  const rows = 3;
  const cols = 3;
  const courtWidth = 600;
  const courtHeight = 800;
  const tolerance = 10;

  // Main canvas size
  const CANVAS_W = 640;
  const CANVAS_H = 360;

  // --- Refs / State ---
  const videoRef = useRef(null);
  const mainCanvasRef = useRef(null);
  const planeCanvasRef = useRef(null);
  const heatmapCanvasRef = useRef(null);
  const rafRef = useRef(0);

  const [selectedPoints, setSelectedPoints] = useState([]);
  const [gridLines, setGridLines] = useState([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showCorners, setShowCorners] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Drill tracking state
  const [drillStats, setDrillStats] = useState({
    validCycles: 0,
    totalMoves: 0,
    sessionTime: 0,
    speed: 0,
    totalDistance: 0
  });

  const [showFinalResults, setShowFinalResults] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState(null);

  const cvReadyRef = useRef(false);
  const poseRef = useRef(null);
  const homographyToBirdRef = useRef(null);
  const homographyToOrigRef = useRef(null);

  // Drill tracking refs
  const zoneCounterRef = useRef(Array.from({ length: rows }, () => Array(cols).fill(0)));
  const drillStateRef = useRef("at_center_waiting_to_start");
  const lastZoneRef = useRef(null);
  const cycleStartTimeRef = useRef(null);
  const drillCyclesRef = useRef([]);
  const cycleTimesRef = useRef([]);
  const validCycleCountRef = useRef(0);
  const startTimeRef = useRef(null);
  const trajectoryPointsRef = useRef([]);
  const totalDistanceRef = useRef(0);
  const frameCountRef = useRef(0);

  const isProcessingRef = useRef(false);

  // --- Helper Functions ---
  function reorderPointsTLTRBRBL(pts) {
    const arr = pts.map(p => [p[0], p[1]]);
    const sums = arr.map(([x, y]) => x + y);
    const diffs = arr.map(([x, y]) => x - y);

    const tl = arr[sums.indexOf(Math.min(...sums))];
    const br = arr[sums.indexOf(Math.max(...sums))];
    const tr = arr[diffs.indexOf(Math.max(...diffs))];
    const bl = arr[diffs.indexOf(Math.min(...diffs))];

    return [tl, tr, br, bl];
  }

  function calculateDistance(p1, p2) {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function drawCornerPoints(ctx, points) {
    if (!showCorners || points.length === 0) return;

    ctx.save();
    points.forEach(([x, y]) => {
      ctx.fillStyle = '#00FF00';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    if (points.length === 4) {
      const [tl, tr, br, bl] = reorderPointsTLTRBRBL(points);
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(tl[0], tl[1]);
      ctx.lineTo(tr[0], tr[1]);
      ctx.lineTo(br[0], br[1]);
      ctx.lineTo(bl[0], bl[1]);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGridOnContext(ctx, lines) {
    if (!showGrid || lines.length === 0) return;
    ctx.save();
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    for (const [[x1, y1], [x2, y2]] of lines) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBirdEyeView(ctx) {
    const w = courtWidth;
    const h = courtHeight;
    
    // Dark background
    ctx.fillStyle = "rgb(50,50,50)";
    ctx.fillRect(0, 0, w, h);

    // Cell grid
    const cellW = w / cols;
    const cellH = h / rows;
    
    ctx.strokeStyle = "rgb(100,100,100)";
    ctx.lineWidth = 1;
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgb(160,160,160)";

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const x1 = j * cellW;
        const y1 = i * cellH;
        const x2 = (j + 1) * cellW;
        const y2 = (i + 1) * cellH;
        
        ctx.strokeRect(x1, y1, cellW, cellH);
        ctx.fillText(`(${i},${j})`, x1 + 10, y1 + 25);
      }
    }

    // Draw trajectory
    const trajectory = trajectoryPointsRef.current;
    if (trajectory.length > 1) {
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(trajectory[0][0], trajectory[0][1]);
      for (let i = 1; i < trajectory.length; i++) {
        ctx.lineTo(trajectory[i][0], trajectory[i][1]);
      }
      ctx.stroke();
    }

    // Draw current player position
    if (trajectory.length > 0) {
      const [wx, wy] = trajectory[trajectory.length - 1];
      ctx.fillStyle = "#00FFFF";
      ctx.beginPath();
      ctx.arc(wx, wy, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // "You" label
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "10px sans-serif";
      ctx.fillText("You", wx + 12, wy - 10);
    }
  }

  function updateHeatmap() {
    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    const counts = zoneCounterRef.current;
    let maxCount = 0;
    let totalMoves = 0;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        maxCount = Math.max(maxCount, counts[i][j]);
        totalMoves += counts[i][j];
      }
    }
    
    const cellWpx = w / cols;
    const cellHpx = h / rows;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const count = counts[i][j];
        const intensity = maxCount > 0 ? count / maxCount : 0;
        const hue = (1 - intensity) * 240; // Blue to red
        
        ctx.fillStyle = `hsl(${hue}, 90%, ${intensity * 40 + 35}%)`;
        ctx.fillRect(j * cellWpx, i * cellHpx, cellWpx, cellHpx);
        
        // Percentage label
        const percentage = totalMoves > 0 ? ((count / totalMoves) * 100).toFixed(1) : "0.0";
        ctx.fillStyle = intensity > 0.5 ? "#fff" : "#000";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${percentage}%`, j * cellWpx + cellWpx / 2, i * cellHpx + cellHpx / 2);
      }
    }
    
    // Grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1;
    for (let i = 1; i < rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHpx);
      ctx.lineTo(w, i * cellHpx);
      ctx.stroke();
    }
    for (let j = 1; j < cols; j++) {
      ctx.beginPath();
      ctx.moveTo(j * cellWpx, 0);
      ctx.lineTo(j * cellWpx, h);
      ctx.stroke();
    }
  }

  // --- Initialize OpenCV + Pose ---
  useEffect(() => {
    let cancelled = false;

    const checkOpenCV = () => {
      return window.cv && window.cv.Mat && typeof window.cv.getPerspectiveTransform === 'function';
    };

    async function tryInit() {
      if (cancelled) return;

      if (!checkOpenCV()) {
        setTimeout(tryInit, 100);
        return;
      }

      cvReadyRef.current = true;

      try {
        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        pose.onResults(handlePoseResults);
        poseRef.current = pose;
      } catch (error) {
        console.error("Failed to initialize MediaPipe Pose:", error);
      }

      const video = videoRef.current;
      if (!video) return;

      const startPaused = () => {
        try { video.pause(); } catch {}
        video.currentTime = 0;
        setIsVideoLoaded(true);
        setIsSetupComplete(false);
        drawVideoFrame();
      };

      video.onloadeddata = () => startPaused();
    }

    if (!window.cv) {
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.5.2/opencv.js';
      script.async = true;
      script.onload = () => setTimeout(tryInit, 400);
      script.onerror = () => console.error("Failed to load OpenCV script");
      document.head.appendChild(script);
    } else {
      tryInit();
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // --- Main RAF loop ---
  const loop = async () => {
    const video = videoRef.current;
    const canvas = mainCanvasRef.current;
    if (!video || video.readyState < 2 || !canvas || !poseRef.current) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    // Skip every other frame for performance (like Python frame_skip)
    frameCountRef.current += 1;
    if (frameCountRef.current % 2 !== 0) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    if (!isProcessingRef.current) {
      try {
        isProcessingRef.current = true;
        await poseRef.current.send({ image: video });
      } catch (e) {
        console.error(e);
      } finally {
        isProcessingRef.current = false;
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  // --- Handle Pose Results ---
  const handlePoseResults = (results) => {
    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext("2d");

    // Draw current video frame
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(results.image, 0, 0, CANVAS_W, CANVAS_H);

    drawCornerPoints(ctx, selectedPoints);
    drawGridOnContext(ctx, gridLines);

    let playerCenter = null;

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      // Draw pose (optional)
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS);
      drawLandmarks(ctx, results.poseLandmarks, { radius: 2 });

      // Calculate bounding box and center
      const xs = results.poseLandmarks.map((lm) => lm.x * CANVAS_W);
      const ys = results.poseLandmarks.map((lm) => lm.y * CANVAS_H);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      playerCenter = [(minX + maxX) / 2, (maxY + maxY) / 2];

      // Draw bounding box
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      
      // Draw player center
      ctx.fillStyle = "#FF00FF";
      ctx.beginPath();
      ctx.arc(playerCenter[0], playerCenter[1], 6, 0, Math.PI * 2);
      ctx.fill();

      // Process player movement if homography is ready
      if (cvReadyRef.current && homographyToBirdRef.current && playerCenter) {
        processPlayerMovement(ctx, playerCenter);
      }
    }

    // Draw drill statistics on main canvas
    ctx.fillStyle = "#0000FF";
    ctx.font = "bold 18px sans-serif";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.strokeText(`Valid Drill Cycles: ${validCycleCountRef.current}`, 20, 30);
    ctx.fillText(`Valid Drill Cycles: ${validCycleCountRef.current}`, 20, 30);

    // Draw speed
    if (drillStats.speed > 0) {
      ctx.strokeText(`Speed: ${drillStats.speed.toFixed(2)} m/s`, 20, 60);
      ctx.fillText(`Speed: ${drillStats.speed.toFixed(2)} m/s`, 20, 60);
    }

    // Update bird's eye view
    const planeCanvas = planeCanvasRef.current;
    if (planeCanvas) {
      const pctx = planeCanvas.getContext("2d");
      drawBirdEyeView(pctx);
    }

    // Update heatmap
    updateHeatmap();
  };

  const processPlayerMovement = (ctx, playerCenter) => {
    try {
      const cv = window.cv;
      const [midX, midY] = playerCenter;
      
      const src = cv.matFromArray(1, 1, cv.CV_32FC2, [midX, midY]);
      const dst = new cv.Mat();
      cv.perspectiveTransform(src, dst, homographyToBirdRef.current);
      
      const wx = Math.max(0, Math.min(courtWidth - 1, Math.round(dst.data32F[0])));
      const wy = Math.max(0, Math.min(courtHeight - 1, Math.round(dst.data32F[1])));
      
      src.delete();
      dst.delete();

      // Add to trajectory
      const trajectory = trajectoryPointsRef.current;
      if (trajectory.length === 0) {
        startTimeRef.current = Date.now();
      }
      
      trajectory.push([wx, wy]);
      
      // Calculate distance
      if (trajectory.length > 1) {
        const prev = trajectory[trajectory.length - 2];
        const curr = trajectory[trajectory.length - 1];
        const dist = calculateDistance(prev, curr);
        // Convert pixels to meters (50 pixels = 1 court unit, 0.0264m per unit)
        const distanceMeters = (dist * 50 * 0.0264) / 100;
        totalDistanceRef.current += distanceMeters;
        
        // Update speed
        const currentTime = (Date.now() - startTimeRef.current) / 1000;
        if (currentTime > 0) {
          const speed = totalDistanceRef.current / currentTime;
          setDrillStats(prev => ({ ...prev, speed, totalDistance: totalDistanceRef.current, sessionTime: currentTime }));
        }
      }

      // Zone detection and drill logic
      const cellW = courtWidth / cols;
      const cellH = courtHeight / rows;
      let foundZone = false;
      
      for (let i = 0; i < rows && !foundZone; i++) {
        for (let j = 0; j < cols && !foundZone; j++) {
          const x1 = j * cellW - tolerance;
          const x2 = (j + 1) * cellW + tolerance;
          const y1 = i * cellH - tolerance;
          const y2 = (i + 1) * cellH + tolerance;
          
          if (wx >= x1 && wx < x2 && wy >= y1 && wy < y2) {
            zoneCounterRef.current[i][j] += 1;
            const currentZone = [i, j];
            
            // Drill state machine
            const state = drillStateRef.current;
            const centerZone = [1, 1]; // Center zone (1,1)
            const isCenterZone = i === centerZone[0] && j === centerZone[1];
            
            if (state === "at_center_waiting_to_start" && !isCenterZone) {
              drillStateRef.current = "moved_to_outer";
              lastZoneRef.current = currentZone;
              cycleStartTimeRef.current = Date.now();
            } else if (state === "moved_to_outer" && isCenterZone) {
              // Valid cycle completed
              validCycleCountRef.current += 1;
              const cycleDuration = (Date.now() - cycleStartTimeRef.current) / 1000;
              
              drillCyclesRef.current.push([centerZone, lastZoneRef.current, centerZone]);
              cycleTimesRef.current.push(cycleDuration);
              
              drillStateRef.current = "at_center_waiting_to_start";
              lastZoneRef.current = null;
              cycleStartTimeRef.current = null;
              
              setDrillStats(prev => ({ ...prev, validCycles: validCycleCountRef.current }));
            }
            
            // Draw zone label on main canvas
            ctx.fillStyle = "#00FFFF";
            ctx.font = "bold 12px sans-serif";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.strokeText(`Zone (${i},${j})`, midX + 10, midY);
            ctx.fillText(`Zone (${i},${j})`, midX + 10, midY);
            
            foundZone = true;
          }
        }
      }
    } catch (error) {
      console.error("Error in perspective transform:", error);
    }
  };

  // --- Handle file upload ---
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const video = videoRef.current;
    
    video.src = url;
    
          video.onended = () => {
        cancelAnimationFrame(rafRef.current);
        showFinalAnalysis();
      };
    
    video.onloadeddata = () => {
      try { video.pause(); } catch {}
      video.currentTime = 0;
      setIsVideoLoaded(true);
      setIsSetupComplete(false);
      resetTracking();
      drawVideoFrame();

      setTimeout(() => {
        drawVideoFrame();
      }, 1000);
    };
  };

  const resetTracking = () => {
    cancelAnimationFrame(rafRef.current);
    setSelectedPoints([]);
    setGridLines([]);
    setIsSetupComplete(false);
    zoneCounterRef.current = Array.from({ length: rows }, () => Array(cols).fill(0));
    drillStateRef.current = "at_center_waiting_to_start";
    lastZoneRef.current = null;
    cycleStartTimeRef.current = null;
    drillCyclesRef.current = [];
    cycleTimesRef.current = [];
    validCycleCountRef.current = 0;
    startTimeRef.current = null;
    trajectoryPointsRef.current = [];
    totalDistanceRef.current = 0;
    frameCountRef.current = 0;
    setDrillStats({
      validCycles: 0,
      totalMoves: 0,
      sessionTime: 0,
      speed: 0,
      totalDistance: 0
    });
    setShowFinalResults(false);
    setFinalAnalysis(null);
    
    // Reset video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    // Clear canvases
    if (mainCanvasRef.current) {
      const ctx = mainCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    }
    if (planeCanvasRef.current) {
      const ctx = planeCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, courtWidth, courtHeight);
    }
    if (heatmapCanvasRef.current) {
      const ctx = heatmapCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, 240, 240);
    }
  };

  // --- Corner point selection ---
  const handleMainCanvasClick = (e) => {
    if (!isVideoLoaded || isSetupComplete) return;

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectedPoints((prev) => {
      if (prev.length >= 4) return prev;
      const next = [...prev, [x, y]];

      setTimeout(() => drawVideoFrame(), 10);

      if (next.length === 4) {
        initHomographiesAndGrid(next);
        setIsSetupComplete(true);
        setTimeout(() => {
          if (videoRef.current) {
            try { videoRef.current.play(); } catch {}
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(loop);
          }
        }, 100);
      }
      return next;
    });
  };

  // --- Initialize homographies ---
  const initHomographiesAndGrid = (pts4) => {
    if (!cvReadyRef.current) {
      console.error("OpenCV not ready!");
      return;
    }
    try {
      const cv = window.cv;
      const [tl, tr, br, bl] = reorderPointsTLTRBRBL(pts4);

      const srcData = [...tl, ...tr, ...br, ...bl];
      const src = cv.matFromArray(4, 1, cv.CV_32FC2, srcData);

      const dstData = [0, 0, courtWidth, 0, courtWidth, courtHeight, 0, courtHeight];
      const dst = cv.matFromArray(4, 1, cv.CV_32FC2, dstData);

      const H = cv.getPerspectiveTransform(src, dst);
      const Hinv = cv.getPerspectiveTransform(dst, src);

      homographyToBirdRef.current = H;
      homographyToOrigRef.current = Hinv;

      src.delete();
      dst.delete();

      // Generate grid lines
      const lines = [];
      const cellW = courtWidth / cols;
      const cellH = courtHeight / rows;
      
      // Vertical lines
      for (let j = 0; j <= cols; j++) {
        const x = j * cellW;
        const pt1 = cv.matFromArray(1, 1, cv.CV_32FC2, [x, 0]);
        const pt2 = cv.matFromArray(1, 1, cv.CV_32FC2, [x, courtHeight]);
        const out1 = new cv.Mat();
        const out2 = new cv.Mat();
        cv.perspectiveTransform(pt1, out1, Hinv);
        cv.perspectiveTransform(pt2, out2, Hinv);
        lines.push([[out1.data32F[0], out1.data32F[1]], [out2.data32F[0], out2.data32F[1]]]);
        pt1.delete(); pt2.delete(); out1.delete(); out2.delete();
      }
      
      // Horizontal lines
      for (let i = 0; i <= rows; i++) {
        const y = i * cellH;
        const pt1 = cv.matFromArray(1, 1, cv.CV_32FC2, [0, y]);
        const pt2 = cv.matFromArray(1, 1, cv.CV_32FC2, [courtWidth, y]);
        const out1 = new cv.Mat();
        const out2 = new cv.Mat();
        cv.perspectiveTransform(pt1, out1, Hinv);
        cv.perspectiveTransform(pt2, out2, Hinv);
        lines.push([[out1.data32F[0], out1.data32F[1]], [out2.data32F[0], out2.data32F[1]]]);
        pt1.delete(); pt2.delete(); out1.delete(); out2.delete();
      }

      setGridLines(lines);
    } catch (error) {
      console.error("Error in initHomographiesAndGrid:", error);
    }
  };

  const drawVideoFrame = () => {
    const canvas = mainCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    try {
      ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H);
    } catch {}
    drawCornerPoints(ctx, selectedPoints);
    drawGridOnContext(ctx, gridLines);
  };

  const showFinalAnalysis = () => {
    // Stop the animation loop
    cancelAnimationFrame(rafRef.current);
    
    const endTime = Date.now();
    const totalTime = startTimeRef.current ? (endTime - startTimeRef.current) / 1000 : 0;
    
    // Calculate zone statistics
    const counts = zoneCounterRef.current;
    let totalMoves = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        totalMoves += counts[i][j];
      }
    }

    const analysis = {
      validCycles: validCycleCountRef.current,
      totalTime: totalTime.toFixed(2),
      totalMoves: totalMoves,
      totalDistance: totalDistanceRef.current.toFixed(2),
      averageSpeed: totalTime > 0 ? (totalDistanceRef.current / totalTime).toFixed(2) : "0",
      drillCycles: drillCyclesRef.current.map((cycle, idx) => ({
        cycle: idx + 1,
        path: cycle,
        duration: cycleTimesRef.current[idx]?.toFixed(2) || "0"
      })),
      zoneStats: counts,
      timestamp: new Date().toLocaleString()
    };

    setFinalAnalysis(analysis);
    setShowFinalResults(true);
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
      
      {/* Animated particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/80">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <a href="/" className="self-start">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-2">
                  <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Back to Home</span>
                </Button>
              </a>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2 rounded-lg bg-primary/20">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-foreground">Drill Tracker</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">AI-powered performance analytics</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-8xl mx-auto">
            
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Powered by Kompte AI
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Advanced <span className="gradient-text">Drill Tracking</span> Platform
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your drill videos for comprehensive AI-powered performance analysis with real-time tracking and detailed insights.
              </p>
            </div>

            {/* Instructions Card */}
            <div className="glass-card p-6 mb-8 border border-white/10 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground">Instructions</h2>
              </div>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">1.</span>
                  Upload a drill training video
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">2.</span>
                  Video pauses on first frame - click 4 court corners: Top-Left → Top-Right → Bottom-Right → Bottom-Left
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">3.</span>
                  After calibration, video plays with drill tracking active
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">4.</span>
                  System detects center-to-outer-zone-to-center movements as valid drill cycles
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">5.</span>
                  Final analysis appears when video ends or manually triggered
                </li>
              </ol>
            </div>

            {/* Controls */}
            <div className="glass-card p-6 mb-8 border border-white/10 shadow-xl">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleFile}
                    className="text-sm text-purple-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-purple-500 file:to-blue-500 file:text-white hover:file:from-purple-600 hover:file:to-blue-600 transition-all duration-300"
                  />
                </div>
                <button 
                  onClick={resetTracking}
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg transition-all duration-300 text-sm font-medium shadow-lg"
                >
                  🔄 Reset Tracking
                </button>
                <button 
                  onClick={showFinalAnalysis} 
                  disabled={!isSetupComplete}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all duration-300 text-sm font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📊 Show Final Analysis
                </button>
                <label className="flex items-center gap-2 text-sm text-purple-200">
                  <input 
                    type="checkbox" 
                    checked={showGrid} 
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded border-purple-500 bg-transparent text-purple-500 focus:ring-purple-500"
                  />
                  Show Grid
                </label>
                <label className="flex items-center gap-2 text-sm text-purple-200">
                  <input 
                    type="checkbox" 
                    checked={showCorners} 
                    onChange={(e) => setShowCorners(e.target.checked)}
                    className="rounded border-purple-500 bg-transparent text-purple-500 focus:ring-purple-500"
                  />
                  Show Corner Points
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${cvReadyRef.current ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-purple-200">OpenCV</span>
                  <span className={`w-2 h-2 rounded-full ${poseRef.current ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-purple-200">Pose</span>
                </div>
              </div>
            </div>

            {/* Live Statistics */}
            <div className="glass-card p-6 mb-8 border border-white/10 shadow-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {drillStats.validCycles}
                  </div>
                  <div className="text-sm text-purple-200">Valid Cycles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {drillStats.speed.toFixed(1)}
                  </div>
                  <div className="text-sm text-purple-200">Speed (m/s)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">
                    {drillStats.totalDistance.toFixed(1)}
                  </div>
                  <div className="text-sm text-purple-200">Distance (m)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {drillStats.sessionTime.toFixed(1)}
                  </div>
                  <div className="text-sm text-purple-200">Time (s)</div>
                </div>
              </div>
            </div>

            {/* Video Views - All in One Line */}
            <div className="grid grid-cols-4 gap-4">
              {/* Main Video View */}
              <div className="col-span-2 glass-card p-4 border border-white/10 shadow-xl" style={{ maxWidth: '700px', maxHeight: '500px' }}>
                <h3 className="text-lg font-semibold text-white mb-4">Main Video View</h3>
                <div className="relative">
                  <video
                    ref={videoRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="hidden"
                    playsInline
                    muted
                  />
                  <canvas
                    ref={mainCanvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    onClick={handleMainCanvasClick}
                    className="w-full h-auto rounded-lg border border-white/20 cursor-pointer shadow-lg"
                    style={{
                      cursor: !isSetupComplete && isVideoLoaded && selectedPoints.length < 4 ? 'crosshair' : 'default',
                      maxWidth: '640px'
                    }}
                  />
                  <div className="absolute top-4 left-4 glass-card px-3 py-2 rounded-lg border border-white/20">
                    <div className="text-sm text-white">
                      {!isVideoLoaded ? "Upload a video to begin" :
                       !isSetupComplete ? `⚠️ Click ${4 - selectedPoints.length} more corner(s): ${
                          ['Top-Left', 'Top-Right', 'Bottom-Right', 'Bottom-Left'][selectedPoints.length] || 'Complete'
                        }` :
                        "✅ Court calibrated — Drill tracking active"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2D Bird's-Eye View */}
              <div className="glass-card p-4 border border-white/10 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4">2D Bird's-Eye View</h3>
                <canvas
                  ref={planeCanvasRef}
                  width={courtWidth}
                  height={courtHeight}
                  className="w-full h-auto rounded-lg border border-white/20 bg-gray-900 shadow-lg"
                />
                <div className="text-sm text-purple-200 text-center mt-2">
                  Green path shows player movement
                </div>
              </div>

              {/* Zone Visit Heatmap */}
              <div className="glass-card p-4 border border-white/10 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Zone Visit Heatmap</h3>
                <canvas
                  ref={heatmapCanvasRef}
                  width={240}
                  height={240}
                  className="w-full h-auto rounded-lg border border-white/20 shadow-lg"
                />
                <div className="text-sm text-purple-200 text-center mt-2">
                  Drill state: {drillStateRef.current?.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>      
      
      {/* Final Analysis Modal */}
      {showFinalResults && finalAnalysis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="glass-card border border-white/10 shadow-xl rounded-2xl p-8 max-w-7xl max-h-[90vh] overflow-auto relative">
            {/* Header with Back and Close */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFinalResults(false)}
                  className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-300"
                >
                  <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                    <span className="text-purple-300">🏆</span>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Drill Analysis Complete
                  </h2>
                </div>
              </div>
              <button 
                onClick={() => setShowFinalResults(false)}
                className="p-2 rounded-lg bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-500/30 hover:from-gray-600/30 hover:to-gray-700/30 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Summary Stats */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                    <span className="text-purple-300">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Session Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glass-card p-4 border border-white/10 text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {finalAnalysis.validCycles}
                    </div>
                    <div className="text-sm text-purple-200">Valid Drill Cycles</div>
                  </div>
                  <div className="glass-card p-4 border border-white/10 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {finalAnalysis.totalTime}s
                    </div>
                    <div className="text-sm text-purple-200">Total Session Time</div>
                  </div>
                  <div className="glass-card p-4 border border-white/10 text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                      {finalAnalysis.totalDistance}m
                    </div>
                    <div className="text-sm text-purple-200">Total Distance</div>
                  </div>
                  <div className="glass-card p-4 border border-white/10 text-center">
                    <div className="text-3xl font-bold text-red-400 mb-1">
                      {finalAnalysis.averageSpeed}
                    </div>
                    <div className="text-sm text-purple-200">Avg Speed (m/s)</div>
                  </div>
                </div>

                {/* Drill Cycles Table */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                    <span className="text-purple-300">🔄</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Drill Cycles</h3>
                </div>
                <div className="glass-card p-4 border border-white/10 max-h-48 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left p-2 text-purple-200 font-medium">Cycle</th>
                        <th className="text-left p-2 text-purple-200 font-medium">Path</th>
                        <th className="text-right p-2 text-purple-200 font-medium">Duration (s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalAnalysis.drillCycles.map((cycle) => (
                        <tr key={cycle.cycle} className="border-b border-white/10">
                          <td className="p-2 font-bold text-blue-400">#{cycle.cycle}</td>
                          <td className="p-2 text-xs text-purple-200">
                            {cycle.path.map(p => `(${p[0]},${p[1]})`).join(' → ')}
                          </td>
                          <td className="p-2 text-right text-green-400">{cycle.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Zone Heatmap */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                    <span className="text-purple-300">🗺️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Zone Visit Heatmap</h3>
                </div>
                <div className="glass-card p-4 border border-white/10">
                  <div className="grid grid-cols-3 gap-1 w-64 h-64 mx-auto">
                    {finalAnalysis.zoneStats.flat().map((count, index) => {
                      const i = Math.floor(index / cols);
                      const j = index % cols;
                      const maxCount = Math.max(...finalAnalysis.zoneStats.flat());
                      const intensity = maxCount > 0 ? count / maxCount : 0;
                      const hue = (1 - intensity) * 240;
                      const percentage = finalAnalysis.totalMoves > 0 ? 
                        ((count / finalAnalysis.totalMoves) * 100).toFixed(1) : "0.0";
                      
                      return (
                        <div
                          key={`${i}-${j}`}
                          className="flex flex-col items-center justify-center rounded-lg p-2 text-center"
                          style={{
                            backgroundColor: `hsl(${hue}, 90%, ${intensity * 40 + 35}%)`,
                            color: intensity > 0.5 ? '#fff' : '#000',
                            minHeight: '60px'
                          }}
                        >
                          <div className="text-sm font-bold">{percentage}%</div>
                          <div className="text-xs">({i},{j})</div>
                          <div className="text-xs">{count} visits</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center mt-4 text-sm text-purple-200">
                    Total Moves: <strong className="text-white">{finalAnalysis.totalMoves}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="glass-card p-6 border border-white/10 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                  <span className="text-purple-300">🎯</span>
                </div>
                <h4 className="text-lg font-semibold text-white">Key Insights</h4>
              </div>
              <div className="space-y-2 text-purple-200">
                <p>
                  <strong className="text-blue-400">Performance:</strong> Completed {finalAnalysis.validCycles} valid drill cycles in {finalAnalysis.totalTime} seconds
                </p>
                <p>
                  <strong className="text-green-400">Movement:</strong> Covered {finalAnalysis.totalDistance}m total distance at an average speed of {finalAnalysis.averageSpeed} m/s
                </p>
                <p>
                  <strong className="text-yellow-400">Efficiency:</strong> {finalAnalysis.validCycles > 0 ? 
                    `Average ${(parseFloat(finalAnalysis.totalTime) / finalAnalysis.validCycles).toFixed(2)} seconds per cycle` : 
                    'No complete cycles detected'}
                </p>
              </div>
              <div className="text-sm text-purple-300 mt-4 pt-4 border-t border-white/10">
                Analysis completed: {finalAnalysis.timestamp}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(finalAnalysis, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `drill-analysis-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all duration-300 text-sm font-medium shadow-lg"
              >
                📊 Export Analysis
              </button>
              <button
                onClick={resetTracking}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all duration-300 text-sm font-medium shadow-lg"
              >
                🔄 New Analysis
              </button>
              <button
                onClick={() => setShowFinalResults(false)}
                className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg transition-all duration-300 text-sm font-medium shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}