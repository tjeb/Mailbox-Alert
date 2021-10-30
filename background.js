(async () => {

  // --- Define listeners for background notifications from legacy code

  /**
   * NotifyTools currently is not 100% compatible with the behavior of
   * runtime.sendMessage. While runtime messaging is ignoring non-Promise return
   * values, NotifyTools only ignores <null>.
   * 
   * Why does this matter? Consider the following three listeners:
   * 
   * async function dominant_listener(data) {
   *  if (data.type == "A") {
   *    return { msg: "I should answer only type A" };
   *  }
   * }
   * 
   * function silent_listener(data) {
   *  if (data.type == "B") {
   *    return { msg: "I should answer only type B" };
   *  }
   * }
   * 
   * function selective_listener(data) {
   *  if (data.type == "C") {
   *    return Promise.resolve({ msg: "I should answer only type C" });
   *  }
   * }
   * 
   * When all 3 listeners are registered for the runtime.onMessage event,
   * the dominant listener will always respond, even for data.type != "A" requests,
   * because it is always returning a Promise (async function). The return value of 
   * the silent listener is ignored, and the selective listener returns a value just
   * for data.type == "C". But since the dominant listener also returns <null> for
   * these requests, the actual return value depends on which listener is faster
   * and/or was registered first.
   * 
   * All notifyTools listener however ignore <null> return values (so null can actually
   * never be returned). The above dominant listener will only respond to type == "A"
   * requests, the silent listener will only respond to type == "B" requests and the
   * selective listener will respond only to type == "C" requests.
   * 
   */
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
