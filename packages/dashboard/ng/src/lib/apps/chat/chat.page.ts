import { Component, inject, computed, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { Card } from 'primeng/card';
import { ChatMenu } from './chat-menu';
import { ChatBox } from './chatbox';
import { ChatSidebar } from './chatsidebar';

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

interface CurrentUser {
    id: string;
    name: string;
    avatar?: string;
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

interface Contact {
    id: number;
    name: string;
    avatar?: string;
    role?: string;
    company?: string;
    status?: string;
}

/** Chat application shell with conversation list, message pane, and contact sidebar. */
@Component({
    selector: 'app-chat',
    imports: [CommonModule, ButtonModule, MenuModule, ConfirmDialogModule, ChatMenu, ChatBox, ChatSidebar, Card],
    providers: [ConfirmationService],
    templateUrl: './chat.page.html',
})
export class ChatPage implements OnInit {
    /**
     * Overflow menu used for actions on the active chat.
     */
    @ViewChild('menu') menu!: Menu;

    /**
     * Chat room collection loaded from the demo chat data file.
     */
    chatRooms = signal<ChatRoom[]>([]);

    /**
     * Current chat user metadata used when sending messages.
     */
    currentUser = signal<CurrentUser>({ id: 'me', name: 'You' });

    /**
     * Contact profile records keyed by user id for the sidebar profile view.
     */
    userData = signal<Record<number, SelectedUser>>({});

    /**
     * Chat room id currently open in the message pane.
     */
    activeChatId = signal<number | null>(1);

    /**
     * Whether the group chat contact information sidebar is visible.
     */
    showContactInfo = false;

    /**
     * Whether the one-on-one user profile sidebar is visible.
     */
    showUserProfile = false;

    /**
     * User id currently open in the profile sidebar.
     */
    selectedUserId = signal<number | null>(null);

    /**
     * Whether the responsive mobile chat view is showing messages instead of the menu.
     */
    showChatView = false;

    /**
     * Active chat room resolved from the selected chat id.
     */
    activeChat = computed(() => {
        return this.chatRooms().find((chat) => chat.id === this.activeChatId()) ?? null;
    });

    /**
     * Contact profile resolved from the selected user id.
     */
    selectedUser = computed(() => {
        const userId = this.selectedUserId();
        return userId ? this.userData()[userId] : null;
    });

    /**
     * Action menu items for pinning, deleting, archiving, or restoring the active chat.
     */
    menuItems = computed<MenuItem[]>(() => {
        this.chatRooms();
        const chat = this.activeChat();
        return [
            {
                label: chat?.pinned ? 'Unpin Chat' : 'Pin Chat',
                icon: 'pi pi-thumbtack',
                command: () => this.togglePin()
            },
            {
                label: 'Delete Chat',
                icon: 'pi pi-trash',
                command: () => this.deleteChat()
            },
            {
                label: chat?.archived ? 'Restore Chat' : 'Archive Chat',
                icon: chat?.archived ? 'pi pi-replay' : 'pi pi-inbox',
                command: () => (chat?.archived ? this.restoreChat() : this.archiveChat())
            }
        ];
    });
    private readonly confirmationService = inject(ConfirmationService);

    /**
     * Loads chat rooms, current user metadata, and contact profiles from demo data.
     */
    async ngOnInit() {
        const response = await fetch('/demo/data/chatData.json');
        const data = await response.json();
        this.chatRooms.set(data.chatRooms);
        this.currentUser.set(data.currentUser);
        this.userData.set(data.userData);
    }

    /**
     * Confirms and deletes the active chat, then selects the next available room.
     */
    deleteChat() {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${this.activeChat()?.name}"? This action cannot be undone.`,
            header: 'Delete Chat',
            rejectButtonProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: 'Delete',
                severity: 'danger'
            },
            accept: () => {
                const rooms = this.chatRooms();
                const chatIndex = rooms.findIndex((chat) => chat.id === this.activeChatId());
                if (chatIndex !== -1) {
                    rooms.splice(chatIndex, 1);
                    this.chatRooms.set([...rooms]);
                    if (rooms.length > 0) {
                        this.activeChatId.set(rooms[0].id);
                    } else {
                        this.activeChatId.set(null);
                        this.showChatView = false;
                    }
                }
            }
        });
    }

    /**
     * Archives the active chat and selects the next non-archived room when available.
     */
    archiveChat() {
        const rooms = this.chatRooms();
        const chat = rooms.find((c) => c.id === this.activeChatId());
        if (chat) {
            chat.archived = true;
            this.chatRooms.set([...rooms]);
            const availableChats = rooms.filter((c) => !c.archived);
            if (availableChats.length > 0) {
                this.activeChatId.set(availableChats[0].id);
            } else {
                this.activeChatId.set(null);
                this.showChatView = false;
            }
        }
    }

    /**
     * Restores the active archived chat to the normal chat lists.
     */
    restoreChat() {
        const rooms = this.chatRooms();
        const chat = rooms.find((c) => c.id === this.activeChatId());
        if (chat) {
            chat.archived = false;
            this.chatRooms.set([...rooms]);
        }
    }

    /**
     * Toggles the pinned state of the active chat.
     */
    togglePin() {
        const rooms = this.chatRooms();
        const chat = rooms.find((c) => c.id === this.activeChatId());
        if (chat) {
            chat.pinned = !chat.pinned;
            this.chatRooms.set([...rooms]);
        }
    }

    /**
     * Formats participant names for compact group chat headers.
     *
     * @param participants - Group chat participants to display.
     * @returns Up to three participant names, followed by an ellipsis when more exist.
     */
    formatParticipants(participants: Participant[]): string {
        if (participants.length <= 3) {
            return participants.map((p) => p.name).join(', ');
        }
        const first3 = participants
            .slice(0, 3)
            .map((p) => p.name)
            .join(', ');
        return `${first3} ...`;
    }

    /**
     * Toggles the appropriate sidebar for the active chat type.
     */
    toggleContactInfo() {
        if (this.activeChat()?.type === 'individual') {
            if (this.showUserProfile) {
                this.closeUserProfile();
            } else {
                const participant = this.activeChat()?.participants?.[0];
                if (participant) {
                    this.openUserProfile(participant.id);
                }
            }
        } else {
            this.showContactInfo = !this.showContactInfo;
            this.showUserProfile = false;
        }
    }

    /**
     * Opens a one-on-one participant profile sidebar.
     *
     * @param userId - Participant id to resolve from profile data.
     */
    openUserProfile(userId: string | number) {
        this.selectedUserId.set(Number(userId));
        this.showUserProfile = true;
        this.showContactInfo = false;
    }

    /**
     * Closes the user profile sidebar and clears the selected profile id.
     */
    closeUserProfile() {
        this.showUserProfile = false;
        this.selectedUserId.set(null);
    }

    /**
     * Opens the active chat overflow menu.
     *
     * @param event - Browser event used to anchor the popup menu.
     */
    showMenu(event: Event) {
        this.menu.toggle(event);
    }

    /**
     * Selects a chat and opens the responsive message view.
     *
     * @param chatId - Chat room id selected from the menu.
     */
    selectChat(chatId: number) {
        this.activeChatId.set(chatId);
        this.showChatView = true;
    }

    /**
     * Returns the responsive layout from the message pane to the chat menu.
     */
    goBackToMenu() {
        this.showChatView = false;
    }

    /**
     * Creates and selects a new one-on-one chat for a contact.
     *
     * @param contact - Contact selected from the new chat dialog.
     */
    createNewChat(contact: Contact) {
        const rooms = this.chatRooms();
        const newChatId = Math.max(...rooms.map((c) => c.id)) + 1;

        const newChat: ChatRoom = {
            id: newChatId,
            name: contact.name,
            type: 'individual',
            archived: false,
            avatar: contact.avatar,
            lastMessage: 'Start a conversation...',
            lastMessageSender: undefined,
            lastMessageTime: 'Now',
            unreadCount: 0,
            messages: []
        };

        this.chatRooms.set([newChat, ...rooms]);
        this.activeChatId.set(newChatId);
        this.showChatView = true;
    }

    /**
     * Appends a sent message to the active chat room.
     *
     * @param message - Message emitted by the chat box.
     */
    handleSendMessage(message: Message) {
        const rooms = this.chatRooms();
        const chat = rooms.find((c) => c.id === this.activeChatId());
        if (chat) {
            chat.messages.push(message);
            this.chatRooms.set([...rooms]);
        }
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
