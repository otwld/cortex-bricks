import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Part, StorageDriver as StorageDriverKind } from '@otwld/ts-storage';
import { HydratedDocument } from 'mongoose';

/** Hydrated Mongoose document for a resumable upload state record. */
export type UploadStateDocument = HydratedDocument<UploadState>;

@Schema({
  collection: 'storage_upload_states',
  timestamps: true,
  versionKey: false,
})
/** MongoDB record tracking in-progress TUS multipart uploads. */
export class UploadState {
  /** Driver multipart upload id. */
  @Prop({ required: true, unique: true, index: true })
  uploadId!: string;

  /** Final storage key for the upload. */
  @Prop({ required: true })
  key!: string;

  /** Number of bytes already received. */
  @Prop({ required: true, min: 0 })
  offset!: number;

  /** Total expected upload length in bytes. */
  @Prop({ required: true, min: 0 })
  length!: number;

  /** Metadata decoded from the TUS Upload-Metadata header. */
  @Prop({ type: Map, of: String, default: {} })
  metadata!: Map<string, string>;

  /** Completed multipart parts for final assembly. */
  @Prop({ type: [{ partNumber: Number, etag: String }], default: [] })
  parts!: Part[];

  /** Storage backend used for this upload. */
  @Prop({ type: String, required: true, enum: StorageDriverKind })
  driver!: StorageDriverKind;

  /** Expiration timestamp after which cleanup can abort the upload. */
  @Prop({ required: true, index: { expires: 0 } })
  expiresAt!: Date;
}

/** Mongoose schema for TUS upload state records. */
export const UploadStateSchema = SchemaFactory.createForClass(UploadState);
