(async () => {

    // Keep track of the number of times Mailbox Alert was initialized
    let initializationCount = 0;

    // This listener returns a selective Promise and is therefore compatible with
    // runtime messaging (messenger.storage.local.set/get return Promises).
    function listener(data) {
        switch (data.command) {
            /*
             * Return the number of times Mailbox Alert was initialized
             * (with the windowListener API, it is instanced every
             * time a new window is opened).
             */
            case "getInitializationCount":
                return initializationCount++;
            default:
                console.log("[MailboxAlert] Unknown command sent to background: " + data.command + "\n");
        }
    }

    // Listen to commands from extension instances
    messenger.NotifyTools.onNotifyBackground.addListener(listener);

    messenger.WindowListener.registerDefaultPrefs("skin/defaults/preferences/mailboxalert_default.js");

    messenger.WindowListener.registerChromeUrl([
        ["content",  "mailboxalert",                "content/"],
        ["resource", "mailboxalert-skin",           "skin/classic/"],
        ["locale",   "mailboxalert",      "da",     "locale/da/"],
        ["locale",   "mailboxalert",      "de",     "locale/de/"],
        ["locale",   "mailboxalert",      "en-US",  "locale/en-US/"],
        ["locale",   "mailboxalert",      "fr",     "locale/fr/"],
        ["locale",   "mailboxalert",      "gl-ES",  "locale/gl-ES/"],
        ["locale",   "mailboxalert",      "it-IT",  "locale/it-IT/"],
        ["locale",   "mailboxalert",      "nl",     "locale/nl/"],
        ["locale",   "mailboxalert",      "pl",     "locale/pl/"],
        ["locale",   "mailboxalert",      "pt-PT",  "locale/pt-PT/"],
        ["locale",   "mailboxalert",      "sk-SK",  "locale/sk-SK/"],
        ["locale",   "mailboxalert",      "zh-CN",  "locale/zh-CN/"],
    ]);

    messenger.WindowListener.registerOptionsPage("chrome://mailboxalert/content/alert_list.xhtml");
    
    messenger.WindowListener.registerWindow(
        "chrome://messenger/content/messenger.xhtml",
        "chrome://mailboxalert/content/scripts/mailboxalertOverlay.js");

    messenger.WindowListener.registerWindow(
        "chrome://messenger/content/FilterEditor.xhtml",
        "chrome://mailboxalert/content/scripts/filterEditorOverlay.js");

    messenger.WindowListener.startListening();
})();
