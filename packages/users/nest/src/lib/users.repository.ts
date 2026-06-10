import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserAccountStatus, UserInvitationStatus, UserProfile } from '@otwld/ts-users';
import { ClientSession, Model } from 'mongoose';
import { UserProfileDocument, UserProfileRecord } from './schemas/user-profile.schema';

type ProfileLike = Partial<UserProfileRecord> & {
  _id?: unknown;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  emailVerified?: boolean;
};

/** Persistence gateway for user profile documents. */
@Injectable()
export class UsersRepository {
  /** Create the users repository. */
  constructor(@InjectModel(UserProfileRecord.name) private readonly profileModel: Model<UserProfileDocument>) {}

  /** Creates a user profile. */
  async create(dto: Partial<UserProfileRecord>, session?: ClientSession): Promise<UserProfile> {
    const document = await new this.profileModel(dto).save({ session });
    return this.toProfileDto(document);
  }

  /** Lists non-deleted user profiles. */
  async listActive(): Promise<UserProfile[]> {
    const documents = await this.profileModel.find({ accountStatus: { $ne: UserAccountStatus.Deleted } }).sort({ createdAt: -1 }).exec();
    return documents.map((document) => this.toProfileDto(document));
  }

  /** Finds one profile by id. */
  async findById(id: string): Promise<UserProfile | null> {
    const document = await this.profileModel.findById(id).exec();
    return document ? this.toProfileDto(document) : null;
  }

  /** Finds one profile by linked auth user id. */
  async findByAuthUserId(authUserId: string): Promise<UserProfile | null> {
    const document = await this.profileModel.findOne({ authUserId }).exec();
    return document ? this.toProfileDto(document) : null;
  }

  /** Updates one profile by id. */
  async updateById(id: string, update: Partial<UserProfileRecord>, session?: ClientSession): Promise<UserProfile | null> {
    const document = await this.profileModel.findByIdAndUpdate(id, update, { new: true, session }).exec();
    return document ? this.toProfileDto(document) : null;
  }

  /** Updates one profile by linked auth user id. */
  async updateByAuthUserId(authUserId: string, update: Partial<UserProfileRecord>, session?: ClientSession): Promise<UserProfile | null> {
    const document = await this.profileModel.findOneAndUpdate({ authUserId }, update, { new: true, session }).exec();
    return document ? this.toProfileDto(document) : null;
  }

  /** Soft deletes a profile. */
  async softDelete(id: string, session?: ClientSession): Promise<UserProfile | null> {
    return this.updateById(id, { accountStatus: UserAccountStatus.Deleted }, session);
  }

  /** Converts a profile document into a safe API DTO. */
  toProfileDto(document: ProfileLike): UserProfile {
    return {
      id: String(document._id ?? document.id),
      authUserId: String(document.authUserId),
      email: String(document.email),
      username: document.username,
      firstName: document.firstName,
      lastName: document.lastName,
      displayName: document.displayName ?? document.email ?? '',
      bio: document.bio,
      avatar: document.avatar,
      gender: document.gender as UserProfile['gender'],
      phone: document.phone,
      department: document.department,
      position: document.position,
      employmentType: document.employmentType as UserProfile['employmentType'],
      hybridWork: document.hybridWork,
      officeLocation: document.officeLocation,
      country: document.country,
      region: document.region,
      city: document.city,
      postalCode: document.postalCode,
      addressLine1: document.addressLine1,
      addressLine2: document.addressLine2,
      accountStatus: document.accountStatus ?? UserAccountStatus.Active,
      invitationStatus: document.invitationStatus ?? UserInvitationStatus.Pending,
      emailVerified: document.emailVerified ?? false,
      roles: document.roles ?? [],
      permissions: document.permissions ?? [],
      internalNotes: document.internalNotes,
      createdAt: this.toIso(document.createdAt),
      updatedAt: this.toIso(document.updatedAt),
      lastLoginAt: document.lastLoginAt?.toISOString(),
      invitedAt: document.invitedAt?.toISOString(),
      invitationAcceptedAt: document.invitationAcceptedAt?.toISOString(),
    };
  }

  private toIso(value: Date | undefined): string {
    return (value ?? new Date(0)).toISOString();
  }
}
