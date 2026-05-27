import { Injectable } from '@nestjs/common';

/** Replaces `{{ key }}` tokens in compiled HTML with HTML-escaped context values. */
@Injectable()
export class TemplateInterpolator {
  private static escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Replaces every `{{ key }}` occurrence in `template` with `context[key]`.
   *
   * @param template - Compiled HTML string containing `{{ key }}` tokens.
   * @param context - Key/value map of substitution values.
   * @returns HTML string with all matching tokens replaced.
   */
  interpolate(template: string, context: Record<string, unknown>): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
      const value = context[key];
      if (value === undefined) return match;
      return TemplateInterpolator.escapeHtml(String(value));
    });
  }
}
