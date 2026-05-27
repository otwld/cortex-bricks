import { Injectable, signal } from '@angular/core';
import {
  UserAccountStatus,
  UserGender,
} from '@otwld/ts-users';
import type { CreateUserRequest, UserEmploymentType, UserPermission, UserRole } from '@otwld/ts-users';

/** User creation wizard form state. */
export interface FormState {
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  gender: UserGender | null;
  department: string;
  position: string;
  employmentType: UserEmploymentType | null;
  hybridWork: boolean;
  officeLocation: string;
  country: string;
  region: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  accountStatus: UserAccountStatus;
  roles: UserRole[];
  permissions: UserPermission[];
  sendInvitation: boolean;
  internalNotes: string;
}

const initialFormState: FormState = {
  username: '',
  firstName: '',
  lastName: '',
  displayName: '',
  email: '',
  phone: '',
  bio: '',
  avatar: '',
  gender: null,
  department: '',
  position: '',
  employmentType: 'full-time',
  hybridWork: false,
  officeLocation: '',
  country: '',
  region: '',
  city: '',
  postalCode: '',
  addressLine1: '',
  addressLine2: '',
  accountStatus: UserAccountStatus.Active,
  roles: [{ name: 'member', permissions: [] }],
  permissions: [],
  sendInvitation: true,
  internalNotes: '',
};

/** Shared reactive state for the multi-step user creation wizard. */
@Injectable()
export class FormStateService {
  readonly formState = signal<FormState>({ ...initialFormState, roles: [...initialFormState.roles], permissions: [] });

  /**
   * Runs update field.
   *
   * @param field - field value.
   *
   * @param value - value value.
   */
  updateField<K extends keyof FormState>(field: K, value: FormState[K]): void {
    this.formState.update((state) => ({
      ...state,
      [field]: value,
    }));
  }

  /**
   * Runs to create user request.
   *
   * @returns The form state service to create user request result.
   */
  toCreateUserRequest(): CreateUserRequest {
    const state = this.formState();
    const email = state.email.trim();
    const firstName = optionalString(state.firstName);
    const lastName = optionalString(state.lastName);
    const inferredDisplayName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    const displayName = optionalString(state.displayName) ?? (inferredDisplayName || email);
    return {
      email,
      username: optionalString(state.username),
      firstName,
      lastName,
      displayName,
      bio: optionalString(state.bio),
      avatar: optionalString(state.avatar),
      gender: state.gender || undefined,
      phone: optionalString(state.phone),
      department: optionalString(state.department),
      position: optionalString(state.position),
      employmentType: state.employmentType || undefined,
      hybridWork: state.hybridWork,
      officeLocation: optionalString(state.officeLocation),
      country: optionalString(state.country),
      region: optionalString(state.region),
      city: optionalString(state.city),
      postalCode: optionalString(state.postalCode),
      addressLine1: optionalString(state.addressLine1),
      addressLine2: optionalString(state.addressLine2),
      accountStatus: state.accountStatus,
      roles: state.roles,
      permissions: state.permissions,
      sendInvitation: state.sendInvitation,
      internalNotes: optionalString(state.internalNotes),
    };
  }

  /**
   * Runs reset.
   */
  reset(): void {
    this.formState.set({ ...initialFormState, roles: [...initialFormState.roles], permissions: [] });
  }
}

function optionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
