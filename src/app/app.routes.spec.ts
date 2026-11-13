import { routes } from './app.routes';

describe('Rutas de servicios y tarifas', () => {
  it('usa la ruta unificada y redirige las rutas históricas', () => {
    const internalRoutes = routes.flatMap(route => route.children ?? []);
    const servicesAndPrices = internalRoutes.find(route => route.path === 'servicios-y-tarifas');
    const services = internalRoutes.find(route => route.path === 'servicios');
    const prices = internalRoutes.find(route => route.path === 'tarifas');

    expect(servicesAndPrices?.title).toBe('Servicios y tarifas | Spa & Boutique Pandas 11');
    expect(services?.redirectTo).toBe('servicios-y-tarifas');
    expect(services?.pathMatch).toBe('full');
    expect(prices?.redirectTo).toBe('servicios-y-tarifas');
    expect(prices?.pathMatch).toBe('full');
  });
});
