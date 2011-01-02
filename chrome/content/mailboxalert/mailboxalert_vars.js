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

