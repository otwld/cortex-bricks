import { AsyncPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from '@otwld/ng-users/core';
import { StoSignedUrlPipe } from '@otwld/ng-storage';
import { UserAccountStatus, UserInvitationResult, UserInvitationStatus, UserListItem } from '@otwld/ts-users';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

/** User list page backed by the real user-management API. */
@Component({
  selector: 'app-user-list-page',
  imports: [
    AsyncPipe,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    MenuModule,
    ConfirmDialogModule,
    StoSignedUrlPipe,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user-list.page.html',
})
export class UserListPage implements OnInit {
  /**
   * PrimeNG table instance used for global filtering.
   */
  @ViewChild('dt') dt!: Table;

  /**
   * Row action menu opened for the selected user.
   */
  @ViewChild('actionMenu') actionMenu!: Menu;

  /**
   * Users loaded from the user-management API.
   */
  readonly users = signal<UserListItem[]>([]);

  /**
   * Whether the user table is currently loading API data.
   */
  readonly loading = signal(false);

  /**
   * User-facing load error message for the table.
   */
  readonly error = signal<string | null>(null);

  /**
   * User id currently associated with the row action menu.
   */
  readonly selectedUserId = signal<string | null>(null);

  /**
   * Most recent invitation result returned by the resend invitation API.
   */
  readonly invitationResult = signal<UserInvitationResult | null>(null);

  /**
   * Whether the current invitation link has been copied in this dialog session.
   */
  readonly copiedInvitation = signal(false);

  /**
   * Users selected in the table for bulk UI state.
   */
  selectedUsers: UserListItem[] = [];

  /**
   * Current text shown in the global table search input.
   */
  searchValue = '';

  /**
   * First table row index for pagination.
   */
  first = 0;

  /**
   * Number of users shown per table page.
   */
  rows = 8;

  /**
   * Row action menu items for the currently selected user id.
   */
  readonly menuItems = computed<MenuItem[]>(() => {
    const userId = this.selectedUserId();
    if (!userId) return [];
    return [
      {
        label: 'Resend invitation',
        icon: 'pi pi-send',
        command: () => this.resendInvitation(userId),
      },
      {
        label: 'Deactivate',
        icon: 'pi pi-trash',
        command: () => this.confirmDelete(userId),
      },
    ];
  });

  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  /**
   * Loads users when the page initializes.
   */
  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Loads users from the API and updates loading/error state for the table.
   */
  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.usersService.list().subscribe({
      next: ({ users }) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load users.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Opens the row action menu for one user.
   *
   * @param event - Browser event used to anchor the popup menu.
   * @param userId - User id represented by the clicked row.
   */
  toggleMenu(event: Event, userId: string): void {
    this.selectedUserId.set(userId);
    this.actionMenu.toggle(event);
  }

  /**
   * Applies the global PrimeNG table filter from the search input.
   *
   * @param table - PrimeNG table to filter.
   * @param event - Input event containing the search value.
   */
  onGlobalFilter(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  /**
   * Navigates to the first step of the user creation workflow.
   */
  addNewUser(): void {
    this.router.navigate(['/dashboard/profile/create/basic-information']);
  }

  /**
   * Requests a fresh invitation link for a user and displays the returned delivery state.
   *
   * @param userId - User id that should receive a new invitation.
   */
  resendInvitation(userId: string): void {
    this.usersService.resendInvitation(userId).subscribe({
      next: (response) => {
        const invitation = response.invitation ?? this.legacyInvitation(response);
        this.invitationResult.set(invitation);
        this.copiedInvitation.set(false);
        this.messageService.add({
          severity: invitation?.deliveryStatus === 'sent' ? 'success' : 'info',
          summary: invitation?.deliveryStatus === 'sent' ? 'Invitation sent' : 'Invitation link ready',
        });
        this.loadUsers();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Invitation failed' }),
    });
  }

  /**
   * Opens a confirmation dialog before deactivating a user.
   *
   * @param userId - User id selected for deactivation.
   */
  confirmDelete(userId: string): void {
    this.confirmationService.confirm({
      message: 'Deactivate this user?',
      header: 'Confirm deactivation',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Deactivate',
        severity: 'danger',
      },
      accept: () => this.deactivateUser(userId),
    });
  }

  /**
   * Deactivates a user through the API and reloads the table on success.
   *
   * @param userId - User id to deactivate.
   */
  deactivateUser(userId: string): void {
    this.usersService.delete(userId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'User deactivated' });
        this.loadUsers();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Could not deactivate user' }),
    });
  }

  /**
   * Maps account status to the PrimeNG tag severity used in the table.
   *
   * @param status - User account status.
   * @returns PrimeNG severity for the account status badge.
   */
  getAccountSeverity(status: UserAccountStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    if (status === UserAccountStatus.Active) return 'success';
    if (status === UserAccountStatus.Inactive) return 'warn';
    return 'secondary';
  }

  /**
   * Maps invitation status to the PrimeNG tag severity used in the table.
   *
   * @param status - Invitation status returned by the API.
   * @returns PrimeNG severity for the invitation status badge.
   */
  getInvitationSeverity(status: UserInvitationStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    if (status === UserInvitationStatus.Accepted) return 'success';
    if (status === UserInvitationStatus.Pending) return 'info';
    if (status === UserInvitationStatus.Expired) return 'warn';
    return 'secondary';
  }

  /**
   * Formats a comma-separated role label for the user table.
   *
   * @param user - User row whose roles should be displayed.
   * @returns Role names joined for display, or `None` when no roles are assigned.
   */
  roleLabel(user: UserListItem): string {
    return user.roles.map((role) => role.name).join(', ') || 'None';
  }

  /**
   * Determines whether an avatar value should be resolved through storage.
   *
   * @param value - Avatar URL or storage key.
   * @returns True when the value is a storage key rather than an absolute or root-relative URL.
   */
  isStorageAvatar(value: string | undefined | null): boolean {
    return Boolean(value && !/^(https?:|data:|blob:|\/)/i.test(value));
  }

  /**
   * Copies the current invitation link to the clipboard with a DOM fallback.
   */
  async copyInvitationLink(): Promise<void> {
    const link = this.invitationResult()?.link;
    if (!link) return;

    try {
      await navigator.clipboard?.writeText(link);
    } catch {
      this.copyWithFallback(link);
    }
    this.copiedInvitation.set(true);
  }

  /**
   * Opens the current invitation link in a new tab when one is available.
   */
  openInvitationLink(): void {
    const link = this.invitationResult()?.link;
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  /**
   * Clears the invitation dialog state and copy confirmation.
   */
  clearInvitationResult(): void {
    this.invitationResult.set(null);
    this.copiedInvitation.set(false);
  }

  private legacyInvitation(response: { invitationLink?: string; invitationExpiresAt?: string }): UserInvitationResult | null {
    if (!response.invitationLink || !response.invitationExpiresAt) return null;
    return {
      link: response.invitationLink,
      expiresAt: response.invitationExpiresAt,
      deliveryStatus: 'not-requested',
    };
  }

  private copyWithFallback(link: string): void {
    const input = document.createElement('textarea');
    input.value = link;
    input.setAttribute('readonly', 'true');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
}
