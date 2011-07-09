//
// Copyright 2010, Jelte Jansen
// BSD licensed, see LICENSE for details
//

// Note:
// For automatic conversion from 0.14, this file contains
// definitions for both 0.14-style prefs:
// - folderPrefDefs14
// - getFolderPreferences14
// and 0.15
// - alertPrefDefs
// - getAlertPreferences
// For the conversion routine, getAlertPreferences takes one argument,
// if 1 or more, it'll read the prefs from the global preferences
// database. If 0, it will create an empty preferences object, which
// can be filled in. This is used when creating a new one, and when
// converting from 0.14
//
// Then there is a conversion function
// - convertFolderPreferences14toAlertPreferences

//
// Use a namespace for global variables
//

if (typeof(MailboxAlert) == "undefined") {
    var MailboxAlert = {};
}

/* variables for queue handling
 * TODO: queue 'type' with functions (or perhaps remove
 * queueing altogether)
 * (perhaps we can now)
 */
MailboxAlert.queue_length = 0;
MailboxAlert.max_queue_length = 10;
MailboxAlert.queue = new Array(MailboxAlert.max_queue_length);
MailboxAlert.queue_s = new Array(MailboxAlert.max_queue_length);
MailboxAlert.queue_message = new Array(MailboxAlert.max_queue_length);

/* simple lock */
MailboxAlert.running = false;

/* some other protection consts */
MailboxAlert.max_folder_depth = 10;

/* Time to wait before trying for the first time, so that
   the adaptive junk filter can have its way with the folder
   first (in milliseconds) */
MailboxAlert.initial_wait_time = 2000;

/* Time to wait before retrying busy folders (in milliseconds) */
MailboxAlert.wait_time = 5000;

/* Variable to store a renamed folder (we're assuming there's only
 * going to be one renamed folder at a time)
 */
MailboxAlert.renamed_folder = null;

/*
 * Maximum number of supported alerts
 */
MailboxAlert.max_alerts = 100;

//
// We have 2 structures that represent configuration values
// 
// - 'global preferences'
//      these are the preferences for where the window goes
// - 'folder preferences'
// 
// A future version will decouple this, and make it three
// - global
// - alert preferences
// - folder->alert link

// These all define at least load() (which is called on creation)
// and save()

MailboxAlert.prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

// These are the 'global' preferences as they were defined
// in mailbox alert 0.14
// All of these are now direct alert preferences in 0.15
// so this object is only used for conversion
MailboxAlert.getGlobalPreferences14 = function() {
    var global_prefs = {};
    global_prefs.position = "top-left";
    global_prefs.effect = "none";
    global_prefs.duration = 5;
    global_prefs.onclick = "close";

    try {
        var pospref = MailboxAlert.prefService.getCharPref("extensions.mailboxalert.alert_position");
        if (pospref == "tr") {
            global_prefs.position = "top-right";
        } else if (pospref == "bl") {
            global_prefs.position = "bottom-left";
        } else if (pospref == "br") {
            global_prefs.position = "bottom-right";
        } else if (pospref == "c") {
            global_prefs.position = "center";
        }
    } catch (e) {
        // wasn't set, n/m
    }
    try {
        global_prefs.effect = MailboxAlert.prefService.getCharPref("extensions.mailboxalert.alert_effect");
    } catch (e) {
        // wasn't set, n/m
    }
    try {
        global_prefs.duration = MailboxAlert.prefService.getIntPref("extensions.mailboxalert.alert_duration");
    } catch (e) {
        // wasn't set, n/m
    }
    try {
        global_prefs.onclick = MailboxAlert.prefService.getIntPref("extensions.mailboxalert.alert_onclick");
    } catch (e) {
        // wasn't set, n/m
    }

    // TODO: Once we change names in AlertPrefDefs, update them here
    global_prefs.applyToAlertPrefs = function (alert_prefs) {
        alert_prefs.set("show_message_position", this.position);
        alert_prefs.set("show_message_duration", this.duration);
        alert_prefs.set("show_message_effect", this.effect);
        alert_prefs.set("show_message_onclick", this.onclick);
    }

    // WARNING: DON'T USE UNTIL CONVERSION IS DONE
    global_prefs.deleteBranch = function (branchname) {
        try {
            MailboxAlert.prefService.deleteBranch(branchname);
        } catch (e) {
            // ok leave them then
        }
    }
    // WARNING: DON'T USE UNTIL CONVERSION IS DONE
    global_prefs.deleteAll = function () {
        // TODO: can we delete delay now?
        //this.deleteBranch("extensions.mailboxalert.alert_delay");
        this.deleteBranch("extensions.mailboxalert.alert_position");
        this.deleteBranch("extensions.mailboxalert.alert_effect");
        this.deleteBranch("extensions.mailboxalert.alert_duration");
        this.deleteBranch("extensions.mailboxalert.alert_onclick");
    }

    return global_prefs;
}

