//
// Copyright 2010, Jelte Jansen
// BSD licensed, see LICENSE for details
//

//
// This file contains most of the supporting functionality of Mailbox Alert
//

MailboxAlert.showMethods = function (obj) {
    MailboxAlertUtil.logMessage(1, "[Object] Type: " + obj + "\n");
    for (var id in obj) {
        try {
            if (typeof(obj[id]) == "function") {
                MailboxAlertUtil.logMessage(1, "[Object] " + id + ": " + obj[id].toString() + "\n");
            }
        } catch (err) {
            result.push("[Object] " + id + ": inaccessible\n");
        }
    }
}

MailboxAlert.createUrlListener = function () {
    this.running = false;
    this.OnStartRunningUrl = function (aUrl) {
        this.running = true;
    }
    this.OnStopRunningUrl = function (aUrl, aExitCode) {
        this.running = false;
    }
    this.wait = function() {
        while(this.running) {};
    }
    return this;
}

MailboxAlert.createAlertData = function (mailbox, last_unread) {
    this.mailbox = mailbox;
    this.last_unread = last_unread;

    this.deriveData = function() {
        // derived data that changes
        this.folder_name = MailboxAlert.getFullFolderName(this.mailbox, false);
        this.folder_name_with_server = MailboxAlert.getFullFolderName(this.mailbox, true);
        this.folder_uri = this.mailbox.URI;
        this.all_message_count = this.mailbox.getNumUnread(true);
        this.folder_is_server = this.mailbox.isServer;
    }

    this.deriveDataFixed = function() {
        // derived data that stays the same
        this.orig_mailbox = this.mailbox;
        this.server = MailboxAlert.getServerName(this.mailbox);
        this.message_count = this.mailbox.getNumUnread(false);
        this.msg_uri = this.mailbox.getUriForMsg(this.last_unread);

        this.subject = this.last_unread.mime2DecodedSubject;
        // add Re: if necessary
        if (this.last_unread.flags & 0x00000010) {
            this.subject = "Re: " + this.subject;
        }
        this.sender = this.last_unread.mime2DecodedAuthor;
        if (this.sender == null) {
            this.sender = "<no sender set in mail>";
        }
        this.sender_name = this.sender;
        this.sender_address = this.sender;
        if (this.sender.indexOf('<') > 0 && this.sender.indexOf('>') > 0) {
            this.sender_name = this.sender.substring(0, this.sender.indexOf('<'));
            this.sender_address = this.sender.substring(this.sender.indexOf('<') + 1, this.sender.indexOf('>'));
        }
        this.recipient = this.last_unread.mime2DecodedRecipients;
        if (this.recipient == null) {
            this.recipient = "<no recipient set in mail>";
        }
        this.recipient_name = this.recipient;
        this.recipient_address = this.recipient;
        if (this.recipient.indexOf('<') > 0 && this.recipient.indexOf('>') > 0) {
            this.recipient_name = this.recipient.substring(0, this.recipient.indexOf('<'));
            this.recipient_address = this.recipient.substring(this.recipient.indexOf('<') + 1, this.recipient.indexOf('>'));
        }
        // is there a more default default?
        this.charset = "ISO-8859-1";
        // not all folders have charset
        // some messages have charset
        try {
            this.charset = this.last_unread.Charset;
        } catch (e) {
            // ignore
        }
        if (this.charset == "ISO-8859-1") {
            try {
                this.charset = this.mailbox.charset;
            } catch (e) {
                // ignore
            }
        }
        this.messageBytes = this.last_unread.messageSize;
        this.date = this.last_unread.date;
    }

    this.createFakeFolder = function () {
        var fake_parent_folder = {};
        fake_parent_folder.isServer = true;
        fake_parent_folder.prettyName = "SomeServer";

        var fake_folder = {};
        fake_folder.parent = fake_parent_folder;
        fake_folder.isServer = false;
        fake_folder.prettyName = "SomeFolder";
        fake_folder.getNumUnread = function (all) {
            if (all) {
                return 10;
            } else {
                return 1;
            }
        }
        fake_folder.getUriForMsg = function(some_msg) {
            return "imap://some_server/some_folder/some_msg";
        }
        fake_folder.URI = "imap://some_server/some_folder";

        this.mailbox = fake_folder;
    }

    this.createFakeUnread = function () {
        // this is a fake message, create some test data
        this.last_unread = {};
        this.last_unread.mime2DecodedSubject = "Test subject";
        this.last_unread.mime2DecodedAuthor = "Theo Est <test@example.com>";
        this.last_unread.mime2DecodedRecipients = "R. Ecipient <test@example.com>";
        this.last_unread.Charset = "ISO-8859-1";
        this.last_unread.messageSize = 1;
        now = new Date();
        this.last_unread.date = now.getTime();
        this.last_unread.preview = "This is a test message body. There is not much to see here. Though one might notice the text being wrapped, while the original text is one line.\n\nYour friendly neighborhood Extension Developer.\n";
        this.last_unread.getProperty = function(propname) {
            return this.preview;
        }
    }

    if (!this.last_unread) {
        this.createFakeUnread();
        this.preview_fetched = true;
    } else {
        this.preview_fetched = false;
    }

    if (!this.mailbox) {
        this.createFakeFolder();
    }

    this.deriveData();
    this.deriveDataFixed();

    // internal state variables
    this.orig_folder_name = this.folder_name;
    this.is_parent = false;

    this.body = false;


    // Returns the preview text
    // Fetches it on the first call to this function
    this.getPreview = function() {
        if (!this.preview_fetched) {
            // call on last_unread folder, not our own mailbox
            // (we may have the parent by now)
            var url_listener = MailboxAlert.createUrlListener();
            var urlscalled = false;
            // API changed from TB2 to TB3, first try TB3 API, if
            // exception, try the other one
            try {
                urlscalled = this.last_unread.folder.fetchMsgPreviewText(
                                        [this.last_unread.messageKey],
                                        1, false, url_listener);
            } catch(e) {
                try {
                    var aOutAsync = {};
                    this.last_unread.folder.fetchMsgPreviewText(
                              [this.last_unread.messageKey],
                              1, false, url_listener, aOutAsync);
                    if (aOutAsync && aOutAsync.value) {
                        urlscalled = true;
                    }
                } catch(e2) {
                    // On some folders (news for instance), and in
                    // some other cases, fetch just throws an exception
                    // if so, just set an empty previewtext
                    this.last_unread.setProperty("preview", "<empty>");
                }
            }
            if (urlscalled) {
                url_listener.wait();
            }
            this.preview_fetched = true;
        }
        return this.last_unread.getProperty("preview");
    }

    // Changes the alert data to call for the parent folder
    this.toParent = function() {
        this.mailbox = this.mailbox.parent;

        // reinit derived data
        this.deriveData();

        this.is_parent = true;
    }

    this.getInfo = function() {
        result = "";
        result += "mailbox: " + this.mailbox + "\n";
        result += "last_unread: " + this.last_unread + "\n";
        result += "\n";
        result += "folder_name: " + this.folder_name + "\n";
        result += "folder_name_with_server: " + this.folder_name_with_server + "\n";
        result += "folder_uri: " + this.folder_uri + "\n";
        result += "message_count: " + this.message_count + "\n";
        result += "all_message_count: " + this.all_message_count + "\n";
        result += "\n";
        result += "preview_fetched: " + this.preview_fetched+ "\n";
        result += "orig_folder_name: " + this.orig_folder_name + "\n";
        result += "is_parent: " + this.is_parent + "\n";
        result += "\n";
        result += "orig_mailbox: " + this.orig_mailbox + "\n";
        result += "sender: " + this.sender + "\n";
        result += "sender_name: " + this.sender_name + "\n";
        result += "sender_address: " + this.sender_address + "\n";
        result += "recipient: " + this.recipient + "\n";
        result += "recipient_name: " + this.recipient_name + "\n";
        result += "recipient_address: " + this.recipient_address + "\n";
        result += "charset: " + this.charset + "\n";
        result += "messageBytes: " + this.messageBytes + "\n";
        result += "date: " + this.date + "\n";
        return result;
    };

    return this;
}

