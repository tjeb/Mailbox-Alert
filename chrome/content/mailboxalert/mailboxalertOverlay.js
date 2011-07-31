
MailboxAlert.toggleMute = function () {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    var muted = true;
    try {
        muted = !prefs.getBoolPref("extensions.mailboxalert.mute");
    }
    catch (e) {
        // Ignore, mute never saved
    }
    prefs.setBoolPref("extensions.mailboxalert.mute", muted);
    /* should we check whether the user has made the mute state out of sync, by
     toggling mute in different windows? */
    /* window_muted = menuitem.hasAttribute("checked");*/
    MailboxAlert.setMuteMenuitem(muted);
}

MailboxAlert.muted = function() {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    var muted = false;
    try {
        muted = prefs.getBoolPref("extensions.mailboxalert.mute");
    }
    catch (e) {
        // Ignore, mute never saved
    }
    return muted;
}

MailboxAlert.setMuteMenuitem = function(muted) {
    menuitem = document.getElementById("mailboxalert-moz-tools-menu-mute");
    if (muted) {
        menuitem.setAttribute("checked", true);
    } else {
        menuitem.removeAttribute("checked");
    }
}

MailboxAlert.checkOldSettings = function () {
    // get the value for 'prefsversion'. If it doesn't exist, assume
    // (0.)14. If it is 14, call conversion routines.
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    var prefsversion;
    try {
        prefsversion = prefs.getIntPref("extensions.mailboxalert.prefsversion");
    } catch (e) {
        // ok, it doesn't exist yet, assume 14
        prefsversion = 14;
    }
    if (prefsversion < 15) {
        MailboxAlert.convertAllFolderPreferences14toAlertPreferences();
        prefs.setIntPref("extensions.mailboxalert.prefsversion", 15);
    }
}

MailboxAlert.newMailListener_tb2 = {
    itemAdded: function(item) {  
        var hdr = item.QueryInterface(Components.interfaces.nsIMsgDBHdr);
        MailboxAlert.new_alert(hdr.folder, hdr);
    }
}

MailboxAlert.newMailListener_tb3 = {
    msgsClassified: function (aMsgs,
                              aJunkProcessed,
                              aTraitProcessed) {
        // Only alert for the last one. If people want an alert fired for every message,
        // they can use a filter action
        enum = aMsgs.enumerate();
        var last = enum.getNext();
        while (enum.hasMoreElements()) {
            last = enum.getNext();
        }
        //var message;
        var message = last.QueryInterface(Components.interfaces.nsIMsgDBHdr);
        MailboxAlert.new_alert(message.folder, message);
    }
}

MailboxAlert.onLoad = function ()
{
    // remove to avoid duplicate initialization
    removeEventListener("load", MailboxAlert.onLoad, true);

    var notificationService =
    Components.classes["@mozilla.org/messenger/msgnotificationservice;1"]
    .getService(Components.interfaces.nsIMsgFolderNotificationService);

    // try TB3 interface first, then tb2 interface
    try {
        notificationService.addListener(MailboxAlert.newMailListener_tb3,
                                        notificationService.msgsClassified);
    } catch (e) {
        notificationService.addListener(MailboxAlert.newMailListener_tb2);
    }


    // check if there are old settings (pre 0.14) to copy
    MailboxAlert.checkOldSettings();

    // check if we exited with muted on last time
    MailboxAlert.setMuteMenuitem(MailboxAlert.muted());

    // And finally, add our shiny custom filter action
    var filterService = Components.classes["@mozilla.org/messenger/services/filters;1"]
                        .getService(Components.interfaces.nsIMsgFilterService);

    filterService.addCustomAction(MailboxAlert.filter_action);
}


addEventListener("load", MailboxAlert.onLoad, true);
