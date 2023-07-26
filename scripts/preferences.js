// Functions for retrieving and setting (collections of) preferences
//
// Intended to make porting to local storage prefs later easier, but
// right now, uses the LegacyPrefs experiment.

var alertPrefsDefs = {
    "show_message": [ "bool", false],
    "show_message_icon": [ "bool", true ],
    "show_message_icon_file": [ "string", "resource://mailboxalert-skin/mailboxalert.png" ],
    "show_message_subject": [ "string", "" ],
    "show_message_message": [ "string", "" ],
    "play_sound": [ "bool", false ],
    "play_sound_wav": [ "bool", false ],
    "play_sound_wav_file": [ "string", "" ],
    "execute_command": [ "bool", false ],
    "command": [ "string", "" ],
    "command_escape": [ "bool", false ],
    "command_escape_windows_quotes": [ "bool", false ],
    "name": [ "string", "" ],
    "show_message_duration": [ "integer", 5 ],
    "show_message_position": [ "string", "top-left" ],
    "show_message_effect": [ "string", "slide" ],
    "show_message_onclick": [ "string", "close" ],
    "show_message_custom_position_x": [ "integer", -1 ],
    "show_message_custom_position_y": [ "integer", -1 ],
    "show_message_custom_position_anchor": [ "string", "topleft" ],
}

export function logMessage(level, message) {
    console.log("[Mailbox Alert] " + message);
}

export function getFolderURI(mailFolder) {
    console.log("[XX] ACCOUNT ID: " + mailFolder.accountId);
    let account = messenger.accounts.get(mailFolder.accountId);
    console.log("[XX] ACCOUNT: " + account);
    //return account.type + "://" + account.identities[0] + mailFolder.path;
    
    return account.type + "://" + account.id + mailFolder.path;
}

export async function newGetFolderURI(mailFolder) {
    console.log("[XX] new get folder uri for " + mailFolder);
    let account = await messenger.accounts.get(mailFolder.accountId);
    let result = account.type + "://" + account.identities[0].email + mailFolder.path;
    console.log("[XX] FOLDER URI: " + result);
    return result;
}

/*
 * Returns a 'folder preferences' object, which can be used
 * to read and modify, the alert settings for a given folder
 */
export async function getFolderPrefs(mailFolder) {
    var folder_prefs = {};

    let uri = await newGetFolderURI(mailFolder);

    folder_prefs.uri = uri;
    folder_prefs.alerts = [];
    folder_prefs.alert_for_children = false;
    folder_prefs.no_alert_to_parent = false;

    logMessage(1, "Loading folder preferences for " + uri + "\n");
    try {
        folder_prefs.alert_for_children = await browser.LegacyPrefs.getPref("extensions.mailboxalert.folders." + uri + ".alert_for_children", false);
        logMessage(1, "Alert for children: " + folder_prefs.alert_for_children + "\n");
    } catch (e) {
        // n/m, wasn't set
        logMessage(5, "Alert for children not set or error: " + e);
    }
    try {
        folder_prefs.no_alert_to_parent = await browser.LegacyPrefs.getPref("extensions.mailboxalert.folders." + uri + ".no_alert_to_parent", false);
        logMessage(1, "No alert to parent: " + folder_prefs.no_alert_to_parent + "\n");
    } catch (e) {
        // n/m, wasn't set
        logMessage(5, "No alert to parent not set or error: " + e);
    }
    try {
        var alerts_string = await browser.LegacyPrefs.getPref("extensions.mailboxalert.folders." + uri + ".alerts", "");
        logMessage(1, "Alerts: " + alerts_string + "\n");
        var alerts_parts = alerts_string.split(",");
        for (var i = 0; i < alerts_parts.length; i++) {
            if (alerts_parts[i] != "") {
                folder_prefs.alerts.push(alerts_parts[i]);
            }
        }
    } catch (e) {
        // n/m, wasn't set
        logMessage(5, "Alerts for folder not set or error: " + e);
    }

    // Returns true if the given alert (by index) is
    // enabled for this folder
    folder_prefs.alertActive = function (alertIndex) {
        for (var i = 0; i < this.alerts.length; ++i) {
            if (this.alerts[i] == alertIndex) {
                return true;
            }
        }
        return false;
    }

    // returns true if it got added, false if it was already present
    folder_prefs.addAlert = function (alertIndex) {
        console.log("[XX] ADD ALERT " + alertIndex);
        var already_there = false;
        for (var i = 0; i < this.alerts.length; ++i) {
            if (this.alerts[i] == alertIndex) {
                console.log("[XX] alert already there " + alertIndex);
                already_there = true;
            }
        }
        if (!already_there) {
            console.log("[XX] alert not already there " + alertIndex);
            this.alerts.push(alertIndex);
        }
        return !already_there;
    }

    // Returns true if it got removed, false if it wasn't there
    // in the first place
    folder_prefs.removeAlert = function (alert_index) {
        var new_alerts = []
        var was_there = false;
        for (var i = 0; i < this.alerts.length; ++i) {
            if (this.alerts[i] != alert_index) {
                new_alerts.push(this.alerts[i]);
            } else {
                was_there = true;
            }
        }
        this.alerts = new_alerts;
        return !was_there;
    }

    folder_prefs.store = async function () {
        logMessage(1, "Storing folder preferences for " + this.uri + "\n");
        if (this.alert_for_children) {
            await browser.LegacyPrefs.setPref("extensions.mailboxalert.folders." + this.uri + ".alert_for_children", true);
            logMessage(1, "Alert for children: true\n");
        } else {
            // remove if exists
            await browser.LegacyPrefs.clearUserPref("extensions.mailboxalert.folders." + this.uri + ".alert_for_children");
            logMessage(1, "Alert for children: false\n");
        }
        if (this.no_alert_to_parent) {
            await browser.LegacyPrefs.setPref("extensions.mailboxalert.folders." + this.uri + ".no_alert_to_parent", true);
            logMessage(1, "No alert to parent: true\n");
        } else {
            // remove if exists
            await browser.LegacyPrefs.clearUserPref("extensions.mailboxalert.folders." + this.uri + ".no_alert_to_parent");
            logMessage(1, "No alert to parent: false\n");
        }
        if (this.alerts.length != 0) {
            console.log("[XX] STORE ALERTS: " + JSON.stringify(this.alerts));
            await browser.LegacyPrefs.setPref("extensions.mailboxalert.folders." + this.uri + ".alerts", this.alerts.join(","));
            logMessage(1, "Alerts: " + this.alerts.join(",") + "\n");
        } else {
            // remove if exists
            await browser.LegacyPrefs.clearUserPref("extensions.mailboxalert.folders." + this.uri + ".alerts");
            logMessage(1, "No alerts\n");
        }
        logMessage(1, "Done storing folder preferences for " + this.uri + "\n");
    }

    folder_prefs.hasAlerts = function () {
        logMessage(1, "Folder " + this.uri + " has alerts: " + (this.alerts.length > 0));
        //alert("hasAlerts: " + this.alerts.length + " " + this.alerts);
        return (this.alerts.length > 0);
    }

    return folder_prefs;
}