MailboxAlert.muted = function () {
    // If we ever need more than 1 global setting, make a GlobalPrefs like Prefs
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    var muted = false;
    try {
        var muted = prefs.getBoolPref("extensions.mailboxalert.mute");
    } catch (e) {
        // ignore, simply not set
    }
    return muted;
}

MailboxAlert.getHRMsgSize = function (messageBytes) {
    if (messageBytes) {
        if (messageBytes / 1073741824 >= 1) {
            return (Math.round(messageBytes / 1048576 * 100) / 100) + "G";
        } else if (messageBytes / 1048576 >= 1) {
            return (Math.round(messageBytes / 1048576 * 100) / 100) + "M";
        } else if (messageBytes / 1024 >= 1) {
            return (Math.round(messageBytes / 1024 * 100) / 100) + "K";
        } else {
            return messageBytes + "B";
        }
    } else {
        return "0B";
    }
}

// If 'escape' is true, return a string where certain chars have been
// replaced by html codes.
// If 'escape' is false, just return the string
MailboxAlert.escapeHTML = function (escape, string) {
    if (!escape) {
        return string;
    }
    if (string) {
        // the literal \n should be kept
        string = string.split("\n").join("%myentercode%");

        string = string.split("&").join("&#38;");
        string = string.split("\"").join("&#34;");
        string = string.split("'").join("&#39;");
        string = string.split("<").join("&#60;");
        string = string.split(">").join("&#62;");
        string = string.split("%myentercode%").join("\n");

        return string;
    } else {
        return "";
    }
}

