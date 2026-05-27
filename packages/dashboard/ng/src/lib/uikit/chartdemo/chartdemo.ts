import { Component, effect, inject, signal, WritableSignal } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { FluidModule } from 'primeng/fluid';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';

/**
 * Displays PrimeNG chart examples that react to dashboard theme changes.
 */
@Component({
  selector: 'app-chart-demo',
  imports: [ChartModule, FluidModule],
  templateUrl: './chartdemo.html',
})
export class ChartDemo {
  protected readonly layoutService = inject(DashboardLayoutService);

  protected readonly lineData: WritableSignal<ChartData | null> = signal(null);

  protected readonly barData: WritableSignal<ChartData | null> = signal(null);

  protected readonly pieData: WritableSignal<ChartData | null> = signal(null);

  protected readonly polarData: WritableSignal<ChartData | null> = signal(null);

  protected readonly radarData: WritableSignal<ChartData | null> = signal(null);

  protected readonly lineOptions: WritableSignal<ChartOptions | null> = signal(null);

  protected readonly barOptions: WritableSignal<ChartOptions | null> = signal(null);

  protected readonly pieOptions: WritableSignal<ChartOptions | null> = signal(null);

  protected readonly polarOptions: WritableSignal<ChartOptions | null> = signal(null);

  protected readonly radarOptions: WritableSignal<ChartOptions | null> = signal(null);

  private readonly chartEffect = effect(() => {
    const darkModeEnabled = this.layoutService.isDarkTheme();

    setTimeout(() => {
      if (darkModeEnabled === this.layoutService.isDarkTheme()) {
        this.initCharts();
      }
    }, 50);
  });

  /**
   * Rebuilds chart datasets and options from the active PrimeNG CSS variables.
   */
  protected initCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.barData.set({
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          label: 'My First dataset',
          backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
          borderColor: documentStyle.getPropertyValue('--p-primary-500'),
          data: [65, 59, 80, 81, 56, 55, 40],
        },
        {
          label: 'My Second dataset',
          backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
          borderColor: documentStyle.getPropertyValue('--p-primary-200'),
          data: [28, 48, 40, 19, 86, 27, 90],
        },
      ],
    });

    this.barOptions.set({
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500,
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    });

    this.pieData.set({
      labels: ['A', 'B', 'C'],
      datasets: [
        {
          data: [540, 325, 702],
          backgroundColor: [
            documentStyle.getPropertyValue('--p-indigo-500'),
            documentStyle.getPropertyValue('--p-purple-500'),
            documentStyle.getPropertyValue('--p-teal-500'),
          ],
          hoverBackgroundColor: [
            documentStyle.getPropertyValue('--p-indigo-400'),
            documentStyle.getPropertyValue('--p-purple-400'),
            documentStyle.getPropertyValue('--p-teal-400'),
          ],
        },
      ],
    });

    this.pieOptions.set({
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            color: textColor,
          },
        },
      },
    });

    this.lineData.set({
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          label: 'First Dataset',
          data: [65, 59, 80, 81, 56, 55, 40],
          fill: false,
          backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
          borderColor: documentStyle.getPropertyValue('--p-primary-500'),
          tension: 0.4,
        },
        {
          label: 'Second Dataset',
          data: [28, 48, 40, 19, 86, 27, 90],
          fill: false,
          backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
          borderColor: documentStyle.getPropertyValue('--p-primary-200'),
          tension: 0.4,
        },
      ],
    });

    this.lineOptions.set({
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    });

    this.polarData.set({
      datasets: [
        {
          data: [11, 16, 7, 3],
          backgroundColor: [
            documentStyle.getPropertyValue('--p-indigo-500'),
            documentStyle.getPropertyValue('--p-purple-500'),
            documentStyle.getPropertyValue('--p-teal-500'),
            documentStyle.getPropertyValue('--p-orange-500'),
          ],
          label: 'My dataset',
        },
      ],
      labels: ['Indigo', 'Purple', 'Teal', 'Orange'],
    });

    this.polarOptions.set({
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        r: {
          grid: {
            color: surfaceBorder,
          },
          ticks: {
            display: false,
            color: textColorSecondary,
          },
        },
      },
    });

    this.radarData.set({
      labels: ['Eating', 'Drinking', 'Sleeping', 'Designing', 'Coding', 'Cycling', 'Running'],
      datasets: [
        {
          label: 'My First dataset',
          borderColor: documentStyle.getPropertyValue('--p-indigo-400'),
          pointBackgroundColor: documentStyle.getPropertyValue('--p-indigo-400'),
          pointBorderColor: documentStyle.getPropertyValue('--p-indigo-400'),
          pointHoverBackgroundColor: textColor,
          pointHoverBorderColor: documentStyle.getPropertyValue('--p-indigo-400'),
          data: [65, 59, 90, 81, 56, 55, 40],
        },
        {
          label: 'My Second dataset',
          borderColor: documentStyle.getPropertyValue('--p-purple-400'),
          pointBackgroundColor: documentStyle.getPropertyValue('--p-purple-400'),
          pointBorderColor: documentStyle.getPropertyValue('--p-purple-400'),
          pointHoverBackgroundColor: textColor,
          pointHoverBorderColor: documentStyle.getPropertyValue('--p-purple-400'),
          data: [28, 48, 40, 19, 96, 27, 100],
        },
      ],
    });

    this.radarOptions.set({
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        r: {
          pointLabels: {
            color: textColor,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    });
  }
}
