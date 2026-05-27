type Predicate<T> = (value: T) => boolean;

class MemoryDocument<T extends object> {
  constructor(
    private readonly data: T,
    private readonly onSave: (value: T) => void,
  ) {
    Object.assign(this, data);
  }

  async save(): Promise<this> {
    this.onSave(this as unknown as T);
    return this;
  }

  toJSON(): T {
    return { ...(this as unknown as T) };
  }
}

export function createMemoryModel<T extends object = Record<string, unknown>>() {
  const rows: T[] = [];

  function matches(query: Partial<T>): Predicate<T> {
    return (row: T) =>
      Object.entries(query).every(([key, expected]) => {
        if (expected && typeof expected === 'object' && '$lte' in expected) {
          return ((row as Record<string, unknown>)[key] as Date) <= (expected as { $lte: Date }).$lte;
        }
        if (expected && typeof expected === 'object' && '$ne' in expected) {
          return (row as Record<string, unknown>)[key] !== (expected as { $ne: unknown }).$ne;
        }
        return (row as Record<string, unknown>)[key] === expected;
      });
  }

  const model = function Model(this: MemoryDocument<T>, value: T) {
    return new MemoryDocument(value, (next) => {
      const index = rows.findIndex((row) => {
        const current = row as Record<string, unknown>;
        const replacement = next as Record<string, unknown>;
        return row === value || current['uploadId'] === replacement['uploadId'] || current['key'] === replacement['key'];
      });
      if (index >= 0) rows[index] = next;
      else rows.push(next);
    });
  } as unknown as {
    new (value: T): MemoryDocument<T> & T;
    rows: T[];
    create(value: T): Promise<MemoryDocument<T> & T>;
    findOne(query: Partial<T>): { exec(): Promise<(MemoryDocument<T> & T) | null> };
    find(query: Partial<T>): { exec(): Promise<(MemoryDocument<T> & T)[]> };
    findById(id: string): { exec(): Promise<(MemoryDocument<T> & T) | null> };
    deleteOne(query: Partial<T>): { exec(): Promise<{ deletedCount: number }> };
  };

  model.rows = rows;
  model.create = async (value: T) => {
    rows.push(value);
    return new MemoryDocument(value, (next) => {
      const index = rows.indexOf(value);
      if (index >= 0) rows[index] = next;
    }) as MemoryDocument<T> & T;
  };
  model.findOne = (query: Partial<T>) => ({
    exec: async () => {
      const row = rows.find(matches(query));
      return row ? (new MemoryDocument(row, (next) => Object.assign(row, next)) as MemoryDocument<T> & T) : null;
    },
  });
  model.find = (query: Partial<T>) => ({
    exec: async () => rows.filter(matches(query)).map((row) => new MemoryDocument(row, (next) => Object.assign(row, next)) as MemoryDocument<T> & T),
  });
  model.findById = (id: string) => ({
    exec: async () => {
      const row = rows.find((candidate) => {
        const indexed = candidate as Record<string, unknown>;
        return indexed['id'] === id || indexed['_id']?.toString() === id;
      });
      return row ? (new MemoryDocument(row, (next) => Object.assign(row, next)) as MemoryDocument<T> & T) : null;
    },
  });
  model.deleteOne = (query: Partial<T>) => ({
    exec: async () => {
      const index = rows.findIndex(matches(query));
      if (index === -1) return { deletedCount: 0 };
      rows.splice(index, 1);
      return { deletedCount: 1 };
    },
  });

  return model;
}
