# Vencord iOS

A full-featured client modification tweak for Discord on iOS featuring **Adaptive 120 FPS ProMotion**, a **React Native / Hermes JS injection runtime**, and core client plugins.

---

## Features

- **Adaptive 120 FPS ProMotion Unlock**:
  - Dynamically drops to 24–60Hz during idle viewing to save battery.
  - Automatically ramps up to full **120 FPS** during touch interactions, channel navigations, and message scrolling with zero 80–90Hz throttling.
- **Free Nitro Custom Emotes & Stickers**:
  - Send custom animated and external guild emotes from any server without Nitro.
  - Bypasses client-side picker restrictions and converts unowned emojis to direct high-res Discord CDN links.
- **Message Logger**:
  - Retains deleted messages inline with a red `[deleted]` tag.
  - Tracks previous edit history for updated messages.
- **Ghost Mode (Silent Typing & Invisible Read Receipts)**:
  - Blocks outgoing `TYPING_START` websocket events so typing indicators are never broadcasted.
  - Suppresses automatic `MESSAGE_ACK` read receipt dispatch.
- **OLED Pure Black Theme**:
  - Injects true `#000000` black into chat views, server sidebars, and root UIKit views.

---

## Building

### Requirements
- [Theos](https://theos.dev)
- iOS 15+ SDK

```bash
make package FINALPACKAGE=1 THEOS_PACKAGE_SCHEME=rootless
```
