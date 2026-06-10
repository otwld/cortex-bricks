import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

interface Participant {
    id: number;
    name: string;
    avatar?: string;
    status: string;
}

interface Message {
    id: number;
    senderId: string | number;
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: string;
    time: string;
    type: string;
    isNewDay?: boolean;
    dateLabel?: string;
}

interface ChatRoom {
    id: number;
    name: string;
    type: string;
    avatar?: string;
    archived?: boolean;
    pinned?: boolean;
    participants?: Participant[];
    lastMessage?: string;
    lastMessageSender?: string;
    lastMessageTime?: string;
    unreadCount?: number;
    messages: Message[];
}

interface SelectedUser {
    id: number;
    name: string;
    avatar?: string;
    company?: string;
    role?: string;
    phone?: string;
    email?: string;
    firstContact?: string;
    createdBy?: string;
    statusTag?: string;
    access?: string;
    linkedThreads?: string[];
}

/** Chat contact information sidebar. */
@Component({
    selector: 'app-chat-sidebar',
    imports: [ButtonModule, AvatarModule, TagModule],
    templateUrl: './chatsidebar.html',
})
export class ChatSidebar {
    /** Whether the contact details pane is visible. */
    @Input() showContactInfo = false;
    /** Whether the selected user's profile pane is visible. */
    @Input() showUserProfile = false;
    /** Chat room currently selected in the chat app. */
    @Input() activeChat: ChatRoom | null = null;
    /** User currently selected in the sidebar. */
    @Input() selectedUser: SelectedUser | null = null;
    /** Emits when the profile pane should open for a user id. */
    @Output() openUserProfileEvent = new EventEmitter<number>();
    /** Emits when the profile pane should close. */
    @Output() closeUserProfileEvent = new EventEmitter<void>();
    /** Emits when the contact details pane should toggle. */
    @Output() toggleContactInfoEvent = new EventEmitter<void>();

    /** Convert a display name into initials for avatar fallback text. */
    getAvatarInitials(name: string): string {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    }

    /** Request that the selected user's profile pane opens. */
    openUserProfile(userId: number) {
        this.openUserProfileEvent.emit(userId);
    }

    /** Request that the user profile pane closes. */
    closeUserProfile() {
        this.closeUserProfileEvent.emit();
    }

    /** Request that contact information visibility toggles. */
    toggleContactInfo() {
        this.toggleContactInfoEvent.emit();
    }
}
