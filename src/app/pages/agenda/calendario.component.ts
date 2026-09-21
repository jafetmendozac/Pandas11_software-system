import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectInfo, EventClickInfo, EventInput } from 'fullcalendar';
import interactionPlugin from 'fullcalendar/interaction';
import esLocale from 'fullcalendar/locales/es';
import themePlugin from 'fullcalendar/themes/classic';
import timeGridPlugin from 'fullcalendar/timegrid';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import {
  AppointmentInput,
  AppointmentWithRelations,
  AppointmentsService,
  ClientOption,
  EmployeeOption,
  PetOption,
  ServiceOption,
} from '../../shared/services/appointments.service';

export interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    appointment?: AppointmentWithRelations;
  };
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    ModalComponent
  ],
  templateUrl: './calendario.component.html',
  styles: ``
})
export class CalendarioComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  events: CalendarEvent[] = [];
  selectedEvent: CalendarEvent | null = null;
  eventTitle = '';
  eventStartDate = '';
  eventEndDate = '';
  eventLevel = 'Primary';
  selectedClientId = '';
  selectedPetId = '';
  selectedEmployeeId = '';
  selectedServiceIds: string[] = [];
  status = 'scheduled';
  clients: ClientOption[] = [];
  pets: PetOption[] = [];
  filteredPets: PetOption[] = [];
  employees: EmployeeOption[] = [];
  services: ServiceOption[] = [];
  isSaving = false;
  errorMessage = '';
  isOpen = false;

  currentView = 'timeGridWeek';

  viewOptions = [
    { key: 'timeGridWeek', label: 'Semana' },
    { key: 'timeGridDay', label: 'Día' },
  ];

  calendarsEvents = [
    { key: 'Danger', label: 'Peligro', value: 'danger' },
    { key: 'Success', label: 'Éxito', value: 'success' },
    { key: 'Primary', label: 'Principal', value: 'primary' },
    { key: 'Warning', label: 'Advertencia', value: 'warning' }
  ];

  calendarOptions!: CalendarOptions;

  constructor(
    private readonly elRef: ElementRef,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  ngOnInit() {
    const isRtl = document.documentElement.dir === 'rtl';
    const locale = document.documentElement.lang || 'es';
    void this.loadInitialData();

    this.calendarOptions = {
      plugins: [
        themePlugin,
        timeGridPlugin,
        interactionPlugin,
      ],
      initialView: 'timeGridWeek',
      locale: esLocale,
      allDayText: 'Todo el día',
      direction: isRtl ? 'rtl' : 'ltr',

      // Toolbar Header configuration
      headerToolbar: {
        start: 'prev,next addEventButton',
        center: 'title',
        end: ''
      },
      headerToolbarClass:
        'sticky top-0! flex-col gap-4 z-20! [padding-inline:24px]! pt-6 sm:flex-row',
      toolbarTitleClass: 'text-lg! font-medium! text-gray-800 dark:text-white/90',
      toolbarSectionClass: 'ta-toolbar-section',
      buttonGroupClass: 'gap-2',

      buttons: {
        prev: {
          iconContent: {
            html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-6 bg-transparent text-gray-700 rtl:rotate-180 dark:text-gray-400"><path d="M15 18l-6-6 6-6" /></svg>`,
          },
          className:
            'flex size-10! p-0! items-center justify-center! rounded-lg! border! bg-transparent! border-gray-200! text-gray-700 hover:border-gray-200 hover:bg-gray-50! focus:shadow-none active:border-gray-200! active:bg-transparent! active:shadow-none! dark:border-gray-800! dark:text-gray-400 dark:hover:border-gray-800 dark:hover:bg-gray-900! dark:active:border-gray-800!',
        },
        next: {
          iconContent: {
            html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-6 bg-transparent text-gray-700 rtl:rotate-180 dark:text-gray-400"><path d="M9 18l6-6-6-6" /></svg>`,
          },
          className:
            'flex size-10! p-0! items-center justify-center! rounded-lg! border! bg-transparent! border-gray-200! text-gray-700 hover:border-gray-200 hover:bg-gray-50! focus:shadow-none active:border-gray-200! active:bg-transparent! active:shadow-none! dark:border-gray-800! dark:text-gray-400 dark:hover:border-gray-800 dark:hover:bg-gray-900! dark:active:border-gray-800!',
        },
        addEventButton: {
          text: 'Añadir cita +',
          click: () => this.handleOpenAddModal(),
          className:
            'rounded-lg! border-0! bg-brand-500! px-4! py-2.5! text-sm! font-medium! text-white hover:bg-brand-600! focus:shadow-none! w-auto!',
        },
      },

      // View configurations
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
          dayHeaderClass: (data: any) =>
            data.inPopover
              ? 'relative! border-b! border-gray-200! bg-gray-50/70! px-4! py-3! text-start! dark:border-gray-800! dark:bg-gray-800/50!'
              : 'border-0! bg-gray-50 py-2! dark:bg-gray-900',
          dayHeaderInnerClass: (data: any) =>
            data.inPopover
              ? 'text-sm! font-semibold! text-gray-800! dark:text-white/90!'
              : 'py-1 text-xs font-medium text-gray-400 uppercase',
          dayCellClass: (data: any) => {
            if (data.inPopover) return 'bg-transparent! p-3!';
            let cls = 'relative! p-0.5 sm:p-1!';
            if (data.isToday)
              cls += ' isolate bg-gray-100! font-semibold text-brand-500';
            if (data.isOther) cls += ' bg-transparent!';
            return cls;
          },
          dayCellInnerClass: (data: any) =>
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
          dayHeaderAlign: (data: any) => (data.inPopover ? 'start' : 'center'),
          dayHeaderClass: (data: any) =>
            data.inPopover
              ? 'relative! border-b! border-gray-200! bg-gray-50/70! px-4! py-3! text-start! dark:border-gray-800! dark:bg-gray-800/50!'
              : 'border-x-0! border-t border-gray-200! bg-gray-50 dark:border-gray-800! dark:bg-gray-900',
          dayHeaderInnerClass: (data: any) =>
            data.inPopover
              ? 'text-sm! font-semibold! text-gray-800! dark:text-white/90!'
              : 'px-5! py-4! text-sm font-medium text-gray-400 uppercase',
          dayCellClass: (data: any) => {
            if (data.inPopover) return 'bg-transparent! p-3!';
            return `bg-transparent! p-2! ${
              data.isToday ? 'bg-gray-100! dark:bg-gray-800/40!' : ''
            }`;
          },
          dayCellInnerClass: (data: any) => {
            if (data.inPopover)
              return 'flex custom-scrollbar max-h-60 flex-col gap-1.5 overflow-y-auto';
            return data.isToday ? 'rounded-sm!' : '';
          },
          moreLinkClass:
            'border-0! bg-transparent! p-0! hover:bg-transparent! focus:outline-none',
          moreLinkContent(args: any) {
            return {
              html: `<span class="fc-more-link-badge inline-flex items-center rounded-sm bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25">+${args.num} more</span>`,
            };
          },
        },
        timeGridWeek: {
          slotDuration: '01:00:00',
          slotMinTime: '6:00:00',
          slotMaxTime: '19:00:00',
          slotHeaderFormat: { hour: 'numeric', hour12: true },
          slotMinHeight: 80,
          expandRows: true,
          allDaySlot: true,
          dayHeaderContent: (arg: any) => {
            const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
              .format(arg.date)
              .toUpperCase();
            const day = new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(arg.date);
            return `${weekday} - ${day}`;
          },
          dayHeaderClass: (data: any) =>
            `border-x-0! border-t! border-b! border-gray-200! bg-gray-50! dark:border-gray-800! dark:bg-gray-900! ${
              data.isToday ? 'bg-gray-100/70! dark:bg-gray-800/60!' : ''
            }`,
          dayHeaderInnerClass: (data: any) =>
            `px-3! py-3.5! text-center! text-xs! font-medium! text-gray-500! uppercase! dark:text-gray-400! ${
              data.isToday ? 'font-semibold! text-brand-500! dark:text-brand-400!' : ''
            }`,
          slotHeaderDividerClass:
            'border-e! border-s-0! border-y-0! border-gray-200! dark:border-gray-800!',
          slotHeaderClass:
            'px-3! py-2! text-start! text-xs! font-medium! text-gray-400! dark:text-gray-500!',
          slotLaneClass: 'border-gray-100! dark:border-gray-800/60!',
          dayLaneClass: (data: any) =>
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
          slotHeaderFormat: { hour: 'numeric', hour12: true },
          slotMinHeight: 48,
          expandRows: true,
          allDaySlot: true,
          dayHeaderContent: (arg: any) => {
            const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
              .format(arg.date)
              .toUpperCase();
            const day = new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(arg.date);
            return `${weekday} - ${day}`;
          },
          dayHeaderClass: (data: any) =>
            `border-x-0! border-t! border-b! border-gray-200! bg-gray-50! dark:border-gray-800! dark:bg-gray-900! ${
              data.isToday ? 'bg-gray-100/70! dark:bg-gray-800/60!' : ''
            }`,
          dayHeaderInnerClass: (data: any) =>
            `px-4! py-3.5! text-center! text-xs! font-medium! text-gray-500! uppercase! dark:text-gray-400! ${
              data.isToday ? 'font-semibold! text-brand-500! dark:text-brand-400!' : ''
            }`,
          slotHeaderDividerClass:
            'border-e! border-s-0! border-y-0! border-gray-200! dark:border-gray-800!',
          slotHeaderClass:
            'px-3! py-2! text-start! text-xs! font-medium! text-gray-400! dark:text-gray-500!',
          slotLaneClass: 'border-gray-100! dark:border-gray-800/60!',
          dayLaneClass: (data: any) =>
            `border-gray-200! dark:border-gray-800! ${
              data.isToday ? 'bg-brand-50/15! dark:bg-brand-500/[0.03]!' : ''
            }`,
          allDayDividerClass:
            'border-b! border-t-0! border-x-0! border-gray-200! p-0! bg-transparent! dark:border-gray-800!',
          allDayHeaderClass:
            'border-0! bg-gray-50! text-xs! font-medium! text-gray-500! dark:border-0! dark:bg-gray-900! dark:text-gray-400!',
        },
      },

      // Body configuration
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

      selectable: true,
      events: this.events,
      select: (info) => this.handleDateSelect(info),
      eventClick: (info) => this.handleEventClick(info),
      eventContent: (arg) => this.renderEventContent(arg),
      datesSet: (arg: any) => {
        this.currentView = arg.view.type;
        requestAnimationFrame(() => {
          const el = this.elRef.nativeElement;
          const chunk = el.querySelector('.ta-toolbar-section:last-child') as HTMLElement;
          if (chunk) {
            this.renderViewSelect(chunk, this.currentView);
          }
        });
      }
    };
  }

  renderViewSelect(containerEl: HTMLElement, activeViewKey: string) {
    if (!containerEl) return;
    const activeOption =
      this.viewOptions.find((v) => v.key === activeViewKey) ||
      this.viewOptions[0];

    containerEl.innerHTML = `
      <div class="relative calendar-view-dropdown">
        <button
          type="button"
          class="calendar-view-btn flex h-9 w-full min-w-20 items-center justify-center gap-1.5 rounded-lg border border-gray-300 ps-3 pe-2 text-sm font-medium text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          aria-expanded="false"
          aria-haspopup="listbox"
        >
          <span class="calendar-view-label">${activeOption.label}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="calendar-view-chevron h-4.5 w-4.5 transition-transform duration-200">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        <div class="calendar-view-menu absolute end-0 z-50 mt-1.5 hidden w-38 space-y-0.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          ${this.viewOptions.map(
            (view) => `
            <button
              type="button"
              data-view-key="${view.key}"
              class="calendar-view-option w-full rounded-lg px-2.5 py-1.5 text-start text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 ${
                activeViewKey === view.key
                  ? "bg-gray-100 font-medium dark:bg-white/5"
                  : "font-normal"
              }"
            >
              ${view.label}
            </button>
          `
          ).join("")}
        </div>
      </div>
    `;

    const dropdownContainer = containerEl.querySelector(".calendar-view-dropdown");
    if (!dropdownContainer) return;
    const btn = dropdownContainer.querySelector(".calendar-view-btn") as HTMLElement;
    const menu = dropdownContainer.querySelector(".calendar-view-menu") as HTMLElement;
    const chevron = dropdownContainer.querySelector(".calendar-view-chevron") as HTMLElement;

    if (btn && menu && chevron) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isHidden = menu.classList.contains("hidden");
        document
          .querySelectorAll(".calendar-view-menu")
          .forEach((m) => m.classList.add("hidden"));
        document
          .querySelectorAll(".calendar-view-chevron")
          .forEach((c) => c.classList.remove("rotate-180"));

        if (isHidden) {
          menu.classList.remove("hidden");
          chevron.classList.add("rotate-180");
          btn.setAttribute("aria-expanded", "true");
        } else {
          menu.classList.add("hidden");
          chevron.classList.remove("rotate-180");
          btn.setAttribute("aria-expanded", "false");
        }
      });

      dropdownContainer
        .querySelectorAll(".calendar-view-option")
        .forEach((optionBtn) => {
          optionBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const viewKey = (optionBtn as HTMLElement).dataset['viewKey'];
            if (viewKey) {
              this.currentView = viewKey;
              const calApi = this.calendarComponent?.getApi();
              if (calApi && typeof calApi.changeView === "function") {
                calApi.changeView(viewKey);
              }
            }
            menu.classList.add("hidden");
            chevron.classList.remove("rotate-180");
            btn.setAttribute("aria-expanded", "false");
          });
        });
    }
  }

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.calendar-view-dropdown')) {
      document
        .querySelectorAll('.calendar-view-menu')
        .forEach((m) => m.classList.add('hidden'));
      document
        .querySelectorAll('.calendar-view-chevron')
        .forEach((c) => c.classList.remove('rotate-180'));
    }
  }

  handleOpenAddModal() {
    this.resetModalFields();
    this.eventStartDate = this.toDateTimeInputValue(new Date());
    this.recalculateEndDate();
    this.eventLevel = 'Primary';
    this.openModal();
  }

  handleDateSelect(selectInfo: DateSelectInfo) {
    this.resetModalFields();
    this.eventStartDate = this.toDateTimeInputValue(selectInfo.start);
    this.recalculateEndDate();
    this.eventLevel = 'Primary';
    this.openModal();
  }

  onClientChange(clientId: string) {
    this.selectedClientId = clientId;
    this.filteredPets = this.pets.filter((pet) => pet.client_id === clientId);
    if (!this.filteredPets.some((pet) => pet.id === this.selectedPetId)) {
      this.selectedPetId = '';
    }
  }

  onServiceSelectionChange(rawValue: string[] | string | null) {
    if (!rawValue) {
      this.selectedServiceIds = [];
      this.recalculateEndDate();
      return;
    }
    this.selectedServiceIds = Array.isArray(rawValue) ? rawValue : [rawValue];
    this.recalculateEndDate();
  }

  onStartDateChange() {
    this.recalculateEndDate();
  }

  handleEventClick(clickInfo: EventClickInfo) {
    const event = clickInfo.event as any;
    if (event.url) {
      window.open(event.url);
      clickInfo.jsEvent.preventDefault();
      return;
    }

    this.selectedEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      extendedProps: { calendar: event.extendedProps?.calendar || 'Primary' }
    };
    this.eventTitle = event.title;
    this.eventStartDate = event.start ? this.toDateTimeInputValue(event.start) : '';
    this.eventEndDate = event.end ? this.toDateTimeInputValue(event.end) : '';
    this.eventLevel = event.extendedProps?.calendar || 'Primary';
    const appointment = event.extendedProps?.appointment as AppointmentWithRelations | undefined;
    this.selectedClientId = appointment?.client_id ?? '';
    this.onClientChange(this.selectedClientId);
    this.selectedPetId = appointment?.pet_id ?? '';
    this.selectedEmployeeId = appointment?.employee_id ?? '';
    this.selectedServiceIds =
      appointment?.appointment_services?.map((service) => service.service_id) ?? [];
    this.status = appointment?.status ?? 'scheduled';
    this.eventTitle = appointment?.notes ?? event.title ?? '';
    this.recalculateEndDate();
    this.openModal();
  }

  async handleAddOrUpdateEvent() {
    this.errorMessage = '';
    if (
      !this.eventStartDate ||
      !this.selectedClientId ||
      !this.selectedPetId ||
      !this.selectedEmployeeId ||
      this.selectedServiceIds.length === 0
    ) {
      this.errorMessage = 'Completa cliente, mascota, empleado, fecha de inicio y al menos un servicio.';
      return;
    }

    const payload = this.buildAppointmentInput();
    if (!payload) {
      this.errorMessage = 'No se pudo calcular la hora de finalización.';
      return;
    }

    this.isSaving = true;
    try {
      if (this.selectedEvent?.id) {
        await this.appointmentsService.update(String(this.selectedEvent.id), payload);
      } else {
        await this.appointmentsService.create(payload);
      }
      await this.loadAppointments();
      this.closeModal();
      this.resetModalFields();
    } catch (error) {
      console.error('No se pudo guardar la cita.', error);
      this.errorMessage = 'No se pudo guardar la cita en Supabase.';
    } finally {
      this.isSaving = false;
    }
  }

  resetModalFields() {
    this.eventTitle = '';
    this.eventStartDate = '';
    this.eventEndDate = '';
    this.eventLevel = 'Primary';
    this.selectedClientId = '';
    this.selectedPetId = '';
    this.selectedEmployeeId = '';
    this.selectedServiceIds = [];
    this.status = 'scheduled';
    this.filteredPets = [];
    this.errorMessage = '';
    this.selectedEvent = null;
  }

  private toDateTimeInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private async loadInitialData() {
    try {
      const [clients, pets, employees, services] = await Promise.all([
        this.appointmentsService.getClients(),
        this.appointmentsService.getPets(),
        this.appointmentsService.getEmployees(),
        this.appointmentsService.getServices(),
      ]);
      this.clients = clients;
      this.pets = pets;
      this.filteredPets = [];
      this.employees = employees;
      this.services = services;
      await this.loadAppointments();
    } catch (error) {
      console.error('No se pudieron cargar los datos de agenda.', error);
      this.errorMessage = 'No se pudieron cargar los datos de agenda desde Supabase.';
    }
  }

  private async loadAppointments() {
    const appointments = await this.appointmentsService.getAll();
    this.events = appointments.map((appointment) => this.mapAppointmentToEvent(appointment));
    this.refreshCalendarEvents();
  }

  private refreshCalendarEvents() {
    const api = this.calendarComponent?.getApi();
    if (!api) return;
    api.removeAllEvents();
    this.events.forEach((event) => api.addEvent(event));
  }

  private mapAppointmentToEvent(appointment: AppointmentWithRelations): CalendarEvent {
    const startIso = this.combineDateAndTime(appointment.appointment_date, appointment.start_time);
    const endIso = this.combineDateAndTime(appointment.appointment_date, appointment.end_time);
    const client = this.getSingleRelation(appointment.client);
    const pet = this.getSingleRelation(appointment.pet);
    const clientName = this.getPersonName(client?.first_name, client?.last_name);
    const petName = pet?.name?.trim() || 'Mascota';
    const notes = appointment.notes?.trim();
    const title = notes || `${petName} · ${clientName || 'Cliente'}`;
    const statusLevel = this.mapStatusToCalendarLevel(appointment.status);
    return {
      id: appointment.id,
      title,
      start: startIso,
      end: endIso,
      allDay: false,
      extendedProps: {
        calendar: statusLevel,
        appointment,
      },
    };
  }

  private buildAppointmentInput(): AppointmentInput | null {
    const startDate = new Date(this.eventStartDate);
    if (Number.isNaN(startDate.getTime())) {
      return null;
    }
    const totalDuration = this.getSelectedServicesDurationMinutes();
    const endDate = new Date(startDate.getTime() + totalDuration * 60 * 1000);
    this.eventEndDate = this.toDateTimeInputValue(endDate);
    const selectedServices = this.services.filter((service) => this.selectedServiceIds.includes(service.id));

    return {
      client_id: this.selectedClientId,
      pet_id: this.selectedPetId,
      employee_id: this.selectedEmployeeId,
      appointment_date: this.eventStartDate.split('T')[0],
      start_time: `${this.eventStartDate.split('T')[1] || '00:00'}:00`,
      end_time: `${this.eventEndDate.split('T')[1] || '00:00'}:00`,
      status: this.status || 'scheduled',
      notes: this.eventTitle.trim(),
      services: selectedServices.map((service) => ({
        service_id: service.id,
        price: Number(service.price ?? 0),
        duration_minutes: Number(service.duration_minutes ?? 0),
      })),
    };
  }

  private getSelectedServicesDurationMinutes(): number {
    return this.services
      .filter((service) => this.selectedServiceIds.includes(service.id))
      .reduce((total, service) => total + Number(service.duration_minutes ?? 0), 0);
  }

  private recalculateEndDate() {
    if (!this.eventStartDate) {
      this.eventEndDate = '';
      return;
    }
    const startDate = new Date(this.eventStartDate);
    if (Number.isNaN(startDate.getTime())) {
      this.eventEndDate = '';
      return;
    }
    const totalDuration = this.getSelectedServicesDurationMinutes();
    const endDate = new Date(startDate.getTime() + totalDuration * 60 * 1000);
    this.eventEndDate = this.toDateTimeInputValue(endDate);
  }

  private mapStatusToCalendarLevel(status: string | null | undefined): string {
    const normalized = (status || 'scheduled').toLowerCase();
    if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'no_show') {
      return 'Danger';
    }
    if (normalized === 'completed') {
      return 'Success';
    }
    if (normalized === 'rescheduled' || normalized === 'pending') {
      return 'Warning';
    }
    return 'Primary';
  }

  private combineDateAndTime(date: string, time: string): string {
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    return `${date}T${normalizedTime}`;
  }

  private getPersonName(firstName?: string | null, lastName?: string | null): string {
    return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }

  private getSingleRelation<T>(value: T | T[] | null | undefined): T | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }

  openModal() {
    this.isOpen = true;
  }

  closeModal() {
    this.isOpen = false;
    this.resetModalFields();
  }

  renderEventContent(eventInfo: any) {
    const calendarLevel = (
      eventInfo.event.extendedProps?.calendar || 'primary'
    ).toLowerCase();

    const colorMap: Record<string, { bg: string; dot: string; title: string; time: string }> = {
      success: {
        bg: 'border border-success-100 bg-success-50 dark:border-success-500/20 dark:bg-success-500/15',
        dot: 'bg-success-500',
        title: 'text-success-700 dark:text-success-400',
        time: 'text-success-600/80 dark:text-success-400/80',
      },
      danger: {
        bg: 'border border-error-100 bg-error-50 dark:border-error-500/20 dark:bg-error-500/15',
        dot: 'bg-error-500',
        title: 'text-error-700 dark:text-error-400',
        time: 'text-error-600/80 dark:text-error-400/80',
      },
      primary: {
        bg: 'border border-brand-100 bg-brand-50 dark:border-brand-500/20 dark:bg-brand-500/15',
        dot: 'bg-brand-500',
        title: 'text-brand-700 dark:text-brand-400',
        time: 'text-brand-600/80 dark:text-brand-400/80',
      },
      warning: {
        bg: 'border border-orange-100 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/15',
        dot: 'bg-orange-500',
        title: 'text-orange-700 dark:text-orange-400',
        time: 'text-orange-600/80 dark:text-orange-400/80',
      },
    };

    const colors = colorMap[calendarLevel] || colorMap['primary'];
    const isTimeGridView =
      !eventInfo.event?.allDay &&
      eventInfo.view?.type &&
      eventInfo.view.type.startsWith('timeGrid');

    if (isTimeGridView) {
      return {
        html: `
          <div dir="ltr" class="event-fc-color flex h-full w-full flex-col justify-start overflow-hidden rounded-lg p-1.5 transition-colors ${colors.bg}">
            <div class="flex items-center gap-1.5">
              <div class="size-2 shrink-0 rounded-full ${colors.dot}"></div>
              <div class="truncate text-xs font-semibold leading-tight ${colors.title}">${eventInfo.event.title || ''}</div>
            </div>
            ${
              eventInfo.timeText
                ? `<div class="mt-0.5 truncate ps-3.5 text-[11px] font-medium leading-tight ${colors.time}">${eventInfo.timeText}</div>`
                : ''
            }
          </div>
        `,
      };
    }

    return {
      html: `
        <div dir="ltr" class="event-fc-color flex items-center rounded-lg py-1.5 ps-2.5 pe-3 transition-colors ${colors.bg}">
          <div class="fc-daygrid-event-dot ms-0 me-2 h-3.5 w-1 shrink-0 rounded-full border-none ${colors.dot}"></div>
          ${
            eventInfo.timeText
              ? `<div class="fc-event-time me-1.5 p-0 text-xs font-normal text-gray-500 dark:text-gray-400">${eventInfo.timeText}</div>`
              : ''
          }
          <div class="fc-event-title truncate p-0 text-xs font-medium text-gray-700 dark:text-white">${eventInfo.event.title || ''}</div>
        </div>
      `,
    };
  }
}
