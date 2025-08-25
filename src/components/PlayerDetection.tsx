import { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

export default function PlayerDetection() {
 
  const rows = 3;
  const cols = 3;
  const courtWidth = 600;
  const courtHeight = 800;
  const tolerance = 10;


  const CANVAS_W = 640;
  const CANVAS_H = 360;

  const videoRef = useRef(null);
  const mainCanvasRef = useRef(null);     // shows video + grid + bbox
  const planeCanvasRef = useRef(null);    // 2D plane view (court)
  const heatmapCanvasRef = useRef(null);  // simple heatmap of zone counts
  const rafRef = useRef(0);

  const [selectedPoints, setSelectedPoints] = useState([]); // [[x,y], ...] length=4
  const [gridLines, setGridLines] = useState([]); // [ [ [x1,y1],[x2,y2] ], ... ] in original frame coords
  const [showGrid, setShowGrid] = useState(true);
  const [showCorners, setShowCorners] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Final heatmap state
  const [showFinalHeatmap, setShowFinalHeatmap] = useState(false);
  const [finalStats, setFinalStats] = useState(null);

  const cvReadyRef = useRef(false);
  const poseRef = useRef(null);
  const homographyToBirdRef = useRef(null); // cv.Mat 3x3
  const homographyToOrigRef = useRef(null); // cv.Mat 3x3

  // Zone counting
  const cellW = courtWidth / cols;
  const cellH = courtHeight / rows;
  const zoneCounterRef = useRef(Array.from({ length: rows }, () => Array(cols).fill(0)));
  const totalMovesRef = useRef(0);

  // Processing lock to avoid pose backlog
  const isProcessingRef = useRef(false);

  // Video end tracking
  const videoEndedRef = useRef(false);

  // --- Final Statistics Functions ---
  const calculateFinalStats = () => {
    const counts = zoneCounterRef.current;
    const total = Math.max(totalMovesRef.current, 1);
    
    let stats = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const count = counts[i][j];
        const percentage = ((count / total) * 100).toFixed(1);
        stats.push({
          row: i,
          col: j,
          count: count,
          percentage: parseFloat(percentage),
          zone: `(${i},${j})`
        });
      }
    }
    
    // Sort by percentage (highest first)
    stats.sort((a, b) => b.percentage - a.percentage);
    
    return {
      totalMoves: total,
      zoneStats: stats,
      timestamp: new Date().toLocaleString()
    };
  };

  const drawFinalHeatmap = (canvas, stats) => {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Get max percentage for color scaling
    const maxPercentage = Math.max(...stats.zoneStats.map(s => s.percentage));
    
    const cellWpx = w / cols;
    const cellHpx = h / rows;

    // Draw cells with colors based on percentage
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const stat = stats.zoneStats.find(s => s.row === i && s.col === j);
        const percentage = stat ? stat.percentage : 0;
        
        // Color intensity based on percentage
        const intensity = maxPercentage > 0 ? percentage / maxPercentage : 0;
        const hue = (1 - intensity) * 240; // Blue to Red
        const saturation = 90;
        const lightness = intensity * 50 + 25; // 25% to 75%
        
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(j * cellWpx, i * cellHpx, cellWpx, cellHpx);

        // Draw percentage text
        ctx.fillStyle = intensity > 0.6 ? "#fff" : "#000";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${percentage}%`, 
          j * cellWpx + cellWpx / 2, 
          i * cellHpx + cellHpx / 2 - 8
        );
        
        // Draw move count below percentage
        ctx.font = "12px sans-serif";
        ctx.fillText(
          `(${stat ? stat.count : 0} moves)`, 
          j * cellWpx + cellWpx / 2, 
          i * cellHpx + cellHpx / 2 + 10
        );
      }
    }

    // Draw grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
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
  };

  const showFinalResults = () => {
    const stats = calculateFinalStats();
    setFinalStats(stats);
    setShowFinalHeatmap(true);
  };

  const closeFinalHeatmap = () => {
    setShowFinalHeatmap(false);
  };

  // --- Helpers ---
  function reorderPointsTLTRBRBL(pts) {
    // pts: [[x,y], ...] length 4
    const arr = pts.map(p => [p[0], p[1]]);
    const sums = arr.map(([x, y]) => x + y);
    const diffs = arr.map(([x, y]) => x - y);

    const tl = arr[sums.indexOf(Math.min(...sums))];
    const br = arr[sums.indexOf(Math.max(...sums))];
    const tr = arr[diffs.indexOf(Math.max(...diffs))];
    const bl = arr[diffs.indexOf(Math.min(...diffs))];

    return [tl, tr, br, bl];
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

  function drawPlaneGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgb(80,80,80)";
    ctx.lineWidth = 1;
    for (let i = 1; i < rows; i++) {
      const y = Math.round(i * cellH);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(courtWidth, y);
      ctx.stroke();
    }
    for (let j = 1; j < cols; j++) {
      const x = Math.round(j * cellW);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, courtHeight);
      ctx.stroke();
    }
    ctx.restore();
  }

  function updateHeatmapCanvas() {
    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const counts = zoneCounterRef.current;
    let maxCount = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        maxCount = Math.max(maxCount, counts[i][j]);
      }
    }
    const total = Math.max(totalMovesRef.current, 1);

    const cellWpx = w / cols;
    const cellHpx = h / rows;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const c = counts[i][j];
        const p = c / maxCount || 0; // normalize 0..1
        const hue = (1 - p) * 240; // 240 (blue) → 0 (red)
        ctx.fillStyle = `hsl(${hue}, 90%, ${p * 40 + 35}%)`;
        ctx.fillRect(j * cellWpx, i * cellHpx, cellWpx, cellHpx);

        // Percent label
        const pct = ((c / total) * 100).toFixed(1);
        ctx.fillStyle = p > 0.5 ? "#fff" : "#000";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${pct}%`, j * cellWpx + cellWpx / 2, i * cellHpx + cellHpx / 2);
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

  // --- Initialize OpenCV + Pose once ---
  useEffect(() => {
    let cancelled = false;

    const checkOpenCV = () => {
      return window.cv && window.cv.Mat && typeof window.cv.getPerspectiveTransform === 'function';
    };

    async function tryInit() {
      if (cancelled) return;

      // Wait for OpenCV to be fully loaded
      if (!checkOpenCV()) {
        setTimeout(tryInit, 100);
        return;
      }

      cvReadyRef.current = true;

      // Init MediaPipe Pose with proper configuration
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

      // Try default video, but allow user upload too
      const video = videoRef.current;
      if (!video) return;

      // Start paused on first frame for corner selection
      const startPaused = () => {
        try { video.pause(); } catch {}
        video.currentTime = 0;
        setIsVideoLoaded(true);
        setIsSetupComplete(false);
        drawVideoFrame();
      };

      // If a default video exists in /public
      // video.src = "/Video2.mp4"; // optional — change/remove if you want upload-only
      video.onloadeddata = () => startPaused();
    }

    // Load OpenCV script dynamically if not already loaded
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

  // Effect for drawing final heatmap
  useEffect(() => {
    if (showFinalHeatmap && finalStats) {
      const canvas = document.getElementById('finalHeatmapCanvas');
      if (canvas) {
        drawFinalHeatmap(canvas, finalStats);
      }
    }
  }, [showFinalHeatmap, finalStats]);

  // --- Main RAF loop: send frames to Pose (every frame, with lock) ---
  const loop = async () => {
    const video = videoRef.current;
    const canvas = mainCanvasRef.current;
    if (!video || video.readyState < 2 || !canvas || !poseRef.current) {
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

  // --- Handle Pose results: draw + update ---
  const handlePoseResults = (results) => {
    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext("2d");

    // Draw current video frame
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(results.image, 0, 0, CANVAS_W, CANVAS_H);

    // Selected corner points and projected grid
    drawCornerPoints(ctx, selectedPoints);
    drawGridOnContext(ctx, gridLines);

    // Draw pose landmarks (optional visual aid)
    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS);
      drawLandmarks(ctx, results.poseLandmarks, { radius: 2 });

      const xs = results.poseLandmarks.map((lm) => lm.x * CANVAS_W);
      const ys = results.poseLandmarks.map((lm) => lm.y * CANVAS_H);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const midX = (minX + maxX) / 2;
      const midY = (maxY + maxY) / 2; // true center (corrected)

      // Draw bbox + center
      ctx.save();
      ctx.strokeStyle = "#FFFF00"; // yellow
      ctx.lineWidth = 2;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      ctx.fillStyle = "#FF00FF"; // magenta
      ctx.beginPath();
      ctx.arc(midX, midY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // If homography ready → map to bird's eye, update zone counters, draw plane view
      if (cvReadyRef.current && homographyToBirdRef.current) {
        try {
          const cv = window.cv;
          const src = cv.matFromArray(1, 1, cv.CV_32FC2, [midX, midY]);
          const dst = new cv.Mat();
          cv.perspectiveTransform(src, dst, homographyToBirdRef.current);
          const wx = Math.max(0, Math.min(courtWidth - 1, Math.round(dst.data32F[0])));
          const wy = Math.max(0, Math.min(courtHeight - 1, Math.round(dst.data32F[1])));
          src.delete(); dst.delete();

          // Zone detection with tolerance
          let found = false;
          for (let i = 0; i < rows && !found; i++) {
            for (let j = 0; j < cols && !found; j++) {
              const x1 = j * cellW - tolerance;
              const x2 = (j + 1) * cellW + tolerance;
              const y1 = i * cellH - tolerance;
              const y2 = (i + 1) * cellH + tolerance;
              if (wx >= x1 && wx < x2 && wy >= y1 && wy < y2) {
                zoneCounterRef.current[i][j] += 1;
                totalMovesRef.current += 1;
                // Label on main canvas
                ctx.save();
                ctx.fillStyle = "#FFFF00";
                ctx.font = "14px sans-serif";
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 3;
                ctx.strokeText(`Zone (${i},${j})`, midX + 10, midY);
                ctx.fillText(`Zone (${i},${j})`, midX + 10, midY);
                ctx.restore();
                found = true;
              }
            }
          }

          // Draw plane view (dark background)
          const pCanvas = planeCanvasRef.current;
          if (pCanvas) {
            const pctx = pCanvas.getContext("2d");
            pctx.fillStyle = "rgb(30,30,30)";
            pctx.fillRect(0, 0, courtWidth, courtHeight);
            drawPlaneGrid(pctx);
            // cyan player dot
            pctx.fillStyle = "#00FFFF";
            pctx.beginPath();
            pctx.arc(wx, wy, 10, 0, Math.PI * 2);
            pctx.fill();
          }

          // Update heatmap each frame
          updateHeatmapCanvas();
        } catch (error) {
          console.error("Error in perspective transform:", error);
        }
      }
    }
  };

  // --- Click to add corner points on first frame (like Python) ---
  const handleMainCanvasClick = (e) => {
    // Only allow clicking if video is loaded but setup not complete
    if (!isVideoLoaded || isSetupComplete) return;

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectedPoints((prev) => {
      if (prev.length >= 4) return prev;
      const next = [...prev, [x, y]];

      // Redraw frame with new point immediately
      setTimeout(() => drawVideoFrame(), 10);

      if (next.length === 4) {
        initHomographiesAndGrid(next);
        setIsSetupComplete(true);
        // Start video playback after corner selection
        setTimeout(() => {
          if (videoRef.current) {
            try { videoRef.current.play(); } catch {}
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(loop);
          }
        }, 1000);
      }
      return next;
    });
  };

  // --- Build homographies & projected grid lines (OpenCV.js) ---
  const initHomographiesAndGrid = (pts4) => {
    if (!cvReadyRef.current) {
      console.error("OpenCV not ready!");
      return;
    }
    try {
      const cv = window.cv;
      const [tl, tr, br, bl] = reorderPointsTLTRBRBL(pts4);

      // src: original image points (4x1xCV_32FC2)
      const srcData = [...tl, ...tr, ...br, ...bl];
      const src = cv.matFromArray(4, 1, cv.CV_32FC2, srcData);

      // dst: court plane (0,0),(W,0),(W,H),(0,H)
      const dstData = [0, 0, courtWidth, 0, courtWidth, courtHeight, 0, courtHeight];
      const dst = cv.matFromArray(4, 1, cv.CV_32FC2, dstData);

      // H to bird's-eye, and inverse to original
      const H = cv.getPerspectiveTransform(src, dst);
      const Hinv = cv.getPerspectiveTransform(dst, src);

      homographyToBirdRef.current = H;
      homographyToOrigRef.current = Hinv;

      src.delete();
      dst.delete();

      // Precompute grid lines in original frame by warping court grid edges back
      const lines = [];
      // verticals (x = j*cellW, y from 0..H)
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
      // horizontals (y = i*cellH, x from 0..W)
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

  // --- Load a local file and show first frame for corner selection ---
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const video = videoRef.current;
    
    video.src = url;
    
    // Add video ended event listener
    video.onended = () => {
      videoEndedRef.current = true;
      const stats = calculateFinalStats();
      setFinalStats(stats);
      setShowFinalHeatmap(true);
      console.log("Video ended - Final stats:", stats);
    };
    
    video.onloadeddata = () => {
      try { video.pause(); } catch {}
      video.currentTime = 0;
      setIsVideoLoaded(true);
      setIsSetupComplete(false);
      // reset everything for new video
      setShowFinalHeatmap(false);
      setFinalStats(null);
      videoEndedRef.current = false;
      setSelectedPoints([]);
      setGridLines([]);
      zoneCounterRef.current = Array.from({ length: rows }, () => Array(cols).fill(0));
      totalMovesRef.current = 0;
      cancelAnimationFrame(rafRef.current);
      
      setTimeout(() => {
        drawVideoFrame();
      }, 1000);
    };
  };

  // Draw video frame with overlays (used for first frame display)
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

  // Reset and restart video (keeps playback running but clears selections)
  const resetCornerPoints = () => {
    setSelectedPoints([]);
    setGridLines([]);
    zoneCounterRef.current = Array.from({ length: rows }, () => Array(cols).fill(0));
    totalMovesRef.current = 0;
    setShowFinalHeatmap(false);
    setFinalStats(null);
    videoEndedRef.current = false;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      try { videoRef.current.pause(); } catch {}
      setIsSetupComplete(false);
      drawVideoFrame();
    }
  };

  // --- UI ---
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <h2>Player Detection — React + MediaPipe + OpenCV.js</h2>

      <div style={{
        padding: "12px",
        backgroundColor: "#f0f8ff",
        borderRadius: 8,
        marginBottom: 16,
        border: "1px solid #ddd"
      }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>📋 Instructions:</h4>
        <ol style={{ lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
          <li>Upload a video (or place <code>Video2.mp4</code> in <code>public/</code>).</li>
          <li>It will pause on the first frame for calibration.</li>
          <li><strong>Click 4 corners in order:</strong> Top-Left → Top-Right → Bottom-Right → Bottom-Left.</li>
          <li>After the 4th corner, video starts playing with tracking + overlays.</li>
          <li>Final analysis modal appears automatically when video ends, or click "Show Final Results" button.</li>
        </ol>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" accept="video/*" onChange={handleFile} />
        <button onClick={resetCornerPoints} style={{ padding: '8px 16px', borderRadius: 4 }}>
          Reset Corner Points
        </button>
        <button 
          onClick={showFinalResults} 
          style={{ padding: '8px 16px', borderRadius: 4 }}
          disabled={totalMovesRef.current === 0}
        >
          Show Final Results
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          Show Grid
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={showCorners} onChange={(e) => setShowCorners(e.target.checked)} />
          Show Corner Points
        </label>
        <div style={{ fontSize: 12, color: "#666" }}>
          OpenCV: {cvReadyRef.current ? "✅" : "❌"} &nbsp;|&nbsp; Pose: {poseRef.current ? "✅" : "❌"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h4 style={{ margin: "8px 0" }}>Main Video View</h4>
          <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H }}>
            <video
              ref={videoRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ display: "none" }}
              playsInline
              muted
              // loop
            />
            <canvas
              ref={mainCanvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onClick={handleMainCanvasClick}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                cursor: !isSetupComplete && isVideoLoaded && selectedPoints.length < 4 ? 'crosshair' : 'default'
              }}
            />
            <div style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(0,0,0,0.8)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              maxWidth: 280
            }}>
              {!isVideoLoaded ? "Upload a video to begin" :
               !isSetupComplete ? `⚠️ Click ${4 - selectedPoints.length} more corner(s): ${
                  ['Top-Left', 'Top-Right', 'Bottom-Right', 'Bottom-Left'][selectedPoints.length] || 'Complete'
                }` :
                "✅ Court calibrated — Tracking active"}
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ margin: "8px 0" }}>2D Plane View</h4>
          <canvas
            ref={planeCanvasRef}
            width={courtWidth}
            height={courtHeight}
            style={{ width: 300, height: 400, border: "1px solid #ccc", borderRadius: 8, background: "#1e1e1e" }}
          />
        </div>

        <div>
          <h4 style={{ margin: "8px 0" }}>Zone Heatmap</h4>
          <canvas
            ref={heatmapCanvasRef}
            width={240}
            height={240}
            style={{ border: "1px solid #ccc", borderRadius: 8 }}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: "#444" }}>
            Total moves: {totalMovesRef.current}
          </div>
        </div>
      </div>

      {/* Final Analysis Modal */}
      {showFinalHeatmap && finalStats && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 24,
            maxWidth: "90vw",
            maxHeight: "90vh",
            overflow: "auto",
            position: "relative"
          }}>
            {/* Close button */}
            <button 
              onClick={closeFinalHeatmap}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#666"
              }}
            >
              ×
            </button>

            <h2 style={{ textAlign: "center", marginBottom: 16, color: "#333" }}>
              🏆 Final Analysis Results
            </h2>
            
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
              {/* Final Heatmap */}
              <div>
                <h3 style={{ margin: "0 0 16px 0", textAlign: "center" }}>Zone Heatmap</h3>
                <canvas
                  id="finalHeatmapCanvas"
                  width={360}
                  height={360}
                  style={{ 
                    border: "2px solid #ddd", 
                    borderRadius: 8,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                  }}
                />
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 14, color: "#666" }}>
                  Total Moves: <strong>{finalStats.totalMoves}</strong>
                </div>
              </div>

              {/* Statistics Table */}
              <div style={{ minWidth: 300 }}>
                <h3 style={{ margin: "0 0 16px 0" }}>Zone Statistics</h3>
                <div style={{ maxHeight: 300, overflow: "auto" }}>
                  <table style={{ 
                    width: "100%", 
                    borderCollapse: "collapse",
                    fontSize: 14
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f5f5f5" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #ddd" }}>
                          Rank
                        </th>
                        <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #ddd" }}>
                          Zone
                        </th>
                        <th style={{ padding: "8px 12px", textAlign: "right", border: "1px solid #ddd" }}>
                          Moves
                        </th>
                        <th style={{ padding: "8px 12px", textAlign: "right", border: "1px solid #ddd" }}>
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalStats.zoneStats.map((stat, index) => (
                        <tr key={`${stat.row}-${stat.col}`} style={{
                          backgroundColor: stat.percentage > 0 ? 
                            `hsl(${(1 - stat.percentage / Math.max(...finalStats.zoneStats.map(s => s.percentage))) * 240}, 20%, 95%)` : 
                            "white"
                        }}>
                          <td style={{ padding: "8px 12px", border: "1px solid #ddd", fontWeight: "bold" }}>
                            #{index + 1}
                          </td>
                          <td style={{ padding: "8px 12px", border: "1px solid #ddd" }}>
                            Zone {stat.zone}
                          </td>
                          <td style={{ padding: "8px 12px", border: "1px solid #ddd", textAlign: "right" }}>
                            {stat.count}
                          </td>
                          <td style={{ padding: "8px 12px", border: "1px solid #ddd", textAlign: "right", fontWeight: "bold" }}>
                            {stat.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Summary */}
                <div style={{ marginTop: 16, padding: 12, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    Analysis completed: {finalStats.timestamp}
                  </div>
                  <div style={{ fontSize: 14 }}>
                    <strong>Most visited zone:</strong> Zone {finalStats.zoneStats[0]?.zone} 
                    ({finalStats.zoneStats[0]?.percentage}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: 16, 
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid #eee"
            }}>
              <button
                onClick={() => {
                  // Export functionality - could save data as JSON
                  const dataStr = JSON.stringify(finalStats, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `player-analysis-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                📊 Export Data
              </button>
              <button
                onClick={closeFinalHeatmap}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
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