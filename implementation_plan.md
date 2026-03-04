# Phishing Defense Extension - Implementation Plan

## Goal Description
The goal is to create a cross-browser compatible Web Extension (using Manifest V3) that provides a "Risk Score" for visited websites to combat phishing attacks, which are projected to increase by 150% by 2026. The extension will analyze:
1. Domain Age
2. SSL Certificate Quality
3. Suspicious Background JavaScript Activities

## User Review Required
> [!IMPORTANT]
> **API Limitations for Domain Age and SSL**
> Web browsers do not expose native APIs to check a domain's exact registration age or detailed SSL certificate chain from within an extension (except Mozilla Firefox's `webRequest.getSecurityInfo`, which is not cross-browser). 
> 
> To be fully cross-browser and viable for the store, **we must use an external backend API** to fetch Domain Age and SSL information. 
> 
> **For this iteration, I will implement a robust mock API layer** in the background script. It will simulate external API calls so you can see the UI and logic working. Later, you can replace the mock URLs with your actual backend endpoints. Is this acceptable?

## Proposed Changes

### Extension Root `c:\Development\webex`
#### [NEW] `manifest.json`
- Defines the extension as Manifest V3.
- Declares permissions: `activeTab`, `storage`, `scripting`, `alarms`.
- Registers the service worker (background script).

### Background Service Worker
#### [NEW] `background.js`
- Contains the core logic for intercepting tab updates.
- Implements `analyzeDomain(url)` which fetches mocked Domain Age and SSL status.
- Calculates an aggregate "Risk Score" out of 100 based on Domain Age, SSL, and JS Activity reports from the content script.

### Content Scripts
#### [NEW] `content/content.js`
- Injected into all web pages.
- Analyzes the DOM for suspicious signs (e.g., hidden password fields, forms submitting to external domains).
- Injects a script tag into the `main` world to monitor JavaScript behavior.
#### [NEW] `content/inject.js`
- Overrides sensitive functions like `eval` or `document.write` to detect obfuscated runtime code evaluation.
- Communicates findings back to `content.js` and then to the `background.js`.

### Popup UI
#### [NEW] `popup/popup.html`
- A sleek, modern aesthetic UI displaying the Risk Score.
#### [NEW] `popup/popup.css`
- Uses dark mode, glassmorphism, and smooth transitions (no TailwindCSS, pure Vanilla CSS) to achieve a visually stunning, premium look.
#### [NEW] `popup/popup.js`
- Connects the UI to the background script, animating the score and displaying warnings dynamically.

## Verification Plan
### Automated Tests
- N/A for this phase (unit tests can be added later if you set up a testing suite like Jest).

### Manual Verification
1. Open Chrome/Edge and load the `c:\Development\webex` folder as an unpacked extension.
2. Visit a safe site (e.g., `google.com`) and click the extension. The Risk Score should be low/green.
3. Visit a mocked dangerous site (we will mock any domain with `test` in it to be malicious) and verify the score is high/red and the UI clearly explains why (e.g., "Domain is 1 day old", "SSL is invalid").
4. Open the Developer Tools console to verify the content script is actively monitoring JS functions.
