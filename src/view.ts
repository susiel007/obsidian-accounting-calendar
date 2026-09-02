import type { Moment } from "moment";
import {
  getDailyNoteSettings,
  getWeeklyNoteSettings,
  IGranularity,
} from "obsidian-daily-notes-interface";
import { FileView, TFile, ItemView, Plugin, WorkspaceLeaf } from "obsidian";

import { TRIGGER_ON_OPEN, VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import type { ISettings } from "src/settings";

import Calendar from "./ui/Calendar.svelte";
import { showFileMenu } from "./ui/fileMenu";
import { activeFile, settings, calPluginSettings, calPluginActiveFile } from "./ui/stores";
import {
  customTagsSource,
  streakSource,
  tasksSource,
  wordCountSource,
} from "./ui/sources";
import { spendingsSource } from "./ui/sources/spendings";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private settings: ISettings;
  private plugin: Plugin;

  constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
    super(leaf);
    this.plugin = plugin;

    this.onClick = this.onClick.bind(this);
    this.onHover = this.onHover.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    this.settings = null;
    settings.subscribe((val) => {
      this.settings = val;

      // Refresh the calendar if settings change
      if (this.calendar) {
        this.calendar.tick();
      }
    });
  }

  getViewType(): string {
    return VIEW_TYPE_CALENDAR;
  }

  getDisplayText(): string {
    return "Calendar";
  }

  getIcon(): string {
    return "calendar-with-checkmark";
  }

  onClose(): Promise<void> {
    if (this.calendar) {
      this.calendar.$destroy();
    }
    return Promise.resolve();
  }

  async onOpen(): Promise<void> {
    // Integration point: external plugins can listen for `calendar:open`
    // to feed in additional sources.
    const sources = [
      customTagsSource,
      streakSource,
      wordCountSource,
      spendingsSource,
      tasksSource,
    ];
    this.app.workspace.trigger(TRIGGER_ON_OPEN, sources);

    this.calendar = new Calendar({
      target: (this as unknown as { contentEl: HTMLElement }).contentEl,
      props: {
        plugin: this.plugin,
        settingsStore: calPluginSettings,
        activeFileStore: calPluginActiveFile,
        onClick: this.onClick,
        onHover: this.onHover,
        onContextMenu: this.onContextMenu,
        sources,
      },
    });
  }

  onClick(
    granularity: IGranularity,
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ): void {
    if (granularity === "day") {
      this.openOrCreateDailyNote(date, existingFile, inNewSplit);
    } else if (granularity === "week") {
      this.openOrCreateWeeklyNote(date, existingFile, inNewSplit);
    }
  }

  onHover(
    granularity: IGranularity,
    date: Moment,
    file: TFile,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    if (granularity === "day") {
      const { format } = getDailyNoteSettings();
      this.app.workspace.trigger(
        "link-hover",
        this,
        targetEl,
        date.format(format),
        file?.path
      );
    } else if (granularity === "week") {
      const { format } = getWeeklyNoteSettings();
      this.app.workspace.trigger(
        "link-hover",
        this,
        targetEl,
        date.format(format),
        file?.path
      );
    }
  }

  onContextMenu(
    granularity: IGranularity,
    date: Moment,
    file: TFile,
    event: MouseEvent
  ): void {
    if (!file) {
      return;
    }
    showFileMenu(this.app, file, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  public onFileOpen(_file: TFile): void {
    if (this.app.workspace.layoutReady) {
      this.updateActiveFile();
    }
  }

  private updateActiveFile(): void {
    const { view } = this.app.workspace.activeLeaf;

    let file = null;
    if (view instanceof FileView) {
      file = view.file;
    }
    activeFile.setFile(file);

    if (this.calendar) {
      this.calendar.tick();
    }
  }

  public revealActiveNote(): void {
    const { moment } = window;
    const { activeLeaf } = this.app.workspace;

    if (activeLeaf.view instanceof FileView) {
      // Check to see if the active note is a daily-note
      let date = window.moment(activeLeaf.view.file.basename, getDailyNoteSettings().format, true);
      if (date.isValid()) {
        this.calendar.$set({ displayedMonth: date });
        return;
      }

      // Check to see if the active note is a weekly-note
      const { format } = getWeeklyNoteSettings();
      date = window.moment(activeLeaf.view.file.basename, format, true);
      if (date.isValid()) {
        this.calendar.$set({ displayedMonth: date });
        return;
      }
    }
  }

  async openOrCreateWeeklyNote(
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const startOfWeek = date.clone().startOf("week");

    if (!existingFile) {
      tryToCreateWeeklyNote(startOfWeek, inNewSplit, this.settings, (file) => {
        activeFile.setFile(file);
      });
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true);
  }

  async openOrCreateDailyNote(
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    if (!existingFile) {
      tryToCreateDailyNote(
        date,
        inNewSplit,
        this.settings,
        (dailyNote: TFile) => {
          activeFile.setFile(dailyNote);
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile, { active: true });

    activeFile.setFile(existingFile);
  }
}
