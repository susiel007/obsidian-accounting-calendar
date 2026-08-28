<svelte:options immutable />

<script lang="ts">
  import type { Moment } from "moment";
  import type { Plugin } from "obsidian";
  import type { IGranularity } from "obsidian-daily-notes-interface";
  import type { TFile } from "obsidian";
  import CalendarBase from "../obsidian-calendar-ui/src/components/Calendar.svelte";
  import { configureGlobalMomentLocale } from "../obsidian-calendar-ui/src/localization";
  import type { ICalendarSource, ISourceSettings } from "../obsidian-calendar-ui/src/types";
  import { onDestroy } from "svelte";

  import type { ISettings } from "src/settings";
  import type { Writable } from "svelte/store";

  export let settingsStore: Writable<ISettings>;
  export let activeFileStore: Writable<string>;

  let today: Moment;

  $: today = getToday($settingsStore);

  export let displayedMonth: Moment = today;
  export let sources: ICalendarSource[];
  export let plugin: Plugin;

  export let onHover: (
    granularity: IGranularity,
    date: Moment,
    file: TFile,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ) => boolean;
  export let onClick: (
    granularity: IGranularity,
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ) => boolean;
  export let onContextMenu: (
    granularity: IGranularity,
    date: Moment,
    file: TFile,
    event: MouseEvent
  ) => boolean;

  export function tick() {
    today = window.moment();
  }

  function getToday(settings: ISettings): Moment {
    configureGlobalMomentLocale(settings.localeOverride, settings.weekStart);
    return window.moment();
  }

  function getSourceSettings(sourceId: string): ISourceSettings {
    const source = sources.find((s) => s.id === sourceId);
    if (source) {
      return source.defaultSettings as unknown as ISourceSettings;
    }
    return { color: "default", display: "calendar-and-menu", order: 0 };
  }

  // 1 minute heartbeat to keep `today` reflecting the current day
  let heartbeat = setInterval(() => {
    tick();

    const isViewingCurrentMonth = displayedMonth.isSame(today, "day");
    if (isViewingCurrentMonth) {
      displayedMonth = today;
    }
  }, 1000 * 60);

  onDestroy(() => {
    clearInterval(heartbeat);
  });
</script>

<CalendarBase
  {plugin}
  {sources}
  {today}
  eventHandlers={{ onClick, onHover, onContextMenu }}
  {getSourceSettings}
  bind:displayedMonth
  localeData={today.localeData()}
  selectedId={$activeFileStore}
  showWeekNums={$settingsStore.showWeeklyNote}
/>
