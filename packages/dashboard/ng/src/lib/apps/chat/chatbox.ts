import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, model, Output, ViewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';

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

interface Participant {
    id: number;
    name: string;
    avatar?: string;
    status: string;
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

interface CurrentUser {
    id: string;
    name: string;
    avatar?: string;
}

/** Chat message thread and composer. */
@Component({
    selector: 'app-chat-box',
    imports: [FormsModule, ButtonModule, AvatarModule, InputTextModule],
    templateUrl: './chatbox.html',
    host: {
        class: 'flex flex-1'
    }
})
export class ChatBox implements AfterViewChecked {
    /**
     * Runs active chat.
     */
    @Input() activeChat: ChatRoom | null = null;
    /**
     * Runs current user.
     */
    @Input() currentUser: CurrentUser = { id: 'me', name: 'You' };
    /**
     * Runs open user profile event.
     */
    @Output() openUserProfileEvent = new EventEmitter<string | number>();
    /**
     * Runs send message event.
     */
    @Output() sendMessageEvent = new EventEmitter<Message>();

    @ViewChild('messagesContainer') messagesContainer!: ElementRef;

    newMessage = model('');
    private shouldScrollToBottom = false;

    /**
     * Runs ng after view checked.
     */
    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    /**
     * Runs scroll to bottom.
     */
    scrollToBottom() {
        if (this.messagesContainer?.nativeElement) {
            this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
        }
    }

    /**
     * Runs send message.
     */
    sendMessage() {
        if (!this.newMessage().trim()) return;

        const message: Message = {
            id: Date.now(),
            senderId: this.currentUser.id,
            senderName: this.currentUser.name,
            content: this.newMessage().trim(),
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
        };

        this.sendMessageEvent.emit(message);
        this.newMessage.set('');
        this.shouldScrollToBottom = true;
    }

    /**
     * Runs get avatar initials.
     *
     * @param name - name value.
     *
     * @returns The chat box get avatar initials result.
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
    openUserProfile(userId: string | number) {
        this.openUserProfileEvent.emit(userId);
    }
}