// This is the list of preferences for mailboxalert 0.14
//
// idea for prefs;
// big array of arrays
// [name, prefname, type, default]
// 
// prefs object defines:
// - set(name, value)
// - get(name)
// - store()
// - dump()
// 
// get checks if we have gotten it before
// internally this needs an extra bool too (which is what 'read' is for)
// internal helpers:
// - isRead(name)
// - isDefault(name)
//
// global array makes sense
// so prefs just needs an array of 'read' values
MailboxAlert.folderPrefDefs14 = {
"show_message": [ "bool", false],
"show_message_icon": [ "bool", true ],
"icon_file": [ "string", "chrome://mailboxalert/skin/mailboxalert.png" ],
"subject": [ "string", "" ],
"message": [ "string", "" ],
"play_sound": [ "bool", false ],
"sound_wav": [ "bool", false ],
"sound_wav_file": [ "string", "" ],
"execute_command": [ "bool", false ],
"command": [ "string", "" ],
"escape": [ "bool", false ],
"alert_for_children": [ "bool", false ],
"no_alert_to_parent": [ "bool", false ]
}

// The preferences list for mailbox alert 0.15
// In this initial version, it is the same as the folder prefs list for 0.14
// with the added value 'name'.
// for conversion from 0.14, it is essential that everything before 'name'
// keeps the current name (see convert function in folderprefs14)

// TODO: rename everything below name (for those above, add conversion?)
// (don't forget to update alert_settings.xul)
MailboxAlert.alertPrefDefs = {
"show_message": [ "bool", false],
"show_message_icon": [ "bool", true ],
"show_message_icon_file": [ "string", "chrome://mailboxalert/skin/mailboxalert.png" ],
"show_message_subject": [ "string", "" ],
"show_message_message": [ "string", "" ],
"play_sound": [ "bool", false ],
"play_sound_wav": [ "bool", false ],
"play_sound_wav_file": [ "string", "" ],
"execute_command": [ "bool", false ],
"command": [ "string", "" ],
"command_escape": [ "bool", false ],
"name": [ "string", "" ],
"show_message_duration": [ "integer", 5 ],
"show_message_position": [ "string", "top-left" ],
"show_message_effect": [ "string", "slide" ],
"show_message_onclick": [ "string", "close" ],
}

