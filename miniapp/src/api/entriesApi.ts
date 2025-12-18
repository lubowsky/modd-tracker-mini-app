import axios from "axios";
import { MoodEntry } from "../types/MoodEntry";

export async function fetchEntries(telegramId: number): Promise<MoodEntry[]> {
  const res = await axios.get(
    `http://localhost:3001/entries?telegramId=${telegramId}`
  );
  return res.data.entries;
}
