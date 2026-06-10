import { BadRequestException } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

import type { IdLike } from '../types/id-like';

/**
 * Converts an identifier into a Mongoose ObjectId.
 *
 * @throws {BadRequestException} If the value is not a valid ObjectId.
 */
export function toObjectId(id: IdLike): Types.ObjectId {
  if (id instanceof Types.ObjectId) return id;
  if (!isValidObjectId(id)) throw new BadRequestException(`Invalid ObjectId: ${id}`);
  return new Types.ObjectId(id);
}

/**
 * Converts a list of identifiers into Mongoose ObjectIds.
 */
export function toObjectIds(ids: readonly IdLike[]): Types.ObjectId[] {
  return ids.map(toObjectId);
}

/**
 * Asserts that a string is a valid ObjectId.
 */
export function assertValidObjectId(id: string): void {
  if (!isValidObjectId(id)) {
    throw new BadRequestException(`Invalid ObjectId: ${id}`);
  }
}
