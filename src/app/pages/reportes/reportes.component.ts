import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { limaMonth, penAmount } from '../../shared/services/dashboard-analytics.models';
import { MonthlyReportsService } from '../../shared/services/monthly-reports.service';
import { MonthlyReports, ReportKind, addMonths, monthsInRange, reportCsv } from '../../shared/services/monthly-reports.models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  templateUrl: './reportes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesComponent {
  private readonly authorization = inject(AuthorizationService);
  private readonly service = inject(MonthlyReportsService);
  private readonly destroyRef = inject(DestroyRef);
  private revision = 0;

  readonly currentMonth = limaMonth(new Date());
  readonly fromMonth = signal(addMonths(this.currentMonth, -11));
  readonly toMonth = signal(this.currentMonth);
  readonly report = signal<MonthlyReports | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly rangeError = signal('');
  readonly canView = computed(() => {
    const role = this.authorization.selectedRole();
    return !!role && (role.code === 'OWNER' || role.code === 'ADMIN')
      && role.permissions.includes('analytics.read');
  });

  constructor() {
    effect(() => {
      if (this.canView()) untracked(() => { void this.load(); });
      else {
        this.revision++;
        this.report.set(null);
        this.loading.set(false);
        this.error.set('');
      }
    });
    this.destroyRef.onDestroy(() => { this.revision++; });
  }

  setFrom(event: Event): void {
    this.revision++;
    this.report.set(null);
    this.fromMonth.set((event.target as HTMLInputElement).value);
  }
  setTo(event: Event): void {
    this.revision++;
    this.report.set(null);
    this.toMonth.set((event.target as HTMLInputElement).value);
  }

  async load(): Promise<void> {
    if (!this.canView()) return;
    const from = this.fromMonth();
    const to = this.toMonth();
    const count = monthsInRange(from, to);
    if (!count || count > 12 || to > this.currentMonth) {
      this.revision++;
      this.report.set(null);
      this.loading.set(false);
      this.rangeError.set('Selecciona entre 1 y 12 meses, hasta el mes actual.');
      return;
    }
    this.rangeError.set('');
    const revision = ++this.revision;
    this.report.set(null);
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.service.get(from, to);
      if (revision === this.revision && this.canView()) this.report.set(result);
    } catch {
      if (revision === this.revision && this.canView()) this.error.set('No pudimos cargar los reportes. Comprueba la conexión y vuelve a intentar.');
    } finally {
      if (revision === this.revision) this.loading.set(false);
    }
  }

  export(kind: ReportKind): void {
    const report = this.report();
    if (!report || !this.canView()) return;
    const content = reportCsv(report, kind, this.currentMonth);
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${kind === 'collections' ? 'cobros-citas' : 'retencion'}_${report.from}_${report.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  money(value: string): string { return penAmount(value); }
}
