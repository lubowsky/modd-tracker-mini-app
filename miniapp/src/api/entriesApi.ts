import axios from "axios";
import { MoodEntry } from "../types/MoodEntry";

export async function fetchEntries(telegramId: number): Promise<MoodEntry[]> {
  const API_URL = import.meta.env.VITE_API_URL;
  const res = await axios.get(
    `${API_URL}/entries?telegramId=${telegramId}`
  );
  return res.data.entries;
}
