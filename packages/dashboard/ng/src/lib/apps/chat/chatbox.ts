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
     * Chat room whose messages are rendered in the thread.
     */
    @Input() activeChat: ChatRoom | null = null;

    /**
     * Current user metadata used when creating outgoing messages.
     */
    @Input() currentUser: CurrentUser = { id: 'me', name: 'You' };

    /**
     * Emits when a participant avatar or sender should open a profile sidebar.
     */
    @Output() openUserProfileEvent = new EventEmitter<string | number>();

    /**
     * Emits newly composed text messages to the parent chat page.
     */
    @Output() sendMessageEvent = new EventEmitter<Message>();

    /**
     * Scrollable message list container used for automatic bottom scrolling.
     */
    @ViewChild('messagesContainer') messagesContainer!: ElementRef;

    /**
     * Draft message text bound to the composer input.
     */
    newMessage = model('');
    private shouldScrollToBottom = false;

    /**
     * Scrolls to the newest message after Angular renders an outgoing message.
     */
    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    /**
     * Moves the message list to its latest rendered message.
     */
    scrollToBottom() {
        if (this.messagesContainer?.nativeElement) {
            this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
        }
    }

    /**
     * Emits a text message from the composer when the draft is not empty.
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
     * Builds uppercase initials for a sender avatar fallback.
     *
     * @param name - Sender display name.
     * @returns Initials derived from each word in the name.
     */
    getAvatarInitials(name: string): string {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    }

    /**
     * Requests that the parent component open a participant profile.
     *
     * @param userId - Participant id selected from the message thread.
     */
    openUserProfile(userId: string | number) {
        this.openUserProfileEvent.emit(userId);
    }
}
