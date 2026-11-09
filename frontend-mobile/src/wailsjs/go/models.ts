export namespace api {
	
	export class CallInfo {
	    id: string;
	    peer: string;
	    chat_jid: string;
	    name: string;
	    direction: string;
	    state: string;
	    input_id: string;
	    output_id: string;
	
	    static createFrom(source: any = {}) {
	        return new CallInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.peer = source["peer"];
	        this.chat_jid = source["chat_jid"];
	        this.name = source["name"];
	        this.direction = source["direction"];
	        this.state = source["state"];
	        this.input_id = source["input_id"];
	        this.output_id = source["output_id"];
	    }
	}
	export class ChatElement {
	    latest_message: string;
	    LatestTS: number;
	    Sender: string;
	    pinned: boolean;
	    pinned_at: number;
	    archived: boolean;
	    phno: string;
	    jid: string;
	    short: string;
	    full_name: string;
	    push_name: string;
	    is_business: boolean;
	    avatar_url: string;
	    parent_jid?: string;
	    parent_name?: string;
	    is_community_group: boolean;
	    is_community_parent: boolean;
	    is_default_sub_group: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ChatElement(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.latest_message = source["latest_message"];
	        this.LatestTS = source["LatestTS"];
	        this.Sender = source["Sender"];
	        this.pinned = source["pinned"];
	        this.pinned_at = source["pinned_at"];
	        this.archived = source["archived"];
	        this.phno = source["phno"];
	        this.jid = source["jid"];
	        this.short = source["short"];
	        this.full_name = source["full_name"];
	        this.push_name = source["push_name"];
	        this.is_business = source["is_business"];
	        this.avatar_url = source["avatar_url"];
	        this.parent_jid = source["parent_jid"];
	        this.parent_name = source["parent_name"];
	        this.is_community_group = source["is_community_group"];
	        this.is_community_parent = source["is_community_parent"];
	        this.is_default_sub_group = source["is_default_sub_group"];
	    }
	}
	export class CommunityGroup {
	    jid: string;
	    name: string;
	    is_announcement: boolean;
	    is_default_sub_group: boolean;
	    avatar_url?: string;
	
	    static createFrom(source: any = {}) {
	        return new CommunityGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.jid = source["jid"];
	        this.name = source["name"];
	        this.is_announcement = source["is_announcement"];
	        this.is_default_sub_group = source["is_default_sub_group"];
	        this.avatar_url = source["avatar_url"];
	    }
	}
	export class CommunityDetails {
	    jid: string;
	    name: string;
	    topic?: string;
	    created_at?: string;
	    member_count: number;
	    avatar_url?: string;
	    announcement?: CommunityGroup;
	    groups: CommunityGroup[];
	
	    static createFrom(source: any = {}) {
	        return new CommunityDetails(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.jid = source["jid"];
	        this.name = source["name"];
	        this.topic = source["topic"];
	        this.created_at = source["created_at"];
	        this.member_count = source["member_count"];
	        this.avatar_url = source["avatar_url"];
	        this.announcement = this.convertValues(source["announcement"], CommunityGroup);
	        this.groups = this.convertValues(source["groups"], CommunityGroup);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class CommunitySummary {
	    jid: string;
	    name: string;
	    topic?: string;
	    group_count: number;
	    avatar_url?: string;
	
	    static createFrom(source: any = {}) {
	        return new CommunitySummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.jid = source["jid"];
	        this.name = source["name"];
	        this.topic = source["topic"];
	        this.group_count = source["group_count"];
	        this.avatar_url = source["avatar_url"];
	    }
	}
	export class Contact {
	    phno: string;
	    jid: string;
	    short: string;
	    full_name: string;
	    push_name: string;
	    is_business: boolean;
	    avatar_url: string;
	
	    static createFrom(source: any = {}) {
	        return new Contact(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.phno = source["phno"];
	        this.jid = source["jid"];
	        this.short = source["short"];
	        this.full_name = source["full_name"];
	        this.push_name = source["push_name"];
	        this.is_business = source["is_business"];
	        this.avatar_url = source["avatar_url"];
	    }
	}
	export class GroupParticipant {
	    contact: Contact;
	    is_admin: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GroupParticipant(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.contact = this.convertValues(source["contact"], Contact);
	        this.is_admin = source["is_admin"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Group {
	    group_name: string;
	    group_topic?: string;
	    is_group_lock: boolean;
	    is_group_announce: boolean;
	    group_owner: Contact;
	    // Go type: time
	    group_created_at: any;
	    participant_count: number;
	    group_participants: GroupParticipant[];
	
	    static createFrom(source: any = {}) {
	        return new Group(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.group_name = source["group_name"];
	        this.group_topic = source["group_topic"];
	        this.is_group_lock = source["is_group_lock"];
	        this.is_group_announce = source["is_group_announce"];
	        this.group_owner = this.convertValues(source["group_owner"], Contact);
	        this.group_created_at = this.convertValues(source["group_created_at"], null);
	        this.participant_count = source["participant_count"];
	        this.group_participants = this.convertValues(source["group_participants"], GroupParticipant);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class LinkPreviewResult {
	    url: string;
	    title: string;
	    description: string;
	    thumbnail: string;
	
	    static createFrom(source: any = {}) {
	        return new LinkPreviewResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.thumbnail = source["thumbnail"];
	    }
	}
	export class MessageContent {
	    type: string;
	    text?: string;
	    base64Data?: string;
	    mimetype?: string;
	    fileName?: string;
	    quotedMessageId?: string;
	    mentions?: string[];
	    clientTempId?: string;
	    pollOptions?: string[];
	    selectableCount?: number;
	
	    static createFrom(source: any = {}) {
	        return new MessageContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.text = source["text"];
	        this.base64Data = source["base64Data"];
	        this.mimetype = source["mimetype"];
	        this.fileName = source["fileName"];
	        this.quotedMessageId = source["quotedMessageId"];
	        this.mentions = source["mentions"];
	        this.clientTempId = source["clientTempId"];
	        this.pollOptions = source["pollOptions"];
	        this.selectableCount = source["selectableCount"];
	    }
	}

}

export namespace options {
	
	export class SecondInstanceData {
	    Args: string[];
	    WorkingDirectory: string;
	
	    static createFrom(source: any = {}) {
	        return new SecondInstanceData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Args = source["Args"];
	        this.WorkingDirectory = source["WorkingDirectory"];
	    }
	}

}

export namespace store {
	
	export class DocumentMessageContent {
	    caption?: string;
	    fileName?: string;
	    mimetype?: string;
	    contextInfo?: ContextInfo;
	
	    static createFrom(source: any = {}) {
	        return new DocumentMessageContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.caption = source["caption"];
	        this.fileName = source["fileName"];
	        this.mimetype = source["mimetype"];
	        this.contextInfo = this.convertValues(source["contextInfo"], ContextInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MediaMessageContent {
	    caption?: string;
	    mimetype?: string;
	    gifPlayback?: boolean;
	    width?: number;
	    height?: number;
	    contextInfo?: ContextInfo;
	
	    static createFrom(source: any = {}) {
	        return new MediaMessageContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.caption = source["caption"];
	        this.mimetype = source["mimetype"];
	        this.gifPlayback = source["gifPlayback"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.contextInfo = this.convertValues(source["contextInfo"], ContextInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExtendedTextContent {
	    text?: string;
	    contextInfo?: ContextInfo;
	
	    static createFrom(source: any = {}) {
	        return new ExtendedTextContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.text = source["text"];
	        this.contextInfo = this.convertValues(source["contextInfo"], ContextInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DecodedMessageContent {
	    conversation?: string;
	    extendedTextMessage?: ExtendedTextContent;
	    imageMessage?: MediaMessageContent;
	    videoMessage?: MediaMessageContent;
	    audioMessage?: MediaMessageContent;
	    documentMessage?: DocumentMessageContent;
	    stickerMessage?: MediaMessageContent;
	
	    static createFrom(source: any = {}) {
	        return new DecodedMessageContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.conversation = source["conversation"];
	        this.extendedTextMessage = this.convertValues(source["extendedTextMessage"], ExtendedTextContent);
	        this.imageMessage = this.convertValues(source["imageMessage"], MediaMessageContent);
	        this.videoMessage = this.convertValues(source["videoMessage"], MediaMessageContent);
	        this.audioMessage = this.convertValues(source["audioMessage"], MediaMessageContent);
	        this.documentMessage = this.convertValues(source["documentMessage"], DocumentMessageContent);
	        this.stickerMessage = this.convertValues(source["stickerMessage"], MediaMessageContent);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ContextInfo {
	    stanzaId?: string;
	    participant?: string;
	    quotedMessage?: DecodedMessageContent;
	
	    static createFrom(source: any = {}) {
	        return new ContextInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.stanzaId = source["stanzaId"];
	        this.participant = source["participant"];
	        this.quotedMessage = this.convertValues(source["quotedMessage"], DecodedMessageContent);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DecodedLinkPreview {
	    url: string;
	    title: string;
	    description: string;
	    has_poster: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DecodedLinkPreview(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.has_poster = source["has_poster"];
	    }
	}
	export class DecodedMessageInfo {
	    ID: string;
	    Timestamp: string;
	    IsFromMe: boolean;
	    PushName: string;
	    Sender: string;
	    Chat: string;
	
	    static createFrom(source: any = {}) {
	        return new DecodedMessageInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Timestamp = source["Timestamp"];
	        this.IsFromMe = source["IsFromMe"];
	        this.PushName = source["PushName"];
	        this.Sender = source["Sender"];
	        this.Chat = source["Chat"];
	    }
	}
	export class PollVote {
	    sender_jid: string;
	    options: string[];
	    updated_at: number;
	
	    static createFrom(source: any = {}) {
	        return new PollVote(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sender_jid = source["sender_jid"];
	        this.options = source["options"];
	        this.updated_at = source["updated_at"];
	    }
	}
	export class PollInfo {
	    name: string;
	    options: string[];
	    selectableCount: number;
	    votes?: PollVote[];
	
	    static createFrom(source: any = {}) {
	        return new PollInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.options = source["options"];
	        this.selectableCount = source["selectableCount"];
	        this.votes = this.convertValues(source["votes"], PollVote);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Reaction {
	    id: number;
	    message_id: string;
	    sender_id: string;
	    emoji: string;
	
	    static createFrom(source: any = {}) {
	        return new Reaction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.message_id = source["message_id"];
	        this.sender_id = source["sender_id"];
	        this.emoji = source["emoji"];
	    }
	}
	export class DecodedMessage {
	    type: number;
	    reply_to_message_id: string;
	    edited: boolean;
	    forwarded: boolean;
	    reactions: Reaction[];
	    link_preview?: DecodedLinkPreview;
	    poll?: PollInfo;
	    Info: DecodedMessageInfo;
	    Content?: DecodedMessageContent;
	
	    static createFrom(source: any = {}) {
	        return new DecodedMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.reply_to_message_id = source["reply_to_message_id"];
	        this.edited = source["edited"];
	        this.forwarded = source["forwarded"];
	        this.reactions = this.convertValues(source["reactions"], Reaction);
	        this.link_preview = this.convertValues(source["link_preview"], DecodedLinkPreview);
	        this.poll = this.convertValues(source["poll"], PollInfo);
	        this.Info = this.convertValues(source["Info"], DecodedMessageInfo);
	        this.Content = this.convertValues(source["Content"], DecodedMessageContent);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	
	export class PinnedMessage {
	    message_id: string;
	    sender_jid: string;
	    pinned_at: number;
	    text: string;
	
	    static createFrom(source: any = {}) {
	        return new PinnedMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.message_id = source["message_id"];
	        this.sender_jid = source["sender_jid"];
	        this.pinned_at = source["pinned_at"];
	        this.text = source["text"];
	    }
	}
	
	

}

export namespace types {
	
	export class JID {
	    User: string;
	    RawAgent: number;
	    Device: number;
	    Integrator: number;
	    Server: string;
	
	    static createFrom(source: any = {}) {
	        return new JID(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.User = source["User"];
	        this.RawAgent = source["RawAgent"];
	        this.Device = source["Device"];
	        this.Integrator = source["Integrator"];
	        this.Server = source["Server"];
	    }
	}

}

export namespace voip {
	
	export class AudioDevice {
	    id: string;
	    name: string;
	    kind: string;
	    default: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AudioDevice(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.kind = source["kind"];
	        this.default = source["default"];
	    }
	}
	export class AudioDevices {
	    inputs: AudioDevice[];
	    outputs: AudioDevice[];
	    input_id: string;
	    output_id: string;
	
	    static createFrom(source: any = {}) {
	        return new AudioDevices(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.inputs = this.convertValues(source["inputs"], AudioDevice);
	        this.outputs = this.convertValues(source["outputs"], AudioDevice);
	        this.input_id = source["input_id"];
	        this.output_id = source["output_id"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace wa {
	
	export class Group {
	    JID: string;
	    Name: string;
	    Topic: string;
	    OwnerJID: string;
	    ParticipantCount: number;
	    ParentJID: string;
	    ParentName: string;
	    IsParent: boolean;
	    IsDefaultSub: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Group(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.JID = source["JID"];
	        this.Name = source["Name"];
	        this.Topic = source["Topic"];
	        this.OwnerJID = source["OwnerJID"];
	        this.ParticipantCount = source["ParticipantCount"];
	        this.ParentJID = source["ParentJID"];
	        this.ParentName = source["ParentName"];
	        this.IsParent = source["IsParent"];
	        this.IsDefaultSub = source["IsDefaultSub"];
	    }
	}

}

