import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

import { GeoJsonPolygon } from '../schemas';

/**
 * Keep DTO validation minimal; schema-level validation handles persistence rules.
 */
export class GeoJsonPolygonDto implements GeoJsonPolygon {
  @ApiProperty({ description: 'GeoJSON type for Company recruiting region', example: 'Polygon' })
  @IsString()
  @IsNotEmpty()
  type!: 'Polygon';

  @ApiProperty({
    description: 'GeoJSON coordinates for a Company recruiting region Polygon',
    example: [
      [
        [5.0, 43.0],
        [5.2, 43.0],
        [5.2, 43.2],
        [5.0, 43.2],
        [5.0, 43.0],
      ],
    ],
  })
  @IsArray()
  coordinates!: number[][][];
}
