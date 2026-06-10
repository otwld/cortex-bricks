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
    /**
     * Chat rooms available to the menu for filtering and selection.
     */
    chatRooms = input<ChatRoom[]>([]);

    /**
     * Currently active chat room id used to highlight the selected conversation.
     */
    activeChatId = input<number | null>(null);

    /**
     * Emits when the user selects an existing chat room from the menu.
     */
    @Output() selectChatEvent = new EventEmitter<number>();

    /**
     * Emits when the user selects a contact that does not yet have a chat room.
     */
    @Output() newChatEvent = new EventEmitter<Contact>();

    /**
     * Active tab index for the chat menu category tabs.
     */
    activeTabIndex = 0;

    /**
     * Whether the new chat contact dialog is visible.
     */
    showNewChatDialog = false;

    /**
     * Search query applied to all chat category lists.
     */
    searchQuery = model('');

    /**
     * Contact records loaded from the demo chat data file.
     */
    userData = signal<Record<number, Contact>>({});

    /**
     * Online user carousel entries shown above the chat list.
     */
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
     * Loads demo contact data used by the new chat dialog.
     */
    async ngOnInit() {
        const response = await fetch('/demo/data/chatData.json');
        const data = await response.json();
        this.userData.set(data.userData);
    }

    /**
     * Builds uppercase initials for a chat or contact avatar fallback.
     *
     * @param name - Display name to abbreviate.
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
     * Emits the selected chat id to the parent chat page.
     *
     * @param chat - Chat room selected by the user.
     */
    selectChat(chat: ChatRoom) {
        this.selectChatEvent.emit(chat.id);
    }

    /**
     * Opens the contact picker for starting a chat.
     */
    openNewChatDialog() {
        this.showNewChatDialog = true;
    }

    /**
     * Selects an existing individual chat for the contact or emits a new-chat request.
     *
     * @param contact - Contact selected in the new chat dialog.
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
     * Applies the current search query to a chat list.
     *
     * @param chats - Chat rooms to filter.
     * @returns Matching chat rooms, or the original list when search is empty.
     */
    filterChatsBySearch(chats: ChatRoom[]): ChatRoom[] {
        if (!this.searchQuery().trim()) return chats;
        const query = this.searchQuery().toLowerCase().trim();
        return chats.filter((chat) => chat.name.toLowerCase().includes(query));
    }

    /**
     * Pinned, non-archived chats after applying search.
     */
    pinnedChats = computed(() => {
        const pinnedChatsList = this.chatRooms().filter((chat) => chat.pinned && !chat.archived);
        return this.filterChatsBySearch(pinnedChatsList);
    });

    /**
     * Non-archived chats after applying search.
     */
    allChats = computed(() => {
        const nonArchivedChats = this.chatRooms().filter((chat) => !chat.archived);
        return this.filterChatsBySearch(nonArchivedChats);
    });

    /**
     * Non-archived group chats after applying search.
     */
    groupChats = computed(() => {
        const nonArchivedGroupChats = this.chatRooms().filter((chat) => chat.type === 'group' && !chat.archived);
        return this.filterChatsBySearch(nonArchivedGroupChats);
    });

    /**
     * Non-archived chats with unread messages after applying search.
     */
    unreadChats = computed(() => {
        const nonArchivedUnreadChats = this.chatRooms().filter((chat) => (chat.unreadCount ?? 0) > 0 && !chat.archived);
        return this.filterChatsBySearch(nonArchivedUnreadChats);
    });

    /**
     * Archived chats after applying search.
     */
    archivedChats = computed(() => {
        const archivedChatList = this.chatRooms().filter((chat) => chat.archived);
        return this.filterChatsBySearch(archivedChatList);
    });

    /**
     * Whether the archive tab should be available.
     */
    hasArchivedChats = computed(() => this.archivedChats().length > 0);

    /**
     * Contacts available for starting new one-on-one chats.
     */
    availableContacts = computed(() => {
        return Object.values(this.userData());
    });

    /**
     * Returns the preview text for the latest message in a chat.
     *
     * @param chat - Chat room to inspect.
     * @returns Latest message text, or a start prompt for empty chats.
     */
    getLastMessage(chat: ChatRoom): string {
        if (!chat.messages || chat.messages.length === 0) {
            return 'Start conversation';
        }
        const lastMessage = chat.messages[chat.messages.length - 1];
        return lastMessage.content;
    }

    /**
     * Returns the display sender for a chat's latest message.
     *
     * @param chat - Chat room to inspect.
     * @returns "You" for messages from the current user, otherwise the sender name.
     */
    getLastMessageSender(chat: ChatRoom): string {
        if (!chat.messages || chat.messages.length === 0) {
            return '';
        }
        const lastMessage = chat.messages[chat.messages.length - 1];
        return lastMessage.senderId === 'me' ? 'You' : lastMessage.senderName;
    }

    /**
     * Returns the display time for a chat's latest message.
     *
     * @param chat - Chat room to inspect.
     * @returns Latest message time, or an empty string for empty chats.
     */
    getLastMessageTime(chat: ChatRoom): string {
        if (!chat.messages || chat.messages.length === 0) {
            return '';
        }
        const lastMessage = chat.messages[chat.messages.length - 1];
        return lastMessage.time;
    }

    /**
     * Exposes URL encoding to the template for avatar image paths.
     *
     * @param str - Raw string to encode.
     * @returns URI component encoded string.
     */
    encodeURIComponent(str: string): string {
        return encodeURIComponent(str);
    }
}
