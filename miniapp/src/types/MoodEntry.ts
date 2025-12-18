export interface SleepData {
  quality?: number;
  hours?: number;
  dreamDescription?: string;
}

export interface MoodEntry {
  _id: string;
  timestamp: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";

  sleepData?: SleepData;

  overallPhysical?: number;
  overallMental?: number;

  emotions?: { name: string; intensity: number }[];
  physicalSymptoms?: { name: string; intensity: number }[];

  stressLevel?: number;
  notes?: string;
}
