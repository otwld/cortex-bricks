type Predicate<T> = (value: T) => boolean;
type MemoryEntityDocument<T extends object> = MemoryDocument<T> & T;

class MemoryDocument<T extends object> {
  constructor(
    private readonly data: T,
    private readonly onSave: (value: T) => void,
  ) {
    Object.assign(this, data);
  }

  async save(): Promise<this> {
    this.onSave(this.toJSON());
    return this;
  }

  toJSON(): T {
    const snapshot = { ...this.data } as Record<string, unknown>;
    const document = this as Record<string, unknown>;
    for (const key of Object.keys(this.data)) {
      snapshot[key] = document[key];
    }
    return snapshot as T;
  }
}

function createMemoryDocument<T extends object>(
  value: T,
  onSave: (value: T) => void,
): MemoryEntityDocument<T> {
  return Object.assign(new MemoryDocument(value, onSave), value);
}

/**
 * Creates a small in-memory model with the Mongoose methods needed by storage
 * service tests.
 *
 * This helper is intentionally limited to the query operators exercised by the
 * storage package tests and should not be treated as a general Mongoose mock.
 */
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

  const model: {
    rows: T[];
    create(value: T): Promise<MemoryEntityDocument<T>>;
    findOne(query: Partial<T>): { exec(): Promise<MemoryEntityDocument<T> | null> };
    find(query: Partial<T>): { exec(): Promise<MemoryEntityDocument<T>[]> };
    findById(id: string): { exec(): Promise<MemoryEntityDocument<T> | null> };
    deleteOne(query: Partial<T>): { exec(): Promise<{ deletedCount: number }> };
  } = {
    rows,
    create: async (value: T) => {
      rows.push(value);
      return createMemoryDocument(value, (next) => {
        const index = rows.indexOf(value);
        if (index >= 0) rows[index] = next;
      });
    },
    findOne: (query: Partial<T>) => ({
      exec: async () => {
        const row = rows.find(matches(query));
        return row ? createMemoryDocument(row, (next) => Object.assign(row, next)) : null;
      },
    }),
    find: (query: Partial<T>) => ({
      exec: async () =>
        rows
          .filter(matches(query))
          .map((row) => createMemoryDocument(row, (next) => Object.assign(row, next))),
    }),
    findById: (id: string) => ({
      exec: async () => {
        const row = rows.find((candidate) => {
          const indexed = candidate as Record<string, unknown>;
          return indexed['id'] === id || indexed['_id']?.toString() === id;
        });
        return row ? createMemoryDocument(row, (next) => Object.assign(row, next)) : null;
      },
    }),
    deleteOne: (query: Partial<T>) => ({
      exec: async () => {
        const index = rows.findIndex(matches(query));
        if (index === -1) return { deletedCount: 0 };
        rows.splice(index, 1);
        return { deletedCount: 1 };
      },
    }),
  };

  return model;
}
