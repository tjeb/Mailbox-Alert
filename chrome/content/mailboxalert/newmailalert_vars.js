
if (typeof(MailboxAlertNewMail) == "undefined") {
    var MailboxAlertNewMail = {};
}

//MailboxAlertNewMail.HORIZONTAL = 1;
MailboxAlertNewMail.LEFT = 2;
MailboxAlertNewMail.TOP = 4;

MailboxAlertNewMail.gSlideDistance = 1;
MailboxAlertNewMail.gSlideTime = 5;
MailboxAlertNewMail.gFadeTime = 50;
//MailboxAlertNewMail.gNumNewMsgsToShowInAlert = 4; // the more messages we show in the alert, the larger it will be
//MailboxAlertNewMail.gOpenTime = 3000; // total time the alert should stay up once we are done animating.
//MailboxAlertNewMail.gAlertListener = null;
//MailboxAlertNewMail.gPendingPreviewFetchRequests = 0;
//MailboxAlertNewMail.gUserInitiated = false;
MailboxAlertNewMail.gFadeIncrement = .05;
MailboxAlertNewMail.gOrigin = 0;

MailboxAlertNewMail.position = "tr";
MailboxAlertNewMail.duration = 2;

MailboxAlertNewMail.window_x = 0;
MailboxAlertNewMail.window_y = 0;
MailboxAlertNewMail.window_to_y = 0;

MailboxAlertNewMail.effect = "none";

MailboxAlertNewMail.onclick = "close";
MailboxAlertNewMail.folder_url = "";
MailboxAlertNewMail.message_key;
