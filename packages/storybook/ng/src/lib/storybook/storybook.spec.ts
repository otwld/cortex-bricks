import { createStorybookChartArgTypes } from './storybook';

describe('createStorybookChartArgTypes', () => {
  it('creates common input controls and data-selection actions', () => {
    expect(
      createStorybookChartArgTypes({
        dataInput: {
          name: 'series',
          description: 'Series rendered by the chart.',
        },
        dataOutput: {
          name: 'dataSelected',
        },
      }),
    ).toEqual(
      expect.objectContaining({
        chartClass: expect.objectContaining({
          control: 'text',
          table: { category: 'Inputs' },
        }),
        colorScheme: expect.objectContaining({
          control: 'radio',
          options: ['light', 'dark'],
        }),
        dataSelected: expect.objectContaining({
          action: 'dataSelected',
          table: { category: 'Outputs' },
        }),
        labels: expect.objectContaining({
          control: 'object',
        }),
        series: expect.objectContaining({
          control: 'object',
          description: 'Series rendered by the chart.',
        }),
      }),
    );
  });

  it('can omit axis labels for non-axis chart stories', () => {
    expect(
      createStorybookChartArgTypes({
        dataInput: {
          name: 'categories',
          description: 'Candidate source categories rendered by the chart.',
        },
        includeLabels: false,
      }),
    ).not.toHaveProperty('labels');
  });
});
