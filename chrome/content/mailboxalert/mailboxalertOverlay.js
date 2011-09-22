
MailboxAlert.getFolder = function () {
        try {
                var folderResource = GetFirstSelectedMsgFolder();
                if (folderResource)
                {
                        var msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
                        return msgFolder;
                }
        } catch (ex) {
                dump("ex="+ex+"\n");
        }
        dump("[mailboxalert] error: folder not found\n");
        return null;
}

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

// This object is used as a Listener callback for thunderbird 3 and up
MailboxAlert.newMailListener = {
    msgsClassified: function (aMsgs,
                              aJunkProcessed,
                              aTraitProcessed) {
        // Only alert for the last one. If people want an alert fired for every message,
        // they can use a filter action
        // directly addressing the element with length-1 does not appear to work,
        // so just loop through the messages
        dump("[XX] msgsClassified event called\n");
        var msg_enum = aMsgs.enumerate();
        var last = msg_enum.getNext();
        while (msg_enum.hasMoreElements()) {
            last = msg_enum.getNext();
        }
        var message = last.QueryInterface(Components.interfaces.nsIMsgDBHdr);
        if (!message.isRead) {
            dump("[XX] folder URI: " + message.folder.URI + "\n")
            dump("[XX] subject: " + message.mime2DecodedSubject + "\n")
            MailboxAlert.new_alert(message.folder, message);
        }
    }
}

// This object is called as a listener callback to force folders to be updated
// whenever mail appears to arrive
// A possible improvement here is to check whether it really needs to (i.e.
// whether this folder has any alerts)
MailboxAlert.folderUpdater = {
    OnItemIntPropertyChanged: function(item, property, oldValue, newValue)
    {
        if (property == "TotalUnreadMessages" && newValue > oldValue) {
            // need folder update to trigger other internal notifications
            var folder = item.QueryInterface(Components.interfaces.nsIMsgFolder);
            dump("Number of unread folders increased for " + folder.URI + "\n");
            dump("try updateFolder\n");
            try {
                ///*
                var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
                var windowManagerInterface = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
                var mailWindow = windowManagerInterface.getMostRecentWindow( "mail:3pane" );
                folder.updateFolder(mailWindow.msgWindow);
                //*/
            } catch (e) {
                // OK, this does not always work, but as this is only a hint to get the
                // folder to update, we don't really care.
                dump("updateFolder failed: " + e + "\n")
            }
        }
    }
}

MailboxAlert.onLoad = function ()
{
    // remove to avoid duplicate initialization
    removeEventListener("load", MailboxAlert.onLoad, true);

    var notificationService =
    Components.classes["@mozilla.org/messenger/msgnotificationservice;1"]
    .getService(Components.interfaces.nsIMsgFolderNotificationService);

    notificationService.addListener(MailboxAlert.newMailListener,
                                    notificationService.msgsClassified);

    // with IMAP, the 'view' can be updated (i.e. new mail has arrived and
    // this is visible in the treeview), but the folder itself may not have
    // been, until the folder is clicked. In this case no 'real' state has
    // changed, and no notification would have been sent. So Mailbox Alert
    // needs the folder to be really updated, as if the user has selected
    // the folder (this happens for instance when procmail drops mail into
    // a subfolder)
    Components.classes["@mozilla.org/messenger/services/session;1"]
    .getService(Components.interfaces.nsIMsgMailSession)
    .AddFolderListener(MailboxAlert.folderUpdater,
    Components.interfaces.nsIFolderListener.intPropertyChanged);

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
