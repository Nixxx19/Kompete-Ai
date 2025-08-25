// utils.tsx
import { Chart, ChartConfiguration } from "chart.js";
import {
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineController,
    PieController,
    ArcElement,
} from "chart.js";

Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineController,
    PieController,
    ArcElement
);

interface User {
    name: string;
    age: number;
    weight: number;
    gender: string;
}

interface CanvasIds {
    repsChart?: string;
    poseChart?: string;
    activityChart?: string;
    summaryBox?: string;
}

const charts: {
    repsChart: Chart | null;
    poseChart: Chart | null;
    activityChart: Chart | null;
} = {
    repsChart: null,
    poseChart: null,
    activityChart: null,
};

export function evaluateStamina(
    age: number,
    weight: number,
    reps: number,
    duration: number,
    avgScore: number,
    pauseTime: number
): string {
    let score = 0;
    duration = duration > 0 ? duration : 1;
    const repRate = (reps / duration) * 60;

    if (repRate > 30) score += 2;
    else if (repRate >= 20) score += 1;

    if (avgScore > 0.8) score += 2;
    else if (avgScore >= 0.6) score += 1;

    if (pauseTime < 5) score += 2;
    else if (pauseTime < 10) score += 1;

    if (age < 25) score += 2;
    else if (age <= 35) score += 1;

    if (score >= 8) return "Elite 💎";
    else if (score >= 7) return "Excellent 💪";
    else if (score >= 5) return "Good 🙂";
    else if (score >= 3) return "Average 😐";
    else return "Needs Improvement 😓";
}

export function calculateCaloriesDynamic(
    reps: number,
    durationSec: number,
    weightKg: number,
    age: number,
    gender: string,
    exerciseType: string = "generic"
): number {
    const durationMinutes = durationSec / 60;
    if (durationMinutes === 0) return 0.0;

    let bmr: number;
    if (gender.toLowerCase() === "male" || gender.toLowerCase() === "m") {
        bmr = 10 * weightKg + 6.25 * 170 - 5 * age + 5;
    } else {
        bmr = 10 * weightKg + 6.25 * 160 - 5 * age - 161;
    }

    const caloriesPerMin = bmr / 1440;
    const activityMultiplier: Record<string, number> = {
        jumping_jacks: 8,
        high_knees: 8.5,
        squats: 6.5,
        pushups: 7.0,
        generic: 6.0,
    };

    const multiplier = activityMultiplier[exerciseType.toLowerCase()] || 6.0;
    const totalCalories = caloriesPerMin * durationMinutes * (multiplier / 1.5);
    return parseFloat(totalCalories.toFixed(2));
}

export function printSummary(
    user: User,
    reps: number,
    durationSec: number,
    avgPoseScore: number,
    pauseTime: number,
    exerciseType: string = "generic"
): void {
    const stamina = evaluateStamina(
        user.age,
        user.weight,
        reps,
        durationSec,
        avgPoseScore,
        pauseTime
    );
    const calories = calculateCaloriesDynamic(
        reps,
        durationSec,
        user.weight,
        user.age,
        user.gender,
        exerciseType
    );

    console.log("\n======= 📝 Workout Summary =======");
    console.log(`Name: ${user.name}`);
    console.log(`Age: ${user.age}   Gender: ${user.gender}`);
    console.log(`Weight: ${user.weight} kg`);
    console.log(`Duration: ${durationSec} seconds`);
    console.log(`Repetitions: ${reps}`);
    console.log(`Average Pose Score: ${avgPoseScore.toFixed(2)}`);
    console.log(`Pause Time: ${pauseTime.toFixed(1)} seconds`);
    console.log(`Stamina Level: ${stamina}`);
    console.log(`Calories Burned: ${calories} kcal`);
    console.log("===================================");
}

