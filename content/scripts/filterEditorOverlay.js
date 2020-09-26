// Import any needed modules.
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

// Load an additional JavaScript file.
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalert_util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalert_vars.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalert_funcs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/new_filterEditor.js", window, "UTF-8");

function onLoad(activatedWhileWindowOpen) {
  WL.injectCSS("chrome://mailboxalert/content/mailboxalert_filter.css");
}

function onUnload(deactivatedWhileWindowOpen) {
}
