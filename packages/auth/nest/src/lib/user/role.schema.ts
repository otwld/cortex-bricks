import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Embedded role document attached to a user profile.
 *
 * @example
 * ```ts
 * const role = new Role();
 * role.name = 'admin';
 * ```
 */
@Schema({ _id: false })
export class Role {
  /**
   * Role name used by authorization code.
   *
   * @example
   * ```ts
   * role.name = 'admin';
   * ```
   */
  @Prop({ required: true })
  name!: string;

  /**
   * Permission strings granted by the role.
   *
   * @example
   * ```ts
   * role.permissions = ['users:read'];
   * ```
   */
  @Prop({ type: [String], default: [] })
  permissions!: string[];
}

/**
 * Mongoose schema generated from the embedded Role class.
 *
 * @example
 * ```ts
 * @Prop({ type: [RoleSchema], default: [] })
 * roles!: Role[];
 * ```
 */
export const RoleSchema = SchemaFactory.createForClass(Role);