export async function getAlertPreferences(index) {
    var alert_prefs = {};

    alert_prefs.index = index;

    alert_prefs.values = {};

    alert_prefs.get = async function (name) {
        if (!(name in this.values)) {
            var pref_name = "extensions.mailboxalert.alerts." + this.index + "." + name;
            let pref_value = await browser.LegacyPrefs.getPref(pref_name, "");
            if (pref_value != "") {
                this.values[name] = pref_value;
            } else {
                var pref_data = alertPrefsDefs[name]
                if (pref_data != null) {
                   this.values[name] = alertPrefsDefs[name][1];
                }
            }
        }
        return this.values[name];
    }

    alert_prefs.set = function(name, value) {
        // should we type-check here?)
        if (!(name in alertPrefsDefs)) {
            alert("Error, setting unknown pref value " + name + " to " + value);
        }
        this.values[name] = value;
    }

    alert_prefs.store = async function() {
        if (!this.index || this.index == 0) {
            alert("Internal error. Attempting to store alert_prefs with index 0. Please contact the developers.");
            return;
        }
        for (var name in alertPrefsDefs) {
            var type = alertPrefsDefs[name][0];
            var pref_default = alertPrefsDefs[name][1];
            if (name in this.values && !(this.values[name] == pref_default)) {
                // non-default, so store it
                console.log("[XX] SETPREF: " + "extensions.mailboxalert.alerts." + this.index + "." + name);
                console.log("[XX] VALUE: " + this.values[name]);
                await browser.LegacyPrefs.setPref("extensions.mailboxalert.alerts." + this.index + "." + name, this.values[name]);
            } else {
                // it is unset or it is default, remove any pref previously set
                try {
                    await browser.LegacyPrefs.clearUserPref("extensions.mailboxalert.alerts." + this.index + "." + name);
                } catch (e) {
                    // That did not work, oh well, just leave it.
                }
            }
        }
    }

    // Returns true if the given 'other' alert_prefs has all the same
    // values (i.e. all the same values for the items in AlertPrefDefs,
    // except the 'name' value)
    alert_prefs.equals = function(other) {
        if (this.index == other.index) {
            return true;
        }

        for (var name in alertPrefsDefs) {
            if (name != "name" && this.get(name) != other.get(name)) {
                return false;
            }
        }
        return true;
    }

    alert_prefs.createNewIndex = async function() {
        if (this.index != 0) {
            alert("[MailboxAlert] Internal error. Attempting to create new index for alert that already has one (" + this.index + "), please contact the developers.");
            return;
        }
        this.index = await findAvailableAlertPrefsId();
        return this.index;
    }

    alert_prefs.dump = function () {
        for (var name in alertPrefsDefs) {
            var pref_default = alertPrefsDefs[name][1];
            if (name in this.values && !(this.values[name] == pref_default)) {
                logMessage(1, "alert_pref[" + this.index + "] " + name + " = " + this.get(name) + "\n");
            }
        }
    }

    // removes all preferences for this alert. ONLY call this if there
    // are no folders set!
    alert_prefs.remove = async function () {
        for (var name in alertPrefsDefs) {
            try {
                await browser.LegacyPrefs.clearUserPref("extensions.mailboxalert.alerts." + this.index + "." + name);
            } catch (e) {
                // That did not work, oh well, just leave it.
            }
        }
        this.index = 0;
    }

    alert_prefs.run = function (alert_data) {
		logMessage(1, "run() called\r\n");
        if (this.get("show_message")) {
            MailboxAlert.showMessage(alert_data,
                                    this.get("show_message_icon"),
                                    this.get("show_message_icon_file"),
                                    this.get("show_message_subject"),
                                    this.get("show_message_message"),
                                    this.get("show_message_position"),
                                    this.get("show_message_duration"),
                                    this.get("show_message_effect"),
                                    this.get("show_message_onclick"),
                                    this.get("show_message_custom_position_x"),
                                    this.get("show_message_custom_position_y"),
                                    this.get("show_message_custom_position_anchor")
                                    );
        }
        if (this.get("play_sound")) {
            if (this.get("play_sound_wav")) {
                MailboxAlert.playSound(this.get("play_sound_wav_file"));
            } else {
                MailboxAlert.playSound();
            }
        }
        if (this.get("execute_command")) {
            MailboxAlert.executeCommand(alert_data,
                                        this.get("command"),
                                        this.get("command_escape"),
                                        this.get("command_escape_windows_quotes"));
        }
    }

    if (index != 0 && await alert_prefs.get("name") == "") {
        // Alert with this index does not exist
        return null;
    }

    return alert_prefs;
}

