import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, index: true },
  firstName: String,
  lastName: String,
  username: String,
  createdAt: Date,
  settings: {
    timezone: String,
    morningNotification: String,
    eveningNotification: String,
    notificationsEnabled: Boolean,
    daytimeNotifications: Boolean,
    lastDaytimeNotification: Date,
    homeName: String
  }
});

export default mongoose.model('User', userSchema, 'users');
