/*
 * Miscellaneous utility functions for mailbox alert
 */

var MailboxAlertUtil = {};

MailboxAlertUtil.getInterface = function (iff) {
    var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
    var interface = windowManager.QueryInterface(iff);
    return interface;
}

MailboxAlertUtil.init = function () {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    if (prefs.prefHasUserValue("extensions.mailboxalert.loglevel")) {
        MailboxAlertUtil.logLevel = prefs.getIntPref("extensions.mailboxalert.loglevel");
    } else {
        MailboxAlertUtil.logLevel = 0;
        MailboxAlertUtil.logLevel = prefs.setIntPref("extensions.mailboxalert.loglevel", "0");
    }
    MailboxAlertUtil.console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
}

MailboxAlertUtil.init();

MailboxAlertUtil.logMessage = function (level, msg) {
    MailboxAlertUtil.console.logStringMessage("[MailboxAlert] " + msg);
    if (level >= MailboxAlertUtil.logLevel) {
        MailboxAlertUtil.console.logStringMessage("[MailboxAlert] " + msg);
    }
}

MailboxAlertUtil.logStart = function (name) {
    //MailboxAlertUtil.logMessage(5, name + " called");
}

MailboxAlertUtil.logEnd = function (name, reason) {
    /*
    if (reason) {
        MailboxAlertUtil.logMessage(5, name + " finished (" + reason + ")");
    } else {
        MailboxAlertUtil.logMessage(5, name + " finished");
    }
    */
}
