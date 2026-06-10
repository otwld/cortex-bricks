import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Tailwind-only landing page for the frontend shell.
 */
@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-slate-950 text-white">
      <section class="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <p class="mb-4 text-sm font-semibold uppercase tracking-wide text-cyan-300">Monorepo Starter</p>
        <h1 class="max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">A lightweight Angular shell with lazy PrimeNG workspaces.</h1>
        <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          This landing route stays Tailwind-only while auth and dashboard routes load their PrimeNG providers on demand.
        </p>
        <div class="mt-10 flex flex-wrap gap-3">
          <a routerLink="/auth/login" class="rounded-md bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"> Sign in </a>
          <a routerLink="/dashboard" class="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Open dashboard
          </a>
        </div>
      </section>
    </main>
  `,
})
export class LandingPage {}
