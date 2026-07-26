# TabEcho Unavoidable Browser Limitations

TabEcho maximizes ordinary webpage interaction synchronization within the security constraints imposed by modern web browsers.

## Technical Limitations

1. **Synthetic Events (`isTrusted === false`)**: Web events dispatched by extensions are synthetic. Some websites with strict anti-bot protections or custom gesture listeners may ignore synthetic events.
2. **File Inputs**: Web browsers prohibit programmatic file selection for security reasons. File input controls cannot be mirrored.
3. **Internal & Web Store Pages**: Chrome restricts extension content script injection into `chrome://`, `edge://`, `about:`, DevTools, and Chrome Web Store pages.
4. **CAPTCHA & Passkeys**: Hardware tokens, CAPTCHA challenges, OS-level authentication dialogs, and passkeys cannot be mirrored.
5. **Closed Shadow DOM**: Elements rendered inside closed shadow roots are inaccessible to extensions by design.