// This returns the preferences for the folder in mailboxalert
// 0.14
MailboxAlert.getFolderPreferences14 = function(folder_uri) {
    dump("[XX] Getting prefs for: " + folder_uri + "\n");
    var folder_prefs = {};
    folder_prefs.folder_uri = folder_uri;
    folder_prefs.values = {};
    
    folder_prefs.get = function (name) {
        dump("[XX] Getting pref for " + name + "\n");
        if (!(name in this.values)) {
            dump("[XX] pref not cached yet\n");
            dump("[XX] full name: extensions.mailboxalert." + name + "." + this.folder_uri + "\n");
            // get it from the prefs thingy
            try {
                if (MailboxAlert.folderPrefDefs14[name][0] == "bool") {
                    this.values[name] = MailboxAlert.prefService.getBoolPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                } else if (MailboxAlert.folderPrefDefs14[name][0] == "string") {
                    this.values[name] = MailboxAlert.prefService.getCharPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                } else if (MailboxAlert.folderPrefDefs14[name][0] == "integer") {
                    this.values[name] = MailboxAlert.prefService.getIntPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                }
                dump("[XX] found value in prefs store\n");
            } catch(e) {
                dump("[XX] found no value in prefs store\n");
                
                // ok pref doesn't exist yet.
                // should we not set and just return?
                pref_data = MailboxAlert.folderPrefDefs14[name]
                if (pref_data != null) {
                    dump("[XX] default: " + MailboxAlert.folderPrefDefs14[name][1]);
                   this.values[name] = MailboxAlert.folderPrefDefs14[name][1];
                } else {
                    alert("[XX] pref " + name + " unknown!");
                }
            }
        } else {
            dump("[XX] already cached\n");
        }
        dump("[XX] value: " + this.values[name] + "\n");
        return this.values[name];
    }
    
    folder_prefs.set = function(name, value) {
        // should we type-check here?)
        dump("[XX] SET VALUE OF " + name + " TO " + value + "\n");
        dump("[XX] (which is a " + typeof(value) + ")\n");
        if (!(name in MailboxAlert.folderPrefDefs14)) {
            alert("Error, setting unknown pref value " + name + " to " + value);
        }
        this.values[name] = value;
    }

    folder_prefs.store = function() {
        dump("[XX] store prefs for " + this.folder_uri + "\n")
        for (var name in MailboxAlert.folderPrefDefs14) {
            var type = MailboxAlert.folderPrefDefs14[name][0];
            var pref_default = MailboxAlert.folderPrefDefs14[name][1];
            dump("[XX] name: " + name + "\n");
            dump("[xX] in values: " + (name in this.values) + "\n");
            if (name in this.values) {
                dump("[XX] value: " + this.values[name] + "\n");
                dump("[XX] default: " + pref_default + "\n");
            }
            if (name in this.values && !(this.values[name] == pref_default)) {
                dump("[XX] not default, store it to extensions.mailboxalert." + name + "." + this.folder_uri + "\n");
                dump("[XX] (that is, set it to " + this.values[name] + ")\n");
                dump("[XX] (which is a " + typeof(this.values[name]) + ")\n");
                // non-default, so store it
                if (MailboxAlert.folderPrefDefs14[name][0] == "bool") {
                    MailboxAlert.prefService.setBoolPref("extensions.mailboxalert." + name + "." + this.folder_uri, this.values[name]);
                } else if (MailboxAlert.folderPrefDefs14[name][0] == "string") {
                    MailboxAlert.prefService.setCharPref("extensions.mailboxalert." + name + "." + this.folder_uri, this.values[name]);
                } else if (MailboxAlert.folderPrefDefs14[name][0] == "integer") {
                    MailboxAlert.prefService.setIntPref("extensions.mailboxalert." + name + "." + this.folder_uri, this.values[name]);
                }
            } else {
                dump("[XX] not in values, or default, clear extensions.mailboxalert." + name + "." + this.folder_uri + "\n");
                // it is unset or it is default, remove any pref previously set
                try {
                    MailboxAlert.prefService.clearUserPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                } catch (e) {
                    // That did not work, oh well, just leave it.
                    dump("[XX] got an error while clearing " + name + " for " + this.folder_uri + ", skipping\n");
                    //dump("[XX] the error was:\n");
                    //dump(e);
                    //dump("\n");
                }
            }
        }
    }

    folder_prefs.dump = function() {
        dump("[XX] All folder prefs for " + this.folder_uri + "\n")
        for (var name in MailboxAlert.folderPrefDefs14) {
            var type = MailboxAlert.folderPrefDefs14[name][0];
            dump(name + " (" + type + "): " + this.get(name) + "\n");
        }
    }

    // Takes the settings for this folder, if any, and converts them
    // to a new style alert prefs object. After conversion, it checks
    // if there are any existing alert prefs that match, if not it
    // adds it to the set. Returns the index of the alert_prefs when
    // done
    folder_prefs.convertToAlertPrefs = function() {
        var new_alert = MailboxAlert.getAlertPreferences(0);
        for (var name in MailboxAlert.folderPrefDefs14) {
            // specific list of items that is ignored for the
            // purposes of this exercise (in the new style,
            // they are related to folder settings, not alert
            // settings)
            if (name != "no_alert_to_parent" &&
                name != "alert_for_children") {
                // special cases for changed names
                if (name == "subject") {
                    new_alert.set("show_message_subject", this.get(name));
                } else if (name == "icon_file") {
                    new_alert.set("show_message_icon_file", this.get(name));
                } else if (name == "message") {
                    new_alert.set("show_message_message", this.get(name));
                } else if (name == "sound_wav") {
                    new_alert.set("play_sound_wav", this.get(name));
                } else if (name == "sound_wav_file") {
                    new_alert.set("play_sound_wav_file", this.get(name));
                } else if (name == "escape") {
                    new_alert.set("command_escape", this.get(name));
                } else {
                    new_alert.set(name, this.get(name));
                }
            }
        }
        var global_prefs = MailboxAlert.getGlobalPreferences14();
        global_prefs.applyToAlertPrefs(new_alert);
        
        // get all alert prefs, and see if any match this new one
        var all_alerts = MailboxAlert.getAllAlertPrefs();
        for (var i = 0; i < all_alerts.length; ++i) {
            var existing_alert = all_alerts[i];
            
            if (existing_alert.equals(new_alert)) {
                // ok just stop and return
                return existing_alert.index;
            }
        }
        // if not, create a new index, and come up with a name, then
        // store it.
        var new_index = new_alert.createNewIndex();
        //alert("[XX] removeme. Alert is new, index: " + new_alert.index);
        new_alert.set("name", "converted_alert_" + new_index);
        new_alert.store();
        return new_index;
    }
    
    // Deletes the folder prefs. They are gone forever.
    folder_prefs.remove = function () {
        // set all to default, then store the folderprefs
        for (var name in MailboxAlert.folderPrefDefs14) {
            this.set(name, MailboxAlert.folderPrefDefs14[name][1]);
        }
        this.store();
    }

    return folder_prefs;
}

