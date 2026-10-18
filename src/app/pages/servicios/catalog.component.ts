import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceSimulatorComponent } from '../../shared/components/services/service-simulator/service-simulator.component';
@Component({selector:'app-service-catalog',standalone:true,imports:[RouterLink,ServiceSimulatorComponent],
 template:`<main class="min-h-screen space-y-5 bg-gray-50 p-5 text-gray-800 dark:bg-gray-950 dark:text-white/90"><a routerLink="/mi-perfil" class="text-brand-500 dark:text-brand-400">Volver a mi perfil</a><h1 class="text-2xl font-semibold">Servicios y precios</h1><app-service-simulator [publicOnly]="true" /></main>`})
export class ServiceCatalogComponent {}
