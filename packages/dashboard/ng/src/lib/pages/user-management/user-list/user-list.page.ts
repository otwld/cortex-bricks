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
  @ViewChild('dt') dt!: Table;
  @ViewChild('actionMenu') actionMenu!: Menu;

  readonly users = signal<UserListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedUserId = signal<string | null>(null);
  readonly invitationResult = signal<UserInvitationResult | null>(null);
  readonly copiedInvitation = signal(false);

  selectedUsers: UserListItem[] = [];
  searchValue = '';
  first = 0;
  rows = 8;

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
   * Runs ng on init.
   */
  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Runs load users.
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
   * Runs toggle menu.
   *
   * @param event - event value.
   *
   * @param userId - user id value.
   */
  toggleMenu(event: Event, userId: string): void {
    this.selectedUserId.set(userId);
    this.actionMenu.toggle(event);
  }

  /**
   * Runs on global filter.
   *
   * @param table - table value.
   *
   * @param event - event value.
   */
  onGlobalFilter(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  /**
   * Runs add new user.
   */
  addNewUser(): void {
    this.router.navigate(['/dashboard/profile/create/basic-information']);
  }

  /**
   * Runs resend invitation.
   *
   * @param userId - user id value.
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
   * Runs confirm delete.
   *
   * @param userId - user id value.
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
   * Runs deactivate user.
   *
   * @param userId - user id value.
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
   * Runs get account severity.
   *
   * @param status - status value.
   *
   * @returns The user list page get account severity result.
   */
  getAccountSeverity(status: UserAccountStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    if (status === UserAccountStatus.Active) return 'success';
    if (status === UserAccountStatus.Inactive) return 'warn';
    return 'secondary';
  }

  /**
   * Runs get invitation severity.
   *
   * @param status - status value.
   *
   * @returns The user list page get invitation severity result.
   */
  getInvitationSeverity(status: UserInvitationStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    if (status === UserInvitationStatus.Accepted) return 'success';
    if (status === UserInvitationStatus.Pending) return 'info';
    if (status === UserInvitationStatus.Expired) return 'warn';
    return 'secondary';
  }

  /**
   * Runs role label.
   *
   * @param user - user value.
   *
   * @returns The user list page role label result.
   */
  roleLabel(user: UserListItem): string {
    return user.roles.map((role) => role.name).join(', ') || 'None';
  }

  /**
   * Runs is storage avatar.
   *
   * @param value - value value.
   *
   * @returns The user list page is storage avatar result.
   */
  isStorageAvatar(value: string | undefined | null): boolean {
    return Boolean(value && !/^(https?:|data:|blob:|\/)/i.test(value));
  }

  /**
   * Runs copy invitation link.
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
   * Runs open invitation link.
   */
  openInvitationLink(): void {
    const link = this.invitationResult()?.link;
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  /**
   * Runs clear invitation result.
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
