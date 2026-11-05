import { TestBed } from '@angular/core/testing';
import { PetBreedsService } from './pet-breeds.service';
import { SupabaseService } from './supabase.service';

describe('PetBreedsService', () => {
  it('filtra razas activas y pagina usando el total del servidor', async () => {
    const rows = Array.from({ length: 126 }, (_, index) => ({
      id: String(index), name: `Raza ${index}`, active: index !== 125,
    }));
    const from = jasmine.createSpy('from').and.callFake(() => {
      let active: boolean | null = null;
      const request = {
        select: () => request,
        ilike: () => request,
        eq: (_column: string, value: boolean) => { active = value; return request; },
        order: () => request,
        range: async (start: number, end: number) => {
          const filtered = active === null ? rows : rows.filter(row => row.active === active);
          return { data: filtered.slice(start, end + 1), count: filtered.length, error: null };
        },
      };
      return request;
    });
    TestBed.configureTestingModule({
      providers: [
        PetBreedsService,
        { provide: SupabaseService, useValue: { client: { from } } },
      ],
    });

    const service = TestBed.inject(PetBreedsService);
    const active = await service.getAll(true);
    expect(active.length).toBe(125);
    expect(active.every(row => row.active)).toBeTrue();
    expect(from).toHaveBeenCalledWith('pet_breeds');
  });
});
