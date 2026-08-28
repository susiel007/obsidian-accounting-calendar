import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IEvaluatedMetadata, IDot } from "obsidian-calendar-ui";
import type { IGranularity } from "obsidian-daily-notes-interface";

export async function getNumberOfRemainingTasks(note: TFile): Promise<number> {
  if (!note) {
    return 0;
  }

  const { vault } = window.app;
  const fileContents = await vault.cachedRead(note);
  return (fileContents.match(/(-|\*) \[ \]/g) || []).length;
}

export async function getDotsForDailyNote(
  dailyNote: TFile | null
): Promise<IDot[]> {
  if (!dailyNote) {
    return [];
  }
  const numTasks = await getNumberOfRemainingTasks(dailyNote);

  const dots = [];
  if (numTasks) {
    dots.push({
      isFilled: false,
    });
  }
  return dots;
}

export const tasksSource: ICalendarSource = {
  id: "tasks",
  name: "Tasks",
  defaultSettings: {
    color: "default",
    display: "calendar-and-menu",
    order: 2,
  },

  getMetadata: async (
    _granularity: IGranularity,
    _date: Moment,
    file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const dots = await getDotsForDailyNote(file);
    const value = await getNumberOfRemainingTasks(file);
    return {
      dots,
      value,
    };
  },
};
