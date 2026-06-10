import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * GeoJSON Polygon schema.
 * Coordinates format:
 * [
 *   [ [lng, lat], [lng, lat], ..., [lng, lat] ] // linear ring (closed)
 * ]
 */
@Schema({ _id: false })
export class GeoJsonPolygon {
  /**
   * GeoJSON geometry discriminator persisted with the polygon.
   */
  @Prop({ type: String, enum: ['Polygon'], required: true })
  type!: 'Polygon';

  /**
   * Polygon coordinate rings stored as longitude/latitude tuples.
   */
  @Prop({ type: [[[Number]]], required: true })
  coordinates!: number[][][];
}

/**
 * Embedded Mongoose schema for GeoJSON polygon values.
 */
export const GeoJsonPolygonSchema = SchemaFactory.createForClass(GeoJsonPolygon);