MailboxAlert.getFullFolderName = function (folder, include_server) {
    var folderName = "";
    var i = 0;
    while(!folder.isServer && i < MailboxAlert.max_folder_depth) {
        folderName = folder.prettyName + ( folderName == "" ? "" : "/" + folderName);
        folder = folder.parent;
        i++;
    }
    if (include_server) {
        folderName = folder.prettyName +  ( folderName == "" ? "" : "/" + folderName);
    }

    return folderName;
}

MailboxAlert.getServerName = function (folder) {
    var i = 0;
    var folderName;
    while(!folder.isServer && i < MailboxAlert.max_folder_depth) {
        folderName = folder.prettyName + "/" + folderName;
        folder = folder.parent;
        i++;
    }
    return folder.prettyName;
}

/* split-join method for replaceAll() */
MailboxAlert.replace = function (string, oldstr, newstr) {
    var replacement = "";
    if (newstr) {
        replacement = newstr;
    }
    if (string) {
        if (oldstr) {
            return String(string).split(oldstr).join(replacement);
        } else {
            return string;
        }
    } else {
        return "";
    }
}

/* split-join method for replaceAll() */
/* also escape spaces */
MailboxAlert.replaceEscape = function (already_quoted, string, oldstr, newstr) {
    var escaped_new = "";
    if (newstr) {
        escaped_new = newstr;
    }
    if (string) {
        if (oldstr) {
            return string.split(oldstr).join(escaped_new);
        } else {
            return string;
        }
    } else {
        return "";
    }
}

MailboxAlert.new_alert = function (folder, last_unread) {
    var alert_data = MailboxAlert.createAlertData(folder, last_unread);
    // Only run if the message is market unread
    MailboxAlert.new_alert2(alert_data);
}

MailboxAlert.new_alert2 = function (alert_data) {
    while (true) {
        var folder_prefs = MailboxAlert.getFolderPrefs(alert_data.folder_uri);
        // Alerts for the folder itself, or any ancestor folder with alert_for_children set
        if (folder_prefs.hasAlerts() && (!alert_data.is_parent || folder_prefs.alert_for_children)) {
            for (var i = 0; i < folder_prefs.alerts.length; ++i) {
                MailboxAlertUtil.logMessage(1, "[Mailboxalert] running alert " + folder_prefs.alerts[i] + "\n");
                var alert = MailboxAlert.getAlertPreferences(folder_prefs.alerts[i]);
                if (alert) {
                    alert.run(alert_data);
                }
            }
            return;
        } else {
            if (!folder_prefs.no_alert_to_parent &&
                !alert_data.folder_is_server &&
                !(!alert_data.is_parent &&
                  folder_prefs.no_alert_to_parent)) {
                MailboxAlertUtil.logMessage(1, "[Mailboxalert] No alerts were set for ");
                MailboxAlertUtil.logMessage(1, alert_data.folder_name_with_server);
                MailboxAlertUtil.logMessage(1, ", trying parent\r\n");
                alert_data.toParent()
            } else {
                return;
            }
        }
    }
}

