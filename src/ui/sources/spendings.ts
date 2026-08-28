import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IEvaluatedMetadata } from "obsidian-calendar-ui";
import type { IGranularity } from "obsidian-daily-notes-interface";

export function getSpendingsFromFrontmatter(note: TFile): number {
  if (!note) {
    return 0;
  }
  const cache = window.app.metadataCache.getFileCache(note);
  const spendings = cache?.frontmatter?.spendings;
  return typeof spendings === "number" ? spendings : 0;
}

export const spendingsSource: ICalendarSource = {
  id: "spendings",
  name: "Spendings",
  defaultSettings: {
    color: "default",
    display: "calendar-and-menu",
    order: 3,
  },

  getMetadata: async (
    _granularity: IGranularity,
    _date: Moment,
    file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const value = getSpendingsFromFrontmatter(file);
    return {
      dots: [],
      value: value || null,
    };
  },
};
