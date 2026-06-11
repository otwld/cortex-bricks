import {
  UserAccountStatus,
  UserInvitationStatus,
} from '@otwld/ts-users';
import { UserInvitationRepository } from './user-invitations.repository';
import { UsersRepository } from './users.repository';

describe('users persistence helpers', () => {
  it('maps profile documents into safe profile DTOs', () => {
    const repository = Object.create(UsersRepository.prototype) as UsersRepository;
    const profile = repository.toProfileDto({
      _id: 'profile-1',
      authUserId: 'auth-1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      invitationStatus: UserInvitationStatus.Pending,
      roles: [],
      permissions: [],
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      updatedAt: new Date('2026-05-07T00:00:00.000Z'),
    });

    expect(profile).toMatchObject({
      id: 'profile-1',
      authUserId: 'auth-1',
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      invitationStatus: UserInvitationStatus.Pending,
    });
  });

  it('hashes raw invitation tokens before persistence lookup', () => {
    const repository = Object.create(UserInvitationRepository.prototype) as UserInvitationRepository;
    const hash = repository.hashToken('raw-token');

    expect(hash).toHaveLength(64);
    expect(hash).not.toBe('raw-token');
  });
});