MailboxAlert.showMessage = function (alert_data, show_icon, icon_file, subject_pref, message, position, duration, effect, onclick, custom_position_x, custom_position_y, custom_position_anchor) {
    var message_key = alert_data.last_unread.messageKey;

    var folder_url = alert_data.folder_uri;

    if (!alert_data.messageBytes) {
        alert_data.messageBytes = "0";
    }
    var messageSize = MailboxAlert.getHRMsgSize(alert_data.messageBytes);
    var preview = alert_data.getPreview();
    var date_obj = new Date();
    date_obj.setTime(alert_data.date);
    var date_str = date_obj.toLocaleDateString();
    var time_str = date_obj.toLocaleTimeString();

    subject_pref = MailboxAlert.replace(subject_pref, "%server", alert_data.server);
    subject_pref = MailboxAlert.replace(subject_pref, "%originalfolder", alert_data.orig_folder_name);
    subject_pref = MailboxAlert.replace(subject_pref, "%folder", alert_data.folder_name);
    subject_pref = MailboxAlert.replace(subject_pref, "%countall", "" + alert_data.all_message_count);
    subject_pref = MailboxAlert.replace(subject_pref, "%count", "" + alert_data.message_count);
    subject_pref = MailboxAlert.replace(subject_pref, "%subject", alert_data.subject);
    subject_pref = MailboxAlert.replace(subject_pref, "%senderaddress", alert_data.sender_address);
    subject_pref = MailboxAlert.replace(subject_pref, "%sendername", alert_data.sender_name);
    subject_pref = MailboxAlert.replace(subject_pref, "%sender", alert_data.sender);
    subject_pref = MailboxAlert.replace(subject_pref, "%recipientaddress", alert_data.recipient_address);
    subject_pref = MailboxAlert.replace(subject_pref, "%recipientname", alert_data.recipient_name);
    subject_pref = MailboxAlert.replace(subject_pref, "%recipient", alert_data.recipient);
    subject_pref = MailboxAlert.replace(subject_pref, "%charset", alert_data.charset);
    subject_pref = MailboxAlert.replace(subject_pref, "%messagebytes", alert_data.messageBytes);
    subject_pref = MailboxAlert.replace(subject_pref, "%messagesize", messageSize);
    subject_pref = MailboxAlert.replace(subject_pref, "%date", date_str);
    subject_pref = MailboxAlert.replace(subject_pref, "%time", time_str);
    //subject_pref = MailboxAlert.replace(subject_pref, "%enter", "\n");
    subject_pref = MailboxAlert.replace(subject_pref, "%msg_preview", preview);
    subject_pref = MailboxAlert.replace(subject_pref, "%msg_uri", alert_data.msg_uri);

    var message_text = message;
    message_text = MailboxAlert.replace(message_text, "%server", alert_data.server);
    message_text = MailboxAlert.replace(message_text, "%originalfolder", alert_data.orig_folder_name);
    message_text = MailboxAlert.replace(message_text, "%folder", alert_data.folder_name);
    message_text = MailboxAlert.replace(message_text, "%countall", "" + alert_data.all_message_count);
    message_text = MailboxAlert.replace(message_text, "%count", "" + alert_data.message_count);
    message_text = MailboxAlert.replace(message_text, "%subject", alert_data.subject);
    message_text = MailboxAlert.replace(message_text, "%senderaddress", alert_data.sender_address);
    message_text = MailboxAlert.replace(message_text, "%sendername", alert_data.sender_name);
    message_text = MailboxAlert.replace(message_text, "%sender", alert_data.sender);
    message_text = MailboxAlert.replace(message_text, "%recipientaddress", alert_data.recipient_address);
    message_text = MailboxAlert.replace(message_text, "%recipientname", alert_data.recipient_name);
    message_text = MailboxAlert.replace(message_text, "%recipient", alert_data.recipient);
    message_text = MailboxAlert.replace(message_text, "%charset", alert_data.charset);
    message_text = MailboxAlert.replace(message_text, "%messagebytes", alert_data.messageBytes);
    message_text = MailboxAlert.replace(message_text, "%messagesize", messageSize);
    message_text = MailboxAlert.replace(message_text, "%date", date_str);
    message_text = MailboxAlert.replace(message_text, "%time", time_str);
    message_text = MailboxAlert.replace(message_text, "%enter", "\n");
    message_text = MailboxAlert.replace(message_text, "%msg_preview", preview);
    message_text = MailboxAlert.replace(message_text, "%msg_uri", alert_data.msg_uri);

    try {
        // use some unique value to identify the alert window, so they do not interfere
        // with each other
        var date = Date.now();
        window.openDialog('chrome://mailboxalert/content/newmailalert.xul', date, "chrome,titlebar=no,popup=yes,modal=no", subject_pref, message_text, show_icon, icon_file, alert_data.orig_mailbox, alert_data.last_unread, position, duration, effect, onclick, custom_position_x, custom_position_y, custom_position_anchor);
    } catch (e) {
        alert(e);
    }
}

