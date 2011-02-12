//
// Copyright 2010, Jelte Jansen
// BSD licensed, see LICENSE for details
//

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
MailboxAlert.folderPrefDefs = {
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

MailboxAlert.getFolderPreferences = function(folder_uri) {
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
                if (MailboxAlert.folderPrefDefs[name][0] == "bool") {
                    this.values[name] = MailboxAlert.prefService.getBoolPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                } else if (MailboxAlert.folderPrefDefs[name][0] == "string") {
                    this.values[name] = MailboxAlert.prefService.getCharPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                } else if (MailboxAlert.folderPrefDefs[name][0] == "integer") {
                    this.values[name] = MailboxAlert.prefService.getIntPref("extensions.mailboxalert." + name + "." + this.folder_uri);
                }
                dump("[XX] found value in prefs store\n");
            } catch(e) {
                dump("[XX] found no value in prefs store\n");
				
                // ok pref doesn't exist yet.
                // should we not set and just return?
                pref_data = MailboxAlert.folderPrefDefs[name]
                if (pref_data != null) {
					dump("[XX] default: " + MailboxAlert.folderPrefDefs[name][1]);
                   this.values[name] = MailboxAlert.folderPrefDefs[name][1];
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
        if (!(name in MailboxAlert.folderPrefDefs)) {
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
        for (var name in MailboxAlert.folderPrefDefs) {
            var a = this.get(name);
        }
    }
    
    folder_prefs.store = function() {
        dump("[XX] store prefs for " + this.folder_uri + "\n")
        for (var name in MailboxAlert.folderPrefDefs) {
            var type = MailboxAlert.folderPrefDefs[name][0];
            var pref_default = MailboxAlert.folderPrefDefs[name][1];
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
                if (MailboxAlert.folderPrefDefs[name][0] == "bool") {
                    MailboxAlert.prefService.setBoolPref("extensions.mailboxalert." + name + "." + this.folder_uri, this.values[name]);
                } else if (MailboxAlert.folderPrefDefs[name][0] == "string") {
                    MailboxAlert.prefService.setCharPref("extensions.mailboxalert." + name + "." + this.folder_uri, this.values[name]);
                } else if (MailboxAlert.folderPrefDefs[name][0] == "integer") {
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
        for (var name in MailboxAlert.folderPrefDefs) {
            var type = MailboxAlert.folderPrefDefs[name][0];
            dump(name + " (" + type + "): " + this.get(name) + "\n");
        }
    }

    
    return folder_prefs;
}
