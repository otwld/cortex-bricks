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
    /**
     * Runs show contact info.
     */
    @Input() showContactInfo = false;
    /**
     * Runs show user profile.
     */
    @Input() showUserProfile = false;
    /**
     * Runs active chat.
     */
    @Input() activeChat: ChatRoom | null = null;
    /**
     * Runs selected user.
     */
    @Input() selectedUser: SelectedUser | null = null;
    /**
     * Runs open user profile event.
     */
    @Output() openUserProfileEvent = new EventEmitter<number>();
    /**
     * Runs close user profile event.
     */
    @Output() closeUserProfileEvent = new EventEmitter<void>();
    /**
     * Runs toggle contact info event.
     */
    @Output() toggleContactInfoEvent = new EventEmitter<void>();

    /**
     * Runs get avatar initials.
     *
     * @param name - name value.
     *
     * @returns The chat sidebar get avatar initials result.
     */
    getAvatarInitials(name: string): string {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    }

    /**
     * Runs open user profile.
     *
     * @param userId - user id value.
     */
    openUserProfile(userId: number) {
        this.openUserProfileEvent.emit(userId);
    }

    /**
     * Runs close user profile.
     */
    closeUserProfile() {
        this.closeUserProfileEvent.emit();
    }

    /**
     * Runs toggle contact info.
     */
    toggleContactInfo() {
        this.toggleContactInfoEvent.emit();
    }
}