/* copied from mozilla thunderbird sourcecode */
MailboxAlert.playSound = function (soundURL) {
    // Only play if global mute has not been set
    // even if not played, this still counts as having alerted
    // (that's why we check here)
    MailboxAlertUtil.logMessage(1, "playSound() called\r\n");
    if (MailboxAlert.muted()) {
        return;
    }
    if (soundURL) {
          if (soundURL.indexOf("file://") == -1) {
              soundURL = "file://" + soundURL;
          }
    } else {
        soundURL = "chrome://mailboxalert/content/ding_internal.wav";
    }
    try {
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
               .getService(Components.interfaces.nsIIOService);
        var url = ioService.newURI(soundURL, null, null);
        MailboxAlert.sound.play(url);
    } catch(e) {
        // some error, just 'beep' (which is system-dependent
        // these days)
        MailboxAlert.sound.beep();
    }
}

MailboxAlert.replaceCommandPart = function (alert_data, command, escape_html, already_quoted, date_str, time_str) {
    //alert("do replaces in '" + command + "' alert_data.subject: " + alert_data.subject);
    command = MailboxAlert.replaceEscape(already_quoted, command, "%server", MailboxAlert.escapeHTML(escape_html, alert_data.server));
    command = MailboxAlert.replaceEscape(already_quoted, command, "%folder", MailboxAlert.escapeHTML(escape_html, alert_data.folder_name));
    command = MailboxAlert.replaceEscape(already_quoted, command, "%originalfolder", MailboxAlert.escapeHTML(escape_html, alert_data.orig_folder_name));
    command = MailboxAlert.replaceEscape(already_quoted, command, "%folder_name_with_server", MailboxAlert.escapeHTML(escape_html, alert_data.folder_name_with_server));
    command = MailboxAlert.replaceEscape(already_quoted, command, "%countall", ""+alert_data.all_message_count);
    command = MailboxAlert.replaceEscape(already_quoted, command, "%count", ""+alert_data.message_count);
    //alert("3 is now: '" + command + "'");
    command = MailboxAlert.replaceEscape(already_quoted, command, "%subject", MailboxAlert.escapeHTML(escape_html, alert_data.subject));
    //alert("4 is now: '" + command + "'");
    command = MailboxAlert.replaceEscape(already_quoted, command, "%senderaddress", MailboxAlert.escapeHTML(escape_html, alert_data.sender_address));
    //alert("5 is now: '" + command + "'");
    command = MailboxAlert.replaceEscape(already_quoted, command, "%sendername", MailboxAlert.escapeHTML(escape_html, alert_data.sender_name));
    //alert("6 is now: '" + command + "'");
    command = MailboxAlert.replaceEscape(already_quoted, command, "%sender", MailboxAlert.escapeHTML(escape_html, alert_data.sender));
    command = MailboxAlert.replaceEscape(already_quoted, command, "%charset", MailboxAlert.escapeHTML(escape_html, alert_data.charset));
    command = MailboxAlert.replace(command, "%messagebytes", alert_data.message_bytes);
    command = MailboxAlert.replace(command, "%messagesize", alert_data.messageSize);
    command = MailboxAlert.replace(command, "%date", MailboxAlert.escapeHTML(escape_html, date_str));
    command = MailboxAlert.replace(command, "%time", MailboxAlert.escapeHTML(escape_html, time_str));
    command = MailboxAlert.replace(command, "%msg_preview", MailboxAlert.escapeHTML(escape_html, alert_data.getPreview()));
    command = MailboxAlert.replace(command, "%msg_uri", MailboxAlert.escapeHTML(escape_html, alert_data.msg_uri));
    //alert("10 is now: '" + command + "'");
    return command;
}

