// ExerciseRouter.jsx
import JumpingJacks from './JumpingJacks';
import PushUps from './Pushup';
import SquatsTracker from "@/components/SquatsTracker.tsx";
import HighKnees from "@/components/HighKnees.tsx";

// import more as needed

const exerciseComponentMap = {
    'Jumping Jacks': JumpingJacks,
    'Push Ups': PushUps,
    'Squats': SquatsTracker,
    'High Knees': HighKnees
    // Add more as needed
};

export default exerciseComponentMap;
