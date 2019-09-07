// Copyright 2012, Jelte Jansen
// This code is licensed under a BSD license, see the
// LICENSE file in the main directory.

//
// This file contains various general variables and constants used
// in the show-alert code
//

if (typeof(MailboxAlertNewMail) == "undefined") {
    var MailboxAlertNewMail = {};
}

MailboxAlertNewMail.LEFT = 2;
MailboxAlertNewMail.TOP = 4;

MailboxAlertNewMail.gSlideDistance = 1;
MailboxAlertNewMail.gSlideTime = 15;
MailboxAlertNewMail.gFadeTime = 50;
MailboxAlertNewMail.gFadeIncrement = .05;
MailboxAlertNewMail.gOrigin = 0;

MailboxAlertNewMail.position = "top-right";
MailboxAlertNewMail.duration = 2;

MailboxAlertNewMail.window_x = 0;
MailboxAlertNewMail.window_y = 0;
MailboxAlertNewMail.window_to_y = 0;

MailboxAlertNewMail.effect = "none";

MailboxAlertNewMail.whenclicked = "close";
MailboxAlertNewMail.folder_url = "";
MailboxAlertNewMail.message_key;

MailboxAlertNewMail.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);

// timer states
MailboxAlertNewMail.SLIDING_IN_TOP = 0
MailboxAlertNewMail.SLIDING_IN_BOTTOM = 1
MailboxAlertNewMail.SLIDING_OUT_TOP = 2
MailboxAlertNewMail.SLIDING_OUT_BOTTOM = 3
MailboxAlertNewMail.WAITING = 4
MailboxAlertNewMail.FADING_IN = 5
MailboxAlertNewMail.FADING_OUT = 6
MailboxAlertNewMail.DONE = 7