MailboxAlert.finalizeCommandPart = function (command_part, alert_data, escape_html, in_quote, date_str, time_str) {
    command_part = MailboxAlert.replaceCommandPart(alert_data, command_part, escape_html, in_quote, date_str, time_str);
    command_part = MailboxAlert.replace(command_part, "<remembered_escaped_quote>", '\"');
    command_part = MailboxAlert.replace(command_part, "<remembered_escaped_space>", '\ ');
    try {
        var tocharset = env.get("LANG").split(".")[1];
        if (alert_data.charset && tocharset) {
            try {
                var csconv = Components.classes["@mozilla.org/intl/saveascharset;1"].createInstance(Components.interfaces.nsISaveAsCharset);
                csconv.Init(tocharset, 0, 0);
                command_part = csconv.Convert(command_part);
            } catch (ce) {
                MailboxAlertUtil.logMessage(1, "Error converting " + command_part + ", leaving as is\n");
            }
        }
    } catch (e) {
        // ignore completely, looks like there's some trouble even seeing
        // whether conversion is needed
    }
    return command_part;
}


MailboxAlert.executeCommand = function (alert_data, command, escape_html) {
    var date_obj = new Date();
    date_obj.setTime(alert_data.date);
    var date_str = date_obj.toLocaleDateString()
    var time_str = date_obj.toLocaleTimeString()


    var args = new Array();
    var prev_i = 0;
    var i = 0;
    MailboxAlertUtil.logMessage(1, "command now: " + command + "\n");

    var env = Components.classes["@mozilla.org/process/environment;1"].createInstance(Components.interfaces.nsIEnvironment);

    MailboxAlertUtil.logMessage(1, "Command to execute: ");
    MailboxAlertUtil.logMessage(1, command);
    MailboxAlertUtil.logMessage(1, "\n");
    // We want to escape spaces in macro substitutions, but also allow quoting
    // so we need to determine which parts are quoted.
    // Macros in quoted parts are NOT escaped
    //
    // first we need to make sure existing escaped quotes and spaces are remembered
    command = MailboxAlert.replace(command, '\\\"', "<remembered_escaped_quote>");
    command = MailboxAlert.replace(command, '\\\ ', "<remembered_escaped_space>");

    var command_parts = command.split('"');
    var in_quote = false;
    for (var i = 0; i < command_parts.length; i++) {
        var command_part = command_parts[i];
        if (command_part.length > 0) {
            // if in quote, append next part. If not, split by
            // spaces and add each part to args
            if (!in_quote) {
                var command_part_parts = command_part.split(' ');
                for (var j = 0; j < command_part_parts.length; j++) {
                    var command_part_part = command_part_parts[j];
                    if (command_part_part.length > 0) {
                        command_part_part = MailboxAlert.finalizeCommandPart(command_part_part, alert_data, escape_html, in_quote, date_str, time_str);
                        // finalize; put back original markers, and to conversion
                        args.push(command_part_part);
                    }
                }
            } else {
                command_part = MailboxAlert.finalizeCommandPart(command_part, alert_data, escape_html, in_quote, date_str, time_str);
                args.push(command_part);
            }
        }
        in_quote = !in_quote;
    }
    //alert("args: " + args.join("|"));
    var executable_name = args.shift();
    MailboxAlertUtil.logMessage(1, "Executable: ");
    MailboxAlertUtil.logMessage(1, executable_name);
    MailboxAlertUtil.logMessage(1, "\n");
    try {
        var FileUtils = Components.utils.import("resource://gre/modules/FileUtils.jsm").FileUtils
        var exec = new FileUtils.File( executable_name )
        var pr = Components.classes["@mozilla.org/process/util;1"].
        createInstance(Components.interfaces.nsIProcess);

        // isExecutable is horribly broken in OSX, see
        // https://bugzilla.mozilla.org/show_bug.cgi?id=322865
        // It turns out to be broken in windows too...
        // removing the check, we shall have to try and run it
        // then catch NS_UNEXPECTED
        if (!exec.exists()) {
            var stringsBundle = Services.strings.createBundle("chrome://mailboxalert/locale/mailboxalert.properties");
            alert(stringsBundle.GetStringFromName('mailboxalert.error')+"\n" + exec.leafName + " " + stringsBundle.GetStringFromName('mailboxalert.error.notfound') + "\n\nFull path: "+executable_name+"\n");
            MailboxAlertUtil.logMessage(1, "Failed command:  " +executable_name + "\r\n");
            MailboxAlertUtil.logMessage(1, "Arguments: " + args + "\r\n");
            var caller = window.arguments[0];
            if (caller) {
                var executecommandcheckbox = document.getElementById('mailboxalert_execute_command');
                executecommandcheckbox.checked = false;
                setUIExecuteCommandPrefs(false);
            } else {
                var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
                prefs.setBoolPref("extensions.mailboxalert.execute_command." + alert_data.folder_name_with_server, false);
            }
        } else {
            MailboxAlertUtil.logMessage(1, "Command:  " +executable_name + "\r\n");
            MailboxAlertUtil.logMessage(1, "Arguments: " + args + "\r\n");
            var res1 = pr.init(exec);
            var result = pr.run(false, args, args.length);
        }
    } catch (e) {
        if (e.name == "NS_ERROR_FAILURE" ||
            e.name == "NS_ERROR_UNEXPECTED"
           ) {
            var stringsBundle = Services.strings.createBundle("chrome://mailboxalert/locale/mailboxalert.properties");
            alert(stringsBundle.GetStringFromName('mailboxalert.error')+"\n" + exec.leafName + " " + stringsBundle.GetStringFromName('mailboxalert.error.notfound') + "\n\nFull path: "+executable_name+"\n");
            if (caller) {
                var executecommandcheckbox = document.getElementById('mailboxalert_execute_command');
                executecommandcheckbox.checked = false;
                setUIExecuteCommandPrefs(false);
            } else {
                var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
                prefs.setBoolPref("extensions.mailboxalert.execute_command." + folder, false);
            }
        } else if (e.name == "NS_ERROR_FILE_UNRECOGNIZED_PATH") {
            MailboxAlertUtil.logMessage(1, "NS_ERROR_FILE_UNRECOGNIZED_PATH\n");
            var stringsBundle = Services.strings.createBundle("chrome://mailboxalert/locale/mailboxalert.properties");
            alert(stringsBundle.GetStringFromName('mailboxalert.error') + "\r\n\r\n" +
                  stringsBundle.GetStringFromName('mailboxalert.error.badcommandpath1') +
                  " " + alert_data.folder_name_with_server + " " +
                  stringsBundle.GetStringFromName('mailboxalert.error.badcommandpath2'));
                    var caller = window.arguments[0];
        } else {
            throw e;
        }
    }
}

