// backend\models\Entry.js
import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  timestamp: { type: Date, default: Date.now },
  timeOfDay: String,

  sleepData: {
    hours: Number,
    quality: Number,
    dreamDescription: String,
  },

  overallPhysical: Number,
  overallMental: Number,

  physicalSymptoms: [{ name: String, intensity: Number }],
  emotions: [{ name: String, intensity: Number }],

  thoughts: String,
  triggers: [String],
  activities: [String],
  food: String,
  stressLevel: Number,
  notes: String,
  tags: [String],

  source: String,
  notificationSequence: Number,
});

export default mongoose.model('Entry', entrySchema, 'mood_entries');
