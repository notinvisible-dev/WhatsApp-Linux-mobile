# Whats4Linux Mobile

A mobile-friendly WhatsApp client for **Mobian Linux**, built with a Go backend powered by [Wails](https://wails.io/) and a React frontend.

Whats4Linux Mobile brings a responsive messaging experience to Linux phones while retaining compatibility with desktop environments.

## Features

### Messaging & Interface
- Responsive single-pane layout optimized for both phones and desktops
- Voice message playback with optional transcription
- Lazy-loaded media previews and link previews
- Call overlays visible in both chat lists and individual conversations
- Custom reply composer for quoted messages
- Delete your own messages from conversations

### Privacy & Customization
- Toggle read receipts
- Appear offline
- Hide typing indicators
- Keep deleted messages visible in conversations

### Automation & Productivity
- Custom auto-responder rules
- Schedule messages for later delivery

## Mods & Settings

All available modifications can be configured under:

**Settings → Advanced → Mods**

| Mod | Description |
|---|---|
| Keep deleted messages | Retain messages even after they are deleted by their sender |
| Hide typing indicator | Prevent your typing status from being displayed |
| Appear offline | Hide your online presence |
| Auto responder | Automatically reply to incoming messages based on custom rules |
| Message scheduler | Schedule messages to be sent at a later time |
| Voice transcription | Enable transcription for voice messages |
| Fake replies | Compose custom quoted replies |

## How It Works

<details>
<summary>Click to expand</summary>

Whats4Linux Mobile consists of two main components that communicate with each other.

### 1. Go Backend

The backend is written in Go and uses the [WhatsMeow](https://github.com/tulir/whatsmeow) library to communicate with WhatsApp.

It is responsible for:
- Connecting to WhatsApp
- Sending and receiving messages
- Managing incoming events
- Storing conversations and messages in a local SQLite database

Incoming WhatsApp events are processed and stored locally, allowing the application to retain conversation data even when the phone is offline.

### 2. React Frontend

The frontend is built with React and provides the user interface.

It communicates with the Go backend through Wails, which acts as a bridge between the two components.

For example:
- Opening a conversation requests its message history from the Go backend.
- Sending a message passes the content to Go, which sends it through WhatsApp and updates the local database.
- Incoming messages are retrieved from the backend and displayed in the interface.

### 3. Mod System

Mods extend or modify the application's default behavior.

They work by intercepting events before they are processed by the backend or displayed in the frontend.

For example:
- **Keep deleted messages** prevents deleted messages from being removed from the local conversation history.
- **Auto responder** monitors incoming messages and automatically sends a reply when a configured rule matches.

</details>

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Go |
| Frontend | React |
| Desktop/mobile bridge | Wails |
| WhatsApp protocol | WhatsMeow |
| Local database | SQLite |

## Credits

- **[WhatsMeow](https://github.com/tulir/whatsmeow)** — WhatsApp protocol implementation and Go library.
- **[Whats4Linux](https://github.com/ramin0/Whats4Linux)** — Original desktop project that this application builds upon.
- **notinvisible-dev** — Mobile adaptation, desktop adaptations, and additional features.

## Roadmap

Planned improvements include:

- Additional mod options
- Smoother animations and transitions
- Performance optimizations
- Improved background synchronization

## Project Status

Whats4Linux Mobile is an ongoing project. Features and functionality may change as development continues.
