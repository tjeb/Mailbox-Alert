var MailboxAlertList = {};

MailboxAlertList.showHelp = function () {
    var url = "http://tjeb.nl/Projects/Mailbox_Alert/Manual/index.html";
    var uri = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService).newURI(url, null, null);

    var protocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                              .getService(Components.interfaces.nsIExternalProtocolService);
    protocolSvc.loadURI(uri);
}

MailboxAlertList.enableButton = function (name, enabled) {
    var element = document.getElementById(name);
    if (element) {
        if (enabled) {
            element.removeAttribute("disabled");
        } else {
            element.setAttribute("disabled", true);
        }
    }
}

MailboxAlertList.addAlert = function (id, name) {
    window.openDialog('chrome://mailboxalert/content/alert_settings.xhtml', '_blank', '', 0, this);
    MailboxAlertList.fillAlertList();
}

MailboxAlertList.editAlert = function() {
    var alert_listbox = document.getElementById("alert_listbox");
    window.openDialog('chrome://mailboxalert/content/alert_settings.xhtml', '_blank', 'dependent=no', alert_listbox.selectedItem.value, this);
    MailboxAlertList.fillAlertList();
}

MailboxAlertList.deleteAlert = function () {
    try {
        MailboxAlertUtil.logMessage("[MailboxAlert] start delete");
        var alert_listbox = document.getElementById("alert_listbox");
        var alert_index = alert_listbox.selectedItem.value;

        var alert_prefs = MailboxAlert.getAlertPreferences(alert_index);
        var folders = MailboxAlert.getAllFoldersForAlertIndex(alert_index);
        var delete_ok = true;

        MailboxAlertUtil.logMessage("[MailboxAlert] start delete 2");
        if (folders.length > 0) {
            var stringsBundle = document.getElementById("mailboxalert-string-bundle");
            if (confirm(stringsBundle.getString("mailboxalert.alert_settings.alertset"))) {
                for (var i = 0; i < folders.length; ++i) {
                    folders[i].removeAlert(alert_index);
                    folders[i].store();
                }
            } else {
                delete_ok = false;
            }
        }

        MailboxAlertUtil.logMessage("[MailboxAlert] start delete 3");
        if (delete_ok && MailboxAlert.alertIsFilterTarget(alert_index)) {
            var stringsBundle = document.getElementById("mailboxalert-string-bundle");
            if (confirm(stringsBundle.getString("mailboxalert.alert_settings.alertsetforfilter"))) {
                MailboxAlert.removeAlertFilters(alert_index);
            } else {
                delete_ok = false;
            }
        }

        MailboxAlertUtil.logMessage("[MailboxAlert] start delete 4");
        if (delete_ok) {
        MailboxAlertUtil.logMessage("[MailboxAlert] start delete 5");
            alert_prefs.remove();
        }
        MailboxAlertUtil.logMessage("[MailboxAlert] start delete 6");

        MailboxAlertList.enableButton('edit_button', false);
        MailboxAlertList.enableButton('delete_button', false);
        MailboxAlertList.fillAlertList();
    } catch (e) {
        MailboxAlertUtil.logMessage("[MailboxAlert] error at " + e.fileName + ":" + e.lineNumber + ": " + e);
        throw e
    }
}

MailboxAlertList.alertListCount = function () {
  var alert_listbox = document.getElementById("alert_listbox");
  var i = 0;
  try {
    while (alert_listbox.getItemAtIndex(i)) {
      i++;
    }
  } catch (e) {
    // no biggie, list empty
  }
  return i;
}

MailboxAlertList.clearAlertList = function () {
  var alert_listbox = document.getElementById("alert_listbox");
  var child = alert_listbox.getItemAtIndex(0)
  while (child) {
    alert_listbox.removeChild(child);
    child = alert_listbox.getItemAtIndex(0)
  }
}

MailboxAlertList.fillAlertList = function () {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  var alert_listbox = document.getElementById("alert_listbox");
  MailboxAlertList.clearAlertList();
  var alert_list = MailboxAlert.getAllAlertPrefs();
  for (var i = 0; i < alert_list.length; ++i) {
    var alert = alert_list[i];
    alert_listbox.appendItem(alert.get("name"), alert.index);
  }
  try {
    var first = alert_listbox.getItemAtIndex(0);
    first.current = true;
    MailboxAlertList.enableButton('edit_button', true);
    MailboxAlertList.enableButton('delete_button', true);
  } catch (e) {
    // empty list, ignore exception
  }
  MailboxAlertList.enableButton("add_button", MailboxAlertList.alertListCount() < MailboxAlert.max_alerts);
}

MailboxAlertList.init = function () {
  MailboxAlertList.fillAlertList();
  MailboxAlertList.enableButton("edit_button", false);
  MailboxAlertList.enableButton("delete_button", false);

  document.addEventListener("dialoghelp", function(event) {
    MailboxAlertList.showHelp();
  });
}

