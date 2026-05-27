import { Component, computed, EventEmitter, input, model, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

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

interface Contact {
    id: number;
    name: string;
    avatar?: string;
    role?: string;
    company?: string;
    status?: string;
}

interface OnlineUser {
    id: number;
    name: string;
    avatar: string;
    isViewed: boolean;
}

/** Chat conversation and contact menu. */
@Component({
    selector: 'app-chat-menu',
    imports: [CommonModule, FormsModule, ButtonModule, AvatarModule, DialogModule, InputTextModule, IconFieldModule, InputIconModule, BadgeModule, OverlayBadgeModule],
    templateUrl: './chat-menu.html',
})
export class ChatMenu implements OnInit {
    chatRooms = input<ChatRoom[]>([]);
    activeChatId = input<number | null>(null);
    /**
     * Runs select chat event.
     */
    @Output() selectChatEvent = new EventEmitter<number>();
    /**
     * Runs new chat event.
     */
    @Output() newChatEvent = new EventEmitter<Contact>();

    activeTabIndex = 0;
    showNewChatDialog = false;
    searchQuery = model('');
    userData = signal<Record<number, Contact>>({});

    onlineUsers: OnlineUser[] = [
        { id: 1, name: 'Amy Elsner', avatar: 'amyelsner.png', isViewed: false },
        { id: 2, name: 'Anna Fali', avatar: 'annafali.png', isViewed: false },
        { id: 3, name: 'Asiya Javayant', avatar: 'asiyajavayant.png', isViewed: false },
        { id: 4, name: 'Bernardo Dominic', avatar: 'bernardodominic.png', isViewed: false },
        { id: 5, name: 'Elwin Sharvill', avatar: 'elwinsharvill.png', isViewed: true },
        { id: 6, name: 'Ioni Bowcher', avatar: 'ionibowcher.png', isViewed: true },
        { id: 7, name: 'Ivan Magalhaes', avatar: 'ivanmagalhaes.png', isViewed: true }
    ];

    /**
     * Runs ng on init.
     */
    async ngOnInit() {
        const response = await fetch('/demo/data/chatData.json');
        const data = await response.json();
        this.userData.set(data.userData);
    }

    /**
     * Runs get avatar initials.
     *
     * @param name - name value.
     *
     * @returns The chat menu get avatar initials result.
     */
    getAvatarInitials(name: string): string {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    }

    /**
     * Runs select chat.
     *
     * @param chat - chat value.
     */
    selectChat(chat: ChatRoom) {
        this.selectChatEvent.emit(chat.id);
    }

    /**
     * Runs open new chat dialog.
     */
    openNewChatDialog() {
        this.showNewChatDialog = true;
    }

    /**
     * Runs select contact.
     *
     * @param contact - contact value.
     */
    selectContact(contact: Contact) {
        const existingChat = this.chatRooms().find((chat) => chat.type === 'individual' && chat.name === contact.name);

        if (existingChat) {
            this.selectChatEvent.emit(existingChat.id);
        } else {
            this.newChatEvent.emit(contact);
        }

        this.showNewChatDialog = false;
    }

    /**
     * Runs filter chats by search.
     *
     * @param chats - chats value.
     *
     * @returns The chat menu filter chats by search result.
     */
    filterChatsBySearch(chats: ChatRoom[]): ChatRoom[] {
        if (!this.searchQuery().trim()) return chats;
        const query = this.searchQuery().toLowerCase().trim();
        return chats.filter((chat) => chat.name.toLowerCase().includes(query));
    }

    pinnedChats = computed(() => {
        const pinnedChatsList = this.chatRooms().filter((chat) => chat.pinned && !chat.archived);
        return this.filterChatsBySearch(pinnedChatsList);
    });

    allChats = computed(() => {
        const nonArchivedChats = this.chatRooms().filter((chat) => !chat.archived);
        return this.filterChatsBySearch(nonArchivedChats);
    });

    groupChats = computed(() => {
        const nonArchivedGroupChats = this.chatRooms().filter((chat) => chat.type === 'group' && !chat.archived);
        return this.filterChatsBySearch(nonArchivedGroupChats);
    });

    unreadChats = computed(() => {
        const nonArchivedUnreadChats = this.chatRooms().filter((chat) => (chat.unreadCount ?? 0) > 0 && !chat.archived);
        return this.filterChatsBySearch(nonArchivedUnreadChats);
    });

    archivedChats = computed(() => {
        const archivedChatList = this.chatRooms().filter((chat) => chat.archived);
        return this.filterChatsBySearch(archivedChatList);
    });

    hasArchivedChats = computed(() => this.archivedChats().length > 0);

    availableContacts = computed(() => {
        return Object.values(this.userData());
    });

    /**
     * Runs get last message.
     *
     * @param chat - chat value.
     *
     * @returns The chat menu get last message result.
     */
    getLastMessage(chat: ChatRoom): string {
        if (!chat.messages || chat.messages.length === 0) {
            return 'Start conversation';
        }
        const lastMessage = chat.messages[chat.messages.length - 1];
        return lastMessage.content;
    }

    /**
     * Runs get last message sender.
     *
     * @param chat - chat value.
     *
     * @returns The chat menu get last message sender result.
     */
    getLastMessageSender(chat: ChatRoom): string {
        if (!chat.messages || chat.messages.length === 0) {
            return '';
        }
        const lastMessage = chat.messages[chat.messages.length - 1];
        return lastMessage.senderId === 'me' ? 'You' : lastMessage.senderName;
    }

    /**
     * Runs get last message time.
     *
     * @param chat - chat value.
     *
     * @returns The chat menu get last message time result.
     */
    getLastMessageTime(chat: ChatRoom): string {
        if (!chat.messages || chat.messages.length === 0) {
            return '';
        }
        const lastMessage = chat.messages[chat.messages.length - 1];
        return lastMessage.time;
    }

    /**
     * Runs encode uricomponent.
     *
     * @param str - str value.
     *
     * @returns The chat menu encode uricomponent result.
     */
    encodeURIComponent(str: string): string {
        return encodeURIComponent(str);
    }
}
