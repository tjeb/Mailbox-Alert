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

MailboxAlert.getDefaultPrefValue = function (prefname) {
    if (prefname) {
      switch (prefname) {
        case "alert_for_children":
          return false;
          break;
        case "command":
          return "";
          break;
        case "escape":
          return false;
          break;
        case "execute_command":
          return false;
          break;
        case "command":
          return "";
          break;
        case "icon_file":
          return "chrome://mailboxalert/skin/mailboxalert.png";
          break;
        case "message":
          return "";
          break;
        case "no_alert_to_parent":
          return false;
          break;
        case "play_sound":
          return false;
          break;
        case "show_message":
          return false;
          break;
        case "show_message_icon":
          return true;
          break;
        case "sound_wav":
          return true;
          break;
        case "sound_wav_file":
          return "";
          break;
        case "subject":
          return "";
          break;
/*
        case "":
          return ;
          break;
*/
        default:
          alert("unknown default pref: " + prefname);
          break;
      }
    }
}


MailboxAlert.isDefaultPrefValue = function (pref, value) {
    return value == this.getDefaultPrefValue(pref);
}

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

MailboxAlert.getGlobalPreferences = function() {
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
MailboxAlert.alertPrefDefs = {
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
"name": [ "string", "" ]
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

    // in normal usage we only want to get and cache what we need
    // but in some cases (for instance the prefs screen), we might
    // want to get everything at once
    // (acutally, initing the prefs screen should have this effect)
    // removeme TODO
    folder_prefs.cacheAll = function() {
        for (var name in MailboxAlert.folderPrefDefs14) {
            var a = this.get(name);
        }
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
                new_alert.set(name, this.get(name));
            }
        }

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
        /*if (!this.index || this.index == 0) {
            alert("[XX] TODO: error message, attempting to alert_prefs.get() with index 0");
            return;
        }*/
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

    // in normal usage we only want to get and cache what we need
    // but in some cases (for instance the prefs screen), we might
    // want to get everything at once
    // (acutally, initing the prefs screen should have this effect)
    // removeme TODO
    alert_prefs.cacheAll = function() {
        for (var name in MailboxAlert.alertPrefDefs) {
            var a = this.get(name);
        }
    }
    
    alert_prefs.store = function() {
        if (!this.index || this.index == 0) {
            alert("[XX] TODO: error. Attempting to store alert_prefs with index 0");
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

    alert_prefs.dump = function() {
        dump("[XX] All folder prefs for " + this.folder_uri + "\n")
        for (var name in MailboxAlert.alertPrefDefs) {
            var type = MailboxAlert.alertPrefDefs[name][0];
            dump(name + " (" + type + "): " + this.get(name) + "\n");
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
            alert("[XX] TODO: error message. attempting to create new index for alert that already has one (" + this.index + ")");
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

    if (index != 0 && alert_prefs.get("name") == "") {
        throw "Alert with index " + index + " not found";
    }
    return alert_prefs;
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

// TODO: alert_for_parent...
MailboxAlert.convertFolderPreferences14toAlertPreferences = function(folder) {
    if (folder) {
        // first do this folder, then check if there are subfolders and repeat
        var has_prefs = false;
        try {
            if (MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.show_message." + folder.URI)) {
                has_prefs = true;
            }
        } catch (e) {
            // ok, n/m
        }
        try {
            if (MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.play_sound." + folder.URI)) {
                has_prefs = true;
            }
        } catch (e) {
            // ok, n/m
        }
        try {
            if (MailboxAlert.prefService.getBoolPref("extensions.mailboxalert.execute_command." + folder.URI)) {
                has_prefs = true;
            }
        } catch (e) {
            // ok, n/m
        }
        // skip if there are no prefs for this folder in the first place
        if (has_prefs) {
            folder_prefs14 = MailboxAlert.getFolderPreferences14(folder.URI);
            new_index = folder_prefs14.convertToAlertPrefs();
            //alert("[XX] folder " + folder.URI + " becomes alert index " + new_index);
            // TODO: tie folder to index
        } else {
            dump("[XX] no alert for " + folder.URI + "\n");
        }

        // now check the rest
        var sub_folders = folder.subFolders;
        while (sub_folders && sub_folders.hasMoreElements()) {
            var next_folder = sub_folders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
            if (next_folder) {
                MailboxAlert.convertFolderPreferences14toAlertPreferences(next_folder);
            }
        }
    }
}

// convert folder preferences to alert_preferences object
MailboxAlert.convertAllFolderPreferences14toAlertPreferences = function () {
    // TODO
    // loop over all known folders in all knows servers, and read
    // (and cache) the configs, if any. Then convert them to
    // AlertPrefs. Finally tie the index to the folder

    // also add a default if it does not exist yet
    var default_alert = MailboxAlert.getAlertPreferences(0);
    // TODO: int8l
    default_alert.set("name", "Default Alert");
    default_alert.set("show_message", true);
    default_alert.set("subject", "%sendername on %originalfolder");
    default_alert.set("message", "%subject");
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
    
    var all_servers = accountManager.allServers;
    for (var i = 0; i < all_servers.Count(); ++i) {
        var server = all_servers.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer);
        var root_folder = server.rootFolder;
        if (root_folder) {
            MailboxAlert.convertFolderPreferences14toAlertPreferences(root_folder);
        }
    }

    // debug TODO remove
    var all_new_alerts = MailboxAlert.getAllAlertPrefs();
    dump("[XX] ALL ALERTS CONVERTED:\n")
    for (var i = 0; i < all_new_alerts.length; ++i) {
        all_new_alerts[i].dump();
    }
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
