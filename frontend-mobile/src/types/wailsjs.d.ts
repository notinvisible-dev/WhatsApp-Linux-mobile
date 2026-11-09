declare module '../../wailsjs/go/api/Api' {
  export function GetChatList(): Promise<any[]>
  export function GetChannelList(): Promise<any[]>
  export function GetCachedAvatar(jid: string, force: boolean): Promise<string>
  export function GetSelfAvatar(force: boolean): Promise<string>
  export function ToggleChatPin(chatId: string, pin: boolean): Promise<void>
  export function ToggleChatArchive(chatId: string, archive: boolean): Promise<void>
  export function SendMessage(chatId: string, options: any): Promise<void>
  export function FetchMessagesPaged(chatId: string, pageSize: number, beforeTimestamp: number, beforeId: string): Promise<any[]>
  export function GetGroupInfo(chatId: string): Promise<any>
  export function GetProfile(jid: string): Promise<any>
  export function MarkRead(chatId: string, messageIds: string[], type: string): Promise<void>
  export function SendChatPresence(chatId: string, presence: string, media: string): Promise<void>
  export function PlaceCall(chatId: string): Promise<void>
  export function GetQRCode(): Promise<string>
  export function CheckAuth(): Promise<boolean>
  export function Logout(): Promise<void>
  export function GetPinnedMessages(chatId: string): Promise<any[]>
}

declare module '../../wailsjs/go/models' {
  export interface api {
    CallInfo: any
    ChatElement: any
    CommunityDetails: any
    CommunityGroup: any
    CommunitySummary: any
    Contact: any
    Group: any
    GroupParticipant: any
    LinkPreviewResult: any
    MessageContent: any
    options: any
    store: any
    types: any
    voip: any
    wa: any
  }
  export interface store {
    ContextInfo: any
    DecodedLinkPreview: any
    DecodedMessage: any
    DecodedMessageContent: any
    DecodedMessageInfo: any
    DocumentMessageContent: any
    ExtendedTextContent: any
    MediaMessageContent: any
    PinnedMessage: any
    PollInfo: any
    PollVote: any
    Reaction: any
  }
  export interface types {
    JID: any
  }
  export interface voip {
    AudioDevice: any
    AudioDevices: any
  }
  export interface wa {
    Group: any
  }
}

declare module '../../wailsjs/runtime/runtime' {
  export function EventsOn(event: string, callback: (data: any) => void): () => void
}