// Function to create one menu item as used in fillFolderMenu
MailboxAlert.createMenuItem = function (label, value, checkbox) {
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var item = document.createElementNS(XUL_NS, "menuitem"); // create a new XUL menuitem
    item.setAttribute("label", label);
    if (value) {
        item.setAttribute("value", value);
    }
    if (checkbox) {
        item.setAttribute("closemenu", "none");
        item.setAttribute("type", "checkbox");
        item.setAttribute("autocheck", "true");
    }
    return item;
}

MailboxAlert.createMenuSeparator = function () {
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var item = document.createElementNS(XUL_NS, "menuseparator"); // create a new XUL menuitem
    return item;
}

var mailboxalert_clone_id = 1;

MailboxAlert.deleteNodeRecurse = function(node) {
    while (node.firstChild) {
        let child = node.removeChild(node.firstChild);
        MailboxAlert.deleteNodeRecurse(child);
    }
}

MailboxAlert.fillFolderMenu = function(alert_menu, folder) {
    var folder_prefs = MailboxAlert.getFolderPrefs(folder.URI);
    var all_alerts = MailboxAlert.getAllAlertPrefs();
    var stringsBundle = Services.strings.createBundle("chrome://mailboxalert/locale/mailboxalert.properties");
    var alert_menuitem;
    var alerts_set = false;

    // clear it first
    //while (alert_menu.firstChild) {
    //    alert_menu.removeChild(alert_menu.firstChild);
    //}
    MailboxAlert.deleteNodeRecurse(alert_menu);

    // need to make these first, as modifying the alerts that are set can
    // toggle whether these are enabled or not
    var alertforchildren_menuitem = MailboxAlert.createMenuItem(stringsBundle.GetStringFromName('mailboxalert.menu.alertforchildren'), null, true);
    var alertnoparent_menuitem = MailboxAlert.createMenuItem(stringsBundle.GetStringFromName('mailboxalert.menu.noalerttoparent'), null, true);

    for (var alert_i = 0; alert_i < all_alerts.length; ++alert_i) {
        let alert = all_alerts[alert_i];
        let alert_index = alert.index;
        alert_menuitem = MailboxAlert.createMenuItem(alert.get("name"), alert_index, true);
        if (folder_prefs.alertSelected(alert_index)) {
            alert_menuitem.setAttribute("checked", true);
            alerts_set = true;
        }
        alert_menuitem.addEventListener("command",
            function(){MailboxAlert.switchFolderAlert(folder.URI, alert_index,
                                                      alertforchildren_menuitem,
                                                      alertnoparent_menuitem)},
            false);
        alert_menu.appendChild(alert_menuitem);
    }

    alert_menu.appendChild(MailboxAlert.createMenuSeparator());

    if (folder_prefs.alert_for_children) {
        alertforchildren_menuitem.setAttribute("checked", true);
    }
    alertforchildren_menuitem.addEventListener("command",
        function(){MailboxAlert.switchAlertForChildren(folder.URI)},
        false);
    // disable it if there are no alerts set
    if (!alerts_set) {
        alertforchildren_menuitem.setAttribute("disabled", true);
    }
    alert_menu.appendChild(alertforchildren_menuitem);

    if (folder_prefs.no_alert_to_parent) {
        alertnoparent_menuitem.setAttribute("checked", true);
    }
    alertnoparent_menuitem.addEventListener("command",
        function(){MailboxAlert.switchNoAlertToParent(folder.URI)},
        false);
    // disable it if there are any alerts set
    if (alerts_set) {
        alertnoparent_menuitem.setAttribute("disabled", true);
    }
    alert_menu.appendChild(alertnoparent_menuitem);

    alert_menu.appendChild(MailboxAlert.createMenuSeparator());

    alert_menuitem = MailboxAlert.createMenuItem(stringsBundle.GetStringFromName('mailboxalert.menu.editalerts'), null, false);
    alert_menuitem.addEventListener("command",
        function(){window.openDialog('chrome://mailboxalert/content/alert_list.xul',
                                     'mailboxalert_prefs', 'chrome');},
        false);
    alert_menu.appendChild(alert_menuitem);

    MailboxAlertUtil.logMessage(1, "MENU NOW HAS:\n");
    var nodeList = alert_menu.childNodes;
    for(var i = 0; i < nodeList.length; i++) {
       MailboxAlertUtil.logMessage(1, "id: " + nodeList[i].id);
       MailboxAlertUtil.logMessage(1, "name: " + nodeList[i].nodeName);
       MailboxAlertUtil.logMessage(1, "label: " + nodeList[i].label);
    }
    MailboxAlertUtil.logMessage(1, "END OF MENU\n");
}

