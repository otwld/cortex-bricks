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
  @Prop({ type: String, enum: ['Polygon'], required: true })
  type!: 'Polygon';

  @Prop({ type: [[[Number]]], required: true })
  coordinates!: number[][][];
}

export const GeoJsonPolygonSchema = SchemaFactory.createForClass(GeoJsonPolygon);