// Create an AlertPreferences object
// The argument index is the alert number to get
// If index is 0, this will create an 'empty' preferences object, with
// default values, to be filled in later.
// if index is 0, you can make it a 'new' index with createNewIndex()
// if index is 0, you cannot store or get values
MailboxAlert.getAlertPreferences = function (index) {
    var alert_prefs = {};

    alert_prefs.index = index;

    alert_prefs.values = {};
    
    alert_prefs.get = function (name) {
        //dump("[XX] Getting pref for " + this.index + "\n");
        if (!(name in this.values)) {
            //dump("[XX] pref not cached yet\n");
            //dump("[XX] full name: extensions.mailboxalert." + this.index + "." + name + "\n");
            // get it from the prefs thingy
            try {
                if (MailboxAlert.alertPrefDefs[name][0] == "bool") {
                    this.values[name] = MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.alerts." + this.index + "." + name);
                } else if (MailboxAlert.alertPrefDefs[name][0] == "string") {
                    this.values[name] = MailboxAlert.prefService.getCharPref("extensions.mailboxalert.alerts." + this.index + "." + name);
                } else if (MailboxAlert.alertPrefDefs[name][0] == "integer") {
                    this.values[name] = MailboxAlert.prefService.getIntPref("extensions.mailboxalert.alerts." + this.index + "." + name);
                }
                //dump("[XX] found value in prefs store\n");
            } catch(e) {
                //dump("[XX] found no value in prefs store\n");
                
                // ok pref doesn't exist yet.
                // should we not set and just return?
                pref_data = MailboxAlert.alertPrefDefs[name]
                if (pref_data != null) {
                    //dump("[XX] default: " + MailboxAlert.alertPrefDefs[name][1]);
                   this.values[name] = MailboxAlert.alertPrefDefs[name][1];
                } else {
                    alert("[XX] pref " + name + " unknown!");
                }
            }
        } else {
            //dump("[XX] already cached\n");
        }
        //dump("[XX] value: " + this.values[name] + "\n");
        return this.values[name];
    }
    
    alert_prefs.set = function(name, value) {
        // should we type-check here?)
        //dump("[XX] SET VALUE OF " + name + " TO " + value + "\n");
        //dump("[XX] (which is a " + typeof(value) + ")\n");
        if (!(name in MailboxAlert.alertPrefDefs)) {
            alert("Error, setting unknown pref value " + name + " to " + value);
        }
        this.values[name] = value;
    }

    alert_prefs.store = function() {
        if (!this.index || this.index == 0) {
            alert("Internal error. Attempting to store alert_prefs with index 0. Please contact the developers.");
            return;
        }
        dump("[XX] store prefs for " + this.folder_uri + "\n")
        for (var name in MailboxAlert.alertPrefDefs) {
            var type = MailboxAlert.alertPrefDefs[name][0];
            var pref_default = MailboxAlert.alertPrefDefs[name][1];
            dump("[XX] name: " + name + "\n");
            dump("[xX] in values: " + (name in this.values) + "\n");
            if (name in this.values) {
                dump("[XX] value: " + this.values[name] + "\n");
                dump("[XX] default: " + pref_default + "\n");
            }
            if (name in this.values && !(this.values[name] == pref_default)) {
                dump("[XX] not default, store it to extensions.mailboxalert.alerts." + this.index + "." + name + "\n");
                dump("[XX] (that is, set it to " + this.values[name] + ")\n");
                dump("[XX] (which is a " + typeof(this.values[name]) + ")\n");
                // non-default, so store it
                if (MailboxAlert.alertPrefDefs[name][0] == "bool") {
                    MailboxAlert.prefService.setBoolPref("extensions.mailboxalert.alerts." + this.index + "." + name, this.values[name]);
                } else if (MailboxAlert.alertPrefDefs[name][0] == "string") {
                    MailboxAlert.prefService.setCharPref("extensions.mailboxalert.alerts." + this.index + "." + name, this.values[name]);
                } else if (MailboxAlert.alertPrefDefs[name][0] == "integer") {
                    MailboxAlert.prefService.setIntPref("extensions.mailboxalert.alerts." + this.index + "." + name, this.values[name]);
                }
            } else {
                dump("[XX] not in values, or default, clear extensions.mailboxalert.alerts." + this.index + "." + name + "\n");
                // it is unset or it is default, remove any pref previously set
                try {
                    MailboxAlert.prefService.clearUserPref("extensions.mailboxalert.alerts." + this.index + "." + name);
                } catch (e) {
                    // That did not work, oh well, just leave it.
                    dump("[XX] got an error while clearing " + name + " for " + this.folder_uri + ", skipping\n");
                    //dump("[XX] the error was:\n");
                    //dump(e);
                    //dump("\n");
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

        for (var name in MailboxAlert.alertPrefDefs) {
            if (name != "name" && this.get(name) != other.get(name)) {
                dump("[XX] difference between alert " + this.index + " and " + other.index + ": " + name + "\n");
                return false;
            }
        }
        return true;
    }

    alert_prefs.createNewIndex = function() {
        if (this.index != 0) {
            alert("[XX] Internal error. Attempting to create new index for alert that already has one (" + this.index + "), please contact the developers.");
            return;
        }
        //alert("[XX] create new index. from " + this.index);
        this.index = MailboxAlert.findAvailableAlertPrefsId();
        //alert("[XX] to: " + this.index);
        return this.index;
    }

    alert_prefs.dump = function () {
        for (var name in MailboxAlert.alertPrefDefs) {
            var pref_default = MailboxAlert.alertPrefDefs[name][1];
            if (name in this.values && !(this.values[name] == pref_default)) {
                dump("alert_pref[" + this.index + "] " + name + " = " + this.get(name) + "\n");
            }
        }
    }
    
    // removes all preferences for this alert. ONLY call this if there
    // are no folders set!
    alert_prefs.remove = function () {
        MailboxAlert.prefService.deleteBranch("extensions.mailboxalert.alerts." + this.index);
        this.index = 0;
    }

    alert_prefs.run = function (alert_data) {
        if (this.get("show_message")) {
            MailboxAlert.showMessage(alert_data,
                                    this.get("show_message_icon"),
                                    this.get("show_message_icon_file"),
                                    this.get("show_message_subject"),
                                    this.get("show_message_message"),
                                    this.get("show_message_position"),
                                    this.get("show_message_duration"),
                                    this.get("show_message_effect"),
                                    this.get("show_message_onclick")
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
            MailboxAlert.execute_command(alert_data,
                                         this.get("command"),
                                         this.get("command_escape"));
        }
    }

    if (index != 0 && alert_prefs.get("name") == "") {
        throw "Alert with index " + index + " not found";
    }

    return alert_prefs;
}

// Returns a folder_prefs object
// this object contains:
// alerts: an array of alert id's
// no_alert_to_parent: true or false
// alert_for_children: true or false
MailboxAlert.getFolderPrefs = function (uri) {
    var folder_prefs = {};

    folder_prefs.uri = uri;
    folder_prefs.alerts = [];
    folder_prefs.alert_for_children = false;
    folder_prefs.no_alert_to_parent = false;

    try {
        folder_prefs.alert_for_children = MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.folders." + uri + ".alert_for_children");
    } catch (e) {
        // n/m, wasn't set
    }
    try {
        folder_prefs.no_alert_to_parent = MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.folders." + uri + ".no_alert_to_parent");
    } catch (e) {
        // n/m, wasn't set
    }
    try {
        var alerts_string = MailboxAlert.prefService.getCharPref("extensions.mailboxalert.folders." + uri + ".alerts");
        var alerts_parts = alerts_string.split(",");
        for (var i = 0; i < alerts_parts.length; i++) {
            folder_prefs.alerts.push(alerts_parts[i]);
        }
    } catch (e) {
        // n/m, wasn't set
    }

    // Returns true if the given alert (of type alertPrefs) is
    // enabled for this folder
    folder_prefs.alertSelected = function (alert_index) {
        for (var i = 0; i < this.alerts.length; ++i) {
            if (this.alerts[i] == alert_index) {
                return true;
            }
        }
        return false;
    }

    // returns true if it got added, false if it was already present
    folder_prefs.addAlert = function (alert_index) {
        var already_there = false;
        for (var i = 0; i < this.alerts.length; ++i) {
            if (this.alerts[i] == alert_index) {
                already_there = true;
            }
        }
        if (!already_there) {
            this.alerts.push(alert_index);
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

    folder_prefs.store = function () {
        if (this.alert_for_children) {
            MailboxAlert.prefService.setBoolPref("extensions.mailboxalert.folders." + this.uri + ".alert_for_children", true);
        } else {
            // remove if exists
            MailboxAlert.prefService.deleteBranch("extensions.mailboxalert.folders." + this.uri + ".alert_for_children");
        }
        if (this.no_alert_to_parent) {
            MailboxAlert.prefService.setBoolPref("extensions.mailboxalert.folders." + this.uri + ".no_alert_to_parent", true);
        } else {
            // remove if exists
            MailboxAlert.prefService.deleteBranch("extensions.mailboxalert.folders." + this.uri + ".no_alert_to_parent");
        }
        if (this.alerts.length != 0) {
            MailboxAlert.prefService.setCharPref("extensions.mailboxalert.folders." + this.uri + ".alerts", this.alerts.join(","));
        } else {
            // remove if exists
            MailboxAlert.prefService.deleteBranch("extensions.mailboxalert.folders." + this.uri + ".alerts");
        }
    }

    folder_prefs.hasAlerts = function () {
        return (this.alerts.length > 0);
    }

    return folder_prefs;
}

// Returns an array with all the alert prefs in the configuration
// Needed when presenting the list window, and when converting
// from 0.14 to 0.15
MailboxAlert.getAllAlertPrefs = function () {
    alert_list = []
    for (i = 1; i <= MailboxAlert.max_alerts; i++) {
        try {
            var alert_prefs = MailboxAlert.getAlertPreferences(i);
            alert_list.push(alert_prefs);
        } catch (e) {
            // no alert with this id, skip
        }
    }
    return alert_list;
}

// adds the uri's for this folder and for all child folders to ar
MailboxAlert.getChildFolders = function (folder, ar) {
    ar.push(folder.URI);
    var sub_folders = folder.subFolders;
    while (sub_folders && sub_folders.hasMoreElements()) {
        var next_folder = sub_folders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
        if (next_folder) {
            MailboxAlert.getChildFolders(next_folder, ar);
        }
    }
}

MailboxAlert.getAllFolderURIs = function () {
    var accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"]
                         .getService(Components.interfaces.nsIMsgAccountManager);
    var all_servers = accountManager.allServers;
    var all_folder_uris = [];

    for (var i = 0; i < all_servers.Count(); ++i) {
        var server = all_servers.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer);
        var root_folder = server.rootFolder;
        if (root_folder) {
            MailboxAlert.getChildFolders(root_folder, all_folder_uris);
        }
    }
    
    return all_folder_uris;
}

// Returns an array with all the folder_prefs objects that have
// the given alert_id set
MailboxAlert.getAllFoldersForAlertIndex = function (alert_index) {
    var folder_list = [];
    var all_folders = MailboxAlert.getAllFolderURIs();

    for (var i = 0; i < all_folders.length; ++i) {
        var folder_uri = all_folders[i];
        var folder_prefs = MailboxAlert.getFolderPrefs(folder_uri);
        if (folder_prefs.alertSelected(alert_index)) {
            folder_list.push(folder_prefs);
        }
    }

    return folder_list;
}

MailboxAlert.convertFolderPreferences14toAlertPreferences = function(folder_uri) {
    var has_prefs = false;
    var alert_for_children = true;
    var no_alert_to_parent = true;
    try {
        if (MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.show_message." + folder_uri)) {
            has_prefs = true;
        }
    } catch (e) {
        // ok, n/m
    }
    try {
        if (MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.play_sound." + folder_uri)) {
            has_prefs = true;
        }
    } catch (e) {
        // ok, n/m
    }
    try {
        if (MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.execute_command." + folder_uri)) {
            has_prefs = true;
        }
    } catch (e) {
        // ok, n/m
    }
    try {
        if (MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.alert_for_children." + folder_uri)) {
            has_prefs = true;
            alert_for_children = true;
        }
    } catch (e) {
        // ok, n/m
    }
    try {
        if (MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.no_alert_to_parent." + folder_uri)) {
            has_prefs = true;
            no_alert_to_parent = true;
        }
    } catch (e) {
        // ok, n/m
    }

    // skip if there are no prefs for this folder in the first place
    if (has_prefs) {
        var folder_prefs14 = MailboxAlert.getFolderPreferences14(folder_uri);
        new_index = folder_prefs14.convertToAlertPrefs();

        var folder_prefs = MailboxAlert.getFolderPrefs(folder_uri);
        folder_prefs.addAlert(new_index);
        if (alert_for_children) {
            folder_prefs.alert_for_children = true;
        }
        if (no_alert_to_parent) {
            folder_prefs.no_alert_to_parent = true;
        }
        folder_prefs.store();

        // TODO: delete folder_prefs14
    }
}

// convert folder preferences to alert_preferences object
MailboxAlert.convertAllFolderPreferences14toAlertPreferences = function () {
    // loop over all known folders in all knows servers, and read
    // (and cache) the configs, if any. Then convert them to
    // AlertPrefs. Finally tie the index to the folder

    // also add a default if it does not exist yet
    var default_alert = MailboxAlert.getAlertPreferences(0);
    // TODO: int8l
    default_alert.set("name", "Default Alert");
    default_alert.set("show_message", true);
    default_alert.set("show_message_subject", "%sendername on %originalfolder");
    default_alert.set("show_message_message", "%subject");
    var all_alerts = MailboxAlert.getAllAlertPrefs();
    var exists = false;
    for (var i = 0; i < all_alerts.length; ++i) {
        var existing_alert = all_alerts[i];
        
        if (existing_alert.equals(default_alert)) {
            // ok just stop and return
            exists = true;
        }
    }
    if (!exists) {
        default_alert.createNewIndex();
        default_alert.store();
    }

    var all_folders = MailboxAlert.getAllFolderURIs();
    for (var i = 0; i < all_folders.length; ++i) {
        var folder_uri = all_folders[i];
        MailboxAlert.convertFolderPreferences14toAlertPreferences(folder_uri);
    }

    // TODO: set that we are now at version number 15 and delete rest
    // folder prefs and global prefs
    // recheck conversion first :)
    MailboxAlert.prefService.setIntPref("extensions.mailboxalert.prefsversion", 15);
    dump("[XX] conversion done, prefsversion updated");
}

MailboxAlert.findAvailableAlertPrefsId = function () {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).QueryInterface(Components.interfaces.nsIPrefService);
  var pref_branch = prefs.getBranch("extensions.mailboxalert.alerts.");
  for (i = 1; i <= MailboxAlert.max_alerts; i++) {
    try {
      var alert_name = pref_branch.getCharPref(i + ".name");
    } catch (e) {
      // ok, this one seems to be free
      return i;
    }
  }
  return 0;
}

// Some static functions called from xul
MailboxAlert.switchFolderAlert = function (folder_uri, alert_index) {
    var folder_prefs = MailboxAlert.getFolderPrefs(folder_uri);
    if (!folder_prefs.addAlert(alert_index)) {
        folder_prefs.removeAlert(alert_index);
    }
    folder_prefs.store();
}

MailboxAlert.switchAlertForChildren = function (folder_uri) {
    var folder_prefs = MailboxAlert.getFolderPrefs(folder_uri);
    folder_prefs.alert_for_children = !folder_prefs.alert_for_children;
    folder_prefs.store();
}

MailboxAlert.switchNoAlertToParent = function (folder_uri) {
    var folder_prefs = MailboxAlert.getFolderPrefs(folder_uri);
    folder_prefs.no_alert_to_parent = !folder_prefs.no_alert_to_parent;
    folder_prefs.store();
}
