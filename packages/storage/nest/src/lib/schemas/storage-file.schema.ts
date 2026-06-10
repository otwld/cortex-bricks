import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import mongoose, { HydratedDocument } from 'mongoose';

/** Hydrated Mongoose document for a stored file record. */
export type StorageFileDocument = HydratedDocument<StorageFileRecord>;

/** MongoDB record describing a stored file. */
@Schema({
  collection: 'storage_files',
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret['id'] = ret['_id']?.toString();
      delete ret['_id'];
      return ret;
    },
  },
})
export class StorageFileRecord {
  /** Driver-relative storage key. */
  @Prop({ required: true, unique: true, index: true })
  key!: string;

  /** Original or normalized filename. */
  @Prop({ required: true })
  filename!: string;

  /** MIME type recorded for the object. */
  @Prop({ required: true })
  mimetype!: string;

  /** Stored object size in bytes. */
  @Prop({ required: true, min: 0 })
  size!: number;

  /** Storage backend that owns the object. */
  @Prop({ type: String, required: true, enum: StorageDriverKind })
  driver!: StorageDriverKind;

  /** SHA-256 checksum of stored bytes. */
  @Prop({ required: true })
  checksum!: string;

  /** User metadata stored with the object. */
  @Prop({ type: Map, of: String })
  metadata?: Map<string, string>;

  /** Optional owner id for filtering. */
  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true })
  ownerId?: mongoose.Types.ObjectId;

  /** Soft-delete timestamp; absent when active. */
  @Prop()
  deletedAt?: Date;
}

/** Mongoose schema for stored file records. */
export const StorageFileSchema = SchemaFactory.createForClass(StorageFileRecord);
StorageFileSchema.index({ ownerId: 1, createdAt: -1 });
StorageFileSchema.index({ deletedAt: 1 });

/** Mongoose query fragment that excludes soft-deleted documents. */
export const NOT_SOFT_DELETED = { deletedAt: { $exists: false } } as const;
