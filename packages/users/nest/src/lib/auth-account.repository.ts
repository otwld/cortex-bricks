import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@otwld/nest-auth';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ClientSession, Model } from 'mongoose';

/** Payload used to create a pending auth account. */
export interface CreatePendingAuthAccount {
  /** Account email. */
  email: string;
  /** Optional local username. */
  username?: string;
  /** Optional first name. */
  firstName?: string;
  /** Optional last name. */
  lastName?: string;
  /** Optional avatar URL. */
  avatar?: string;
  /** Assigned roles. */
  roles?: User['roles'];
  /** Direct permissions. */
  permissions?: string[];
}

/** Persistence bridge for auth accounts owned by the auth package. */
@Injectable()
export class AuthAccountRepository {
  /** Create the auth account repository. */
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  /** Finds one auth account by email. */
  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /** Finds one auth account by id. */
  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  /** Finds one auth account by id and includes the hidden password hash. */
  findByIdWithPassword(id: string) {
    return this.userModel.findById(id).select('+password').exec();
  }

  /** Creates an auth account that cannot use local login until credentials are set. */
  createPendingAccount(dto: CreatePendingAuthAccount, session?: ClientSession) {
    return new this.userModel({
      email: dto.email.toLowerCase(),
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      avatar: dto.avatar,
      emailVerified: false,
      roles: dto.roles ?? [],
      permissions: dto.permissions ?? [],
    }).save({ session });
  }

  /** Updates auth account assignment and profile mirror fields. */
  updateAssignments(id: string, update: Partial<User>, session?: ClientSession) {
    return this.userModel.findByIdAndUpdate(id, update, { new: true, session }).exec();
  }

  /**
   * Disables an auth account by clearing credentials, providers, reset state, and assignments.
   *
   * @param id - Auth user identifier.
   * @param session - Optional MongoDB transaction session.
   * @returns The updated auth user document, or null when none exists.
   */
  disableAccount(id: string, session?: ClientSession) {
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          emailVerified: false,
          roles: [],
          permissions: [],
          $unset: {
            password: '',
            googleId: '',
            githubId: '',
            passwordResetToken: '',
            passwordResetExpires: '',
            emailVerificationToken: '',
            emailVerificationExpires: '',
          },
        },
        { new: true, session },
      )
      .exec();
  }

  /** Sets local credentials for an invited account. */
  async setLocalCredentials(id: string, password: string, username?: string, session?: ClientSession) {
    const hashed = await bcrypt.hash(password, 12);
    return this.userModel.findByIdAndUpdate(id, { password: hashed, username }, { new: true, session }).exec();
  }

  /** Changes an account password after validating the current password. */
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.findByIdWithPassword(id);
    if (!user?.password) throw new UnauthorizedException('Current password is invalid');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is invalid');
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.userModel.findByIdAndUpdate(id, { password: hashed }, { new: true }).exec();
  }

  /** Generates a raw password reset token and stores only its hash. */
  async requestPasswordReset(email: string): Promise<{ rawToken: string; expiresAt: Date; user: UserDocument } | undefined> {
    const user = await this.findByEmail(email);
    if (!user) return undefined;
    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.userModel
      .findByIdAndUpdate(String(user._id), {
        passwordResetToken: this.hashToken(rawToken),
        passwordResetExpires: expiresAt,
      })
      .exec();
    return { rawToken, expiresAt, user };
  }

  /** Resets an account password using a valid raw reset token. */
  async resetPassword(rawToken: string, newPassword: string) {
    const user = await this.userModel
      .findOne({ passwordResetToken: this.hashToken(rawToken), passwordResetExpires: { $gt: new Date() } })
      .exec();
    if (!user) throw new BadRequestException('Invalid or expired reset token');
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.userModel
      .findByIdAndUpdate(String(user._id), {
        password: hashed,
        $unset: { passwordResetToken: '', passwordResetExpires: '' },
      })
      .exec();
    return user;
  }

  /** Hashes reset tokens before persistence. */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
