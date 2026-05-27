import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

/** Loads compiled HTML templates from disk with in-memory caching. */
@Injectable()
export class TemplateLoader {
  private readonly cache = new Map<string, string>();

  /**
   * Returns the compiled HTML for a named template, reading from disk on first access.
   *
   * @param dir - Absolute path to the directory containing compiled `.html` files.
   * @param name - Template name without extension, e.g. `"welcome"`.
   * @returns HTML string.
   * @throws Error when the template file does not exist.
   */
  async load(dir: string, name: string): Promise<string> {
    const filePath = path.join(dir, `${name}.html`);
    const cached = this.cache.get(filePath);
    if (cached !== undefined) return cached;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.cache.set(filePath, content);
      return content;
    } catch {
      throw new Error(`Mail template "${name}" not found at ${filePath}`);
    }
  }
}
