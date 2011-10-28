
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
    var menuitem = document.getElementById("mailboxalert-moz-tools-menu-mute");
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
/*
MailboxAlert.newMailListener = {
    msgsClassified: function (aMsgs,
                              aJunkProcessed,
                              aTraitProcessed) {
        // Only alert for the last one. If people want an alert fired for every message,
        // they can use a filter action
        // directly addressing the element with length-1 does not appear to work,
        // so just loop through the messages
        
        // Unfortunately, this event seems to be fired too soon; the
        // user-set filters have not been run yet. As a result, we will
        // still have to wait for a bit, then recheck if the mail has not
        // been moved to another folder.
        // (a slight advantage is that we then
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
*/

// A queue of timers
// Folders that are added get a timer, if the folder is already present,
// the call will noop. If not, the timer is started.
// When the timer fires, the folder will be removed from the queue. For its
// last new message an alert will be fired.
MailboxAlert.alertTimers = {}
// Very basic locking. Do we have real mutexes available from scripts?
MailboxAlert.alertTimers.locked = false;
MailboxAlert.alertTimers.folders = Array();
MailboxAlert.alertTimers.getLock = function() {
    dump("getting lock\n");
    while (this.locked) {
        // sleep?
    }
    dump("got lock\n");
    this.locked = true;
}
MailboxAlert.alertTimers.unlock = function () {
    dump("unlock\n");
    this.locked = false;
}
MailboxAlert.alertTimers.addFolder = function (folder) {
    this.getLock();
    // as soon as we have a lock, we put everything in a try-catch,
    // so that we are sure we unlock
    try {
        var found = false;
        for (var i = 0; i < this.folders.length; i++) {
            if (this.folders[i] == folder) {
                found = true;
            }
        }
        dump("found folder? " + found + "\n");
        if (!found) {
            this.folders.push(folder);
            MailboxAlert.createAlertTimer(folder);
            dump("timer started\n")
            // TODO: are timers getting lost?
            // TODO2: if there are unreads left in the original folder,
            // it will fire by accident
        }
    } catch (e) {
        dump("Error during alert timer handling: " + e + "\n");
    }
    this.unlock();
}

// Create a one-shot timer object that when fires, runs the checks and alerts
MailboxAlert.createAlertTimer = function(folder) {
    var timer_obj = {}
    timer_obj.folder = folder;
    timer_obj.notify = function(timer) {
        dump("timer fired\n");
        MailboxAlert.alertTimers.getLock();
        // we keep track of whether we need to fire, and do so *after* we
        // are completely done and have unlocked (in case the alert itself
        // causes any problems
        var last_unread = null;
        // as soon as we have a lock, we put everything in a try-catch,
        // so that we are sure we unlock
        try {
            var new_array = Array()
            if (MailboxAlert.alertTimers.folders.length == 0) {
                MailboxAlert.alertTimers.unlock();
                dump("no folders in queue\n");
                return;
            }
            var alert_folder = null;
            while (MailboxAlert.alertTimers.folders.length > 0) {
                var cur_folder = MailboxAlert.alertTimers.folders.shift();
                if (cur_folder == this.folder) {
                    alert_folder = cur_folder;
                } else {
                    new_array.push(cur_folder);
                }
            }
            if (alert_folder != null) {
                dump("pulled relevant folder from queue\n");

                // Find the last unread message and alert
                if (alert_folder.getNumUnread(false) > 0) {
                    var info = {};
                    var msgdb = alert_folder.getDBFolderInfoAndDB(info);
                    var enumerator = msgdb.EnumerateMessages();
                    while (enumerator.hasMoreElements()) {
                        var cur_hdr = enumerator.getNext();
                        if (!cur_hdr.isRead) {
                            last_unread = cur_hdr;
                        }
                    }
                } else {
                    dump("no unread messages in folder\n");
                }
            } else {
                dump("relevant folder not found in queue\n");
            }
            MailboxAlert.alertTimers.folders = new_array;
        } catch (e) {
            dump("Error during alert timer handling: " + e + "\n");
        }
        MailboxAlert.alertTimers.unlock();
        if (last_unread != null) {
            dump("fire new alert\n");
            dump("alert folder: " + folder.URI);
            MailboxAlert.new_alert(folder, last_unread);
        } else {
            dump("no unread message found\n");
        }
    }

    var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);

    timer.initWithCallback(timer_obj, 1000, timer.TYPE_ONE_SHOT);
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
            dump("Number of unread messages increased for " + folder.URI + "\n");
            dump("try updateFolder\n");
            try {
                ///*
                var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
                var windowManagerInterface = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
                var mailWindow = windowManagerInterface.getMostRecentWindow( "mail:3pane" );
                folder.updateFolder(mailWindow.msgWindow);
                // Now start a timer, if there is still new mail in the folder
                // when it fires, do the alert.
                MailboxAlert.alertTimers.addFolder(folder);
                dump("folder added\n");
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

    //var notificationService =
    //Components.classes["@mozilla.org/messenger/msgnotificationservice;1"]
    //.getService(Components.interfaces.nsIMsgFolderNotificationService);

    //notificationService.addListener(MailboxAlert.newMailListener,
    //                                notificationService.msgsClassified);

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
