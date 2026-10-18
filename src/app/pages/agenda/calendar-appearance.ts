import { CalendarOptions } from 'fullcalendar';

// Apariencia de pages/calender: mismos tokens y tarjetas, sin datos ni callbacks de negocio.
// La cabecera se renderiza en Angular para mantener controles accesibles sin innerHTML.
export const calendarAppearance: CalendarOptions = {
  views: {
    multiMonthYear: {
      aspectRatio: 1.2,
      contentHeight: 'auto',
      height: 'auto',
      multiMonthMaxColumns: 3,
      tableClass: 'overflow-visible! rounded-lg!',
      singleMonthMinWidth: 320,
      showNonCurrentDates: true,
      singleMonthHeaderInnerClass:
        'text-sm font-medium! text-gray-800 dark:text-white/90',
      dayHeaderClass: (data) =>
        data.inPopover
          ? 'relative! border-b! border-gray-200! bg-gray-50/70! px-4! py-3! text-start! dark:border-gray-800! dark:bg-gray-800/50!'
          : 'border-0! bg-gray-50 py-2! dark:bg-gray-900',
      dayHeaderInnerClass: (data) =>
        data.inPopover
          ? 'text-sm! font-semibold! text-gray-800! dark:text-white/90!'
          : 'py-1 text-xs font-medium text-gray-400 uppercase',
      dayCellClass: (data) => {
        if (data.inPopover) return 'bg-transparent! p-3!';
        let cls = 'relative! p-0.5 sm:p-1!';
        if (data.isToday)
          cls += ' isolate bg-gray-100! font-semibold text-brand-500';
        if (data.isOther) cls += ' bg-transparent!';
        return cls;
      },
      dayCellInnerClass: (data) =>
        data.inPopover
          ? 'flex custom-scrollbar max-h-60 flex-col gap-1.5 overflow-y-auto'
          : '',
      dayCellTopInnerClass: 'text-sm!',
      dayMaxEvents: 0,
      rowMoreLinkClass:
        'absolute! -top-1! -start-0.5! z-10! border-0! bg-transparent! p-0!',
      rowMoreLinkInnerClass: 'overflow-visible!',
      moreLinkContent() {
        return {
          html: `<span><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5.5 text-brand-500"><path d="M19 3v17a1 1 0 01-1.496.868l-4.512-2.578a2 2 0 00-1.984 0l-4.512 2.578A1 1 0 015 20V3z" /></svg></span>`,
        };
      },
    },
    dayGridMonth: {
      dayMaxEvents: 2,
      dayHeaderAlign: (data) => (data.inPopover ? 'start' : 'center'),
      dayHeaderClass: (data) =>
        data.inPopover
          ? 'relative! border-b! border-gray-200! bg-gray-50/70! px-4! py-3! text-start! dark:border-gray-800! dark:bg-gray-800/50!'
          : 'border-x-0! border-t border-gray-200! bg-gray-50 dark:border-gray-800! dark:bg-gray-900',
      dayHeaderInnerClass: (data) =>
        data.inPopover
          ? 'text-sm! font-semibold! text-gray-800! dark:text-white/90!'
          : 'px-5! py-4! text-sm font-medium text-gray-400 uppercase',
      dayCellClass: (data) => {
        if (data.inPopover) return 'bg-transparent! p-3!';
        return `bg-transparent! p-2! ${
          data.isToday ? 'bg-gray-100! dark:bg-gray-800/40!' : ''
        }`;
      },
      dayCellInnerClass: (data) => {
        if (data.inPopover)
          return 'flex custom-scrollbar max-h-60 flex-col gap-1.5 overflow-y-auto';
        return data.isToday ? 'rounded-sm!' : '';
      },
      moreLinkClass:
        'border-0! bg-transparent! p-0! hover:bg-transparent! focus:outline-none',
      moreLinkContent(args) {
        return {
          html: `<span class="fc-more-link-badge inline-flex items-center rounded-sm bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25">+${args.num} más</span>`,
        };
      },
    },
    timeGridWeek: {
      slotDuration: '01:00:00',
      slotMinHeight: 56,
      expandRows: true,
      allDaySlot: false,
      dayHeaderFormat: { weekday: 'short', day: 'numeric' },
      dayHeaderClass: (data) =>
        `border-x-0! border-t! border-b! border-gray-200! bg-gray-50! dark:border-gray-800! dark:bg-gray-900! ${
          data.isToday ? 'bg-gray-100/70! dark:bg-gray-800/60!' : ''
        }`,
      dayHeaderInnerClass: (data) =>
        `px-3! py-3.5! text-center! text-xs! font-medium! text-gray-500! uppercase! dark:text-gray-400! ${
          data.isToday ? 'font-semibold! text-brand-500! dark:text-brand-400!' : ''
        }`,
      slotHeaderDividerClass:
        'border-e! border-s-0! border-y-0! border-gray-200! dark:border-gray-800!',
      slotHeaderClass:
        'px-3! py-2! text-start! text-xs! font-medium! text-gray-400! dark:text-gray-500!',
      slotLaneClass: 'border-gray-100! dark:border-gray-800/60!',
      dayLaneClass: (data) =>
        `border-gray-200! dark:border-gray-800! ${
          data.isToday ? 'bg-brand-50/15! dark:bg-brand-500/[0.03]!' : ''
        }`,
      allDayDividerClass:
        'border-b! border-t-0! border-x-0! border-gray-200! p-0! bg-transparent! dark:border-gray-800!',
      allDayHeaderClass:
        'border-0! bg-gray-50! text-xs! font-medium! text-gray-500! dark:border-0! dark:bg-gray-900! dark:text-gray-400!',
    },
    timeGridDay: {
      slotDuration: '00:30:00',
      slotMinHeight: 48,
      expandRows: true,
      allDaySlot: false,
      dayHeaderFormat: { weekday: 'short', day: 'numeric' },
      dayHeaderClass: (data) =>
        `border-x-0! border-t! border-b! border-gray-200! bg-gray-50! dark:border-gray-800! dark:bg-gray-900! ${
          data.isToday ? 'bg-gray-100/70! dark:bg-gray-800/60!' : ''
        }`,
      dayHeaderInnerClass: (data) =>
        `px-4! py-3.5! text-center! text-xs! font-medium! text-gray-500! uppercase! dark:text-gray-400! ${
          data.isToday ? 'font-semibold! text-brand-500! dark:text-brand-400!' : ''
        }`,
      slotHeaderDividerClass:
        'border-e! border-s-0! border-y-0! border-gray-200! dark:border-gray-800!',
      slotHeaderClass:
        'px-3! py-2! text-start! text-xs! font-medium! text-gray-400! dark:text-gray-500!',
      slotLaneClass: 'border-gray-100! dark:border-gray-800/60!',
      dayLaneClass: (data) =>
        `border-gray-200! dark:border-gray-800! ${
          data.isToday ? 'bg-brand-50/15! dark:bg-brand-500/[0.03]!' : ''
        }`,
      allDayDividerClass:
        'border-b! border-t-0! border-x-0! border-gray-200! p-0! bg-transparent! dark:border-gray-800!',
      allDayHeaderClass:
        'border-0! bg-gray-50! text-xs! font-medium! text-gray-500! dark:border-0! dark:bg-gray-900! dark:text-gray-400!',
    },
  },

  borderless: true,
  expandRows: true,
  slotMinHeight: 56,
  slotHeaderDividerClass:
    'border-e! border-s-0! border-y-0! border-gray-200! dark:border-gray-800!',
  allDayDividerClass:
    'border-b! border-t-0! border-x-0! border-gray-200! p-0! bg-transparent! dark:border-gray-800!',
  eventClass: 'focus:shadow-none',
  nowIndicator: false,
  columnEventClass:
    'bg-transparent! border-0! p-1! shadow-none! hover:shadow-none! focus:outline-none',
  columnEventInnerClass: 'p-0! border-0! bg-transparent! h-full',
  tableHeaderSticky: true,
  tableClass: 'overflow-hidden',
  rowEventClass:
    'bg-transparent! border-0! px-1! py-0.5! shadow-none! hover:shadow-none! focus:outline-none',
  rowEventInnerClass: 'p-0! border-0! bg-transparent!',
  popoverFormat: { month: 'short', day: 'numeric', year: 'numeric' },
  popoverClass:
    'z-99999! w-72 max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900',
  popoverCloseClass:
    'absolute end-3 top-2.5 flex size-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
  popoverCloseContent: {
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M18 6L6 18M6 6l12 12" /></svg>`,
  },


};