export function plotWorkoutSummary(
    canvasIds: CanvasIds,
    user: User,
    repsOverTime: number[],
    poseScores: number[],
    totalDuration: number,
    pauseTime: number,
    totalReps: number,
    calories: number,
    staminaLevel: string | number
): void {
    const activeTime = totalDuration - pauseTime;

    if (canvasIds.repsChart) {
        const ctx = document.getElementById(canvasIds.repsChart) as HTMLCanvasElement | null;
        if (ctx) {
            charts.repsChart?.destroy();
            charts.repsChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: repsOverTime.map((_, i) => `T${i + 1}`),
                                            datasets: [
                            {
                                label: "Reps",
                                data: repsOverTime,
                                borderColor: "rgba(34, 197, 94, 1)",
                                backgroundColor: "rgba(34, 197, 94, 0.6)",
                                borderWidth: 1,
                                fill: true,
                                tension: 0.3,
                            },
                        ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: true,
                            labels: {
                                color: 'rgba(255, 255, 255, 1)'
                            }
                        } 
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            stepSize: 1,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.3)',
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            },
                            border: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        },
                        x: { 
                            title: { display: true, text: "Time Segments", color: 'rgba(255, 255, 255, 1)' },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.3)',
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            },
                            border: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        },
                    },
                },
            } as ChartConfiguration);
        }
    }

    if (canvasIds.poseChart) {
        const ctx = document.getElementById(canvasIds.poseChart) as HTMLCanvasElement | null;
        if (ctx) {
            charts.poseChart?.destroy();
            charts.poseChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: poseScores.map((_, i) => `F${i + 1}`),
                            datasets: [
                            {
                                label: "Pose Score",
                                data: poseScores,
                                borderColor: "rgba(236, 72, 153, 1)",
                                backgroundColor: "rgba(236, 72, 153, 0.6)",
                                borderWidth: 0.5,
                                fill: true,
                                tension: 0.3,
                            },
                        ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: true,
                            labels: {
                                color: 'rgba(255, 255, 255, 1)'
                            }
                        } 
                    },
                    scales: {
                        y: { 
                            min: 0, 
                            max: 1, 
                            stepSize: 0.1,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.3)',
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            },
                            border: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        },
                        x: { 
                            title: { display: true, text: "Frames", color: 'rgba(255, 255, 255, 1)' },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.3)',
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            },
                            border: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        },
                    },
                },
            } as ChartConfiguration);
        }
    }

    if (canvasIds.activityChart) {
        const ctx = document.getElementById(canvasIds.activityChart) as HTMLCanvasElement | null;
        if (ctx) {
            charts.activityChart?.destroy();
            charts.activityChart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: ["Active", "Paused"],
                    datasets: [
                        {
                            data: [activeTime, pauseTime],
                            backgroundColor: ["rgba(76, 175, 80, 0.6)", "rgba(255, 112, 67, 0.6)"],
                            borderColor: ["rgba(76, 175, 80, 1)", "rgba(255, 112, 67, 1)"],
                            borderWidth: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: { 
                        legend: { 
                            position: "bottom",
                            labels: {
                                color: 'rgba(255, 255, 255, 1)'
                            }
                        } 
                    },
                },
            } as ChartConfiguration);
        }
    }

    if (canvasIds.summaryBox) {
        const summaryDiv = document.getElementById(canvasIds.summaryBox);
        if (summaryDiv) {
            const poseAvg = poseScores.length
                ? (poseScores.reduce((a, b) => a + b, 0) / poseScores.length).toFixed(2)
                : "0.00";
            summaryDiv.textContent =
                `Name: ${user.name}\n` +
                `Age: ${user.age}   Gender: ${user.gender}\n` +
                `Weight: ${user.weight} kg\n` +
                `Duration: ${totalDuration}s\n` +
                `Repetitions: ${totalReps}\n` +
                `Pose Accuracy (avg): ${poseAvg}\n` +
                `Pause Time: ${pauseTime.toFixed(1)}s\n` +
                `Calories Burned: ${calories} kcal\n` +
                `Stamina Level: ${staminaLevel}`;
        }
    }
}