/*
 * Returns a list of all the configured alerts
 */
let MAX_ALERTS = 100;
export async function getAllAlertPrefs() {
    var alert_list = []
    for (var i = 1; i <= MAX_ALERTS; i++) {
        try {
            var alert_prefs = await getAlertPreferences(i);
            if (alert_prefs) {
                alert_list.push(alert_prefs);
                console.log("found alert for " + i + "!");
            }
        } catch (e) {
            console.log("no alert for " + i);
            // no alert with this id, skip
        }
    }
    return alert_list;
}

export async function findAvailableAlertPrefsId() {
    var alert_list = []
    for (var i = 1; i <= MAX_ALERTS; i++) {
//        try {
            var alert_prefs = await getAlertPreferences(i);
            if (alert_prefs) {
                alert_list.push(alert_prefs);
            } else {
                return i;
            }
//        } catch (e) {
//            console.log("[XX] Error: " + e);
//            // no alert with this id, skip
//        }
    }
}

export async function initialAlertConfiguration() {
    // Checks whether there are any alerts configured, and if not, sets up the first 2
    let default_alert = await getAlertPreferences(0);

    default_alert.set("name", messenger.i18n.getMessage("mailboxalert.default_message"));
    default_alert.set("show_message", true);
    default_alert.set("show_message_subject", "%sendername on %originalfolder");
    default_alert.set("show_message_message", "%subject");
    let all_alerts = await getAllAlertPrefs();
    if (all_alerts.length == 0) {
        logMessage(1, `Alerts configured: ${all_alerts.length}`);
        let exists = false;
        for (var i = 0; i < all_alerts.length; ++i) {
            let existing_alert = all_alerts[i];
            if (existing_alert.equals(default_alert)) {
                // ok just stop and return
                exists = true;
            }
        }
        if (!exists) {
            await default_alert.createNewIndex();
            default_alert.store();
        }

        default_alert = await getAlertPreferences(0);
        default_alert.set("name", messenger.i18n.getMessage("mailboxalert.default_sound"));
        default_alert.set("play_sound", true);
        exists = false;
        for (var i = 0; i < all_alerts.length; ++i) {
            var existing_alert = all_alerts[i];
            if (existing_alert.equals(default_alert)) {
                // ok just stop and return
                exists = true;
            }
        }
        if (!exists) {
            await default_alert.createNewIndex();
            default_alert.store();
        }

        await browser.LegacyPrefs.setPref("extensions.mailboxalert.prefsversion", 15);
    }
    logMessage(1, "Configuration initialized");
}

// If the given alert is disabled, enable it
// If it is enabled, disable it
export async function toggleAlertForFolder(alertIndex, folderPrefs) {
    if (!folderPrefs.addAlert(alertIndex)) {
        folderPrefs.removeAlert(alertIndex);
    }
    folderPrefs.store();
}
