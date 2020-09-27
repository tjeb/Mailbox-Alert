var MailboxAlertAlertSettings = {};

MailboxAlertAlertSettings.init = function () {
  MailboxAlertAlertSettings.resize();
  /* enable help button */

  var stringsBundle = document.getElementById("mailboxalert-string-bundle");

  /* Issue when opening multiple of these windows */
  if (!window.arguments) {
    alert("no arguments");
    window.close();
    return;
  }

  MailboxAlertAlertSettings.readPrefs(MailboxAlertAlertSettings.getAlertId());
  MailboxAlertAlertSettings.checkUIAll();
  MailboxAlertAlertSettings.resize();

  document.addEventListener("dialogaccept", function(event) {
    MailboxAlertAlertSettings.storePrefs(MailboxAlertAlertSettings.getAlertId());
  });
  document.addEventListener("dialoghelp", function(event) {
    MailboxAlertAlertSettings.showHelp();
  });
  document.addEventListener("dialogextra1", function(event) {
    MailboxAlertAlertSettings.testAlert();
  });
}

MailboxAlertAlertSettings.getAlertId = function() {
  if (!window.arguments) {
    alert("Error: caller did not specify alert id");
  }
  return window.arguments[0];
}

MailboxAlertAlertSettings.getParent = function() {
  return window.arguments[1];
}

MailboxAlertAlertSettings.showHelp = function () {
    var url = "http://tjeb.nl/Projects/Mailbox_Alert/Manual/index.html";
    var uri = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService).newURI(url, null, null);

    var protocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                              .getService(Components.interfaces.nsIExternalProtocolService);
    protocolSvc.loadURI(uri);
}

MailboxAlertAlertSettings.testAlert = function () {
  try {
    var alert_id = MailboxAlertAlertSettings.getAlertId();
    var alert_prefs = MailboxAlertAlertSettings.getPrefsFromWindow(alert_id);
    var alert_data = MailboxAlert.createAlertData(false, false);
    alert_prefs.run(alert_data);
  } catch (e) {
    alert("[MailboxAlert] error at " + e.fileName + ":" + e.lineNumber + ": " + e);
  }
}

/* if enabled is true, get all elements with the
   id in list, and remove the disabled attribute,
  otherwise, set that attribute */
MailboxAlertAlertSettings.setUIElementList = function (list, enabled) {
  if (!list || !list.length) {
    return;
  }
  for (var i = 0; i < list.length; i++) {
    current_element = document.getElementById(list[i]);
    if (current_element) {
      if (enabled) {
        current_element.removeAttribute("disabled");
      } else {
        current_element.setAttribute("disabled", true);
      }
    } else {
      alert("removeme, element not found:" + list[i]);
    }
  }
}

MailboxAlertAlertSettings.doClick = function (element_name) {
  current_element = document.getElementById(element_name);
  if (current_element) {
    current_element.click();
  }
}

MailboxAlertAlertSettings.setUIShowMessage = function (show_message) {
  MailboxAlertAlertSettings.setUIElementList([
    "show_message_tab",
    "show_message_subject_html:input",
    "show_message_content_html:input",
    "show_message_icon_checkbox",
    "show_message_duration_label",
    "show_message_duration_html:input",
    "show_message_duration_time_unit_label",
    "show_message_position_label",
    "show_message_position_menulist",
    "show_message_effect_label",
    "show_message_effect_menulist",
    "show_message_onclick_label",
    "show_message_onclick_menulist"
  ], show_message);
}

// returns true if doclick was called
// if arg is true, perform the click
MailboxAlertAlertSettings.checkUIShowMessage = function (do_click) {
  var show_message_checkbox = document.getElementById("show_message_checkbox");
  var show_message = show_message_checkbox.checked;
  MailboxAlertAlertSettings.setUIShowMessage(show_message);
  var result = false;
  if (do_click && show_message) {
    MailboxAlertAlertSettings.doClick("show_message_tab");
    result = true;
  }
  MailboxAlertAlertSettings.checkUIShowMessageIcon();
  MailboxAlertAlertSettings.checkUIShowMessageCustomPosition();
  return !do_click || result;
}

MailboxAlertAlertSettings.setUIShowMessageIcon = function (show_message_icon) {
  MailboxAlertAlertSettings.setUIElementList([
    "show_message_icon_image",
    "show_message_icon_browse_button",
    "show_message_icon_default_button"
  ], show_message_icon);
}

MailboxAlertAlertSettings.checkUIShowMessageIcon = function () {
  var show_message_checkbox = document.getElementById("show_message_checkbox");
  var show_message_icon_checkbox = document.getElementById("show_message_icon_checkbox");
  var show_message_icon = show_message_icon_checkbox.checked && show_message_checkbox.checked;
  MailboxAlertAlertSettings.setUIShowMessageIcon(show_message_icon);
}

MailboxAlertAlertSettings.setUIPlaySound = function (play_sound) {
  MailboxAlertAlertSettings.setUIElementList([
    "play_sound_tab",
    "play_sound_radio",
    "play_sound_radio_default",
    "play_sound_radio_file",
    "play_sound_file_html:input",
    "play_sound_browse_button"
  ], play_sound);
}

MailboxAlertAlertSettings.checkUIPlaySound = function (do_click) {
  var play_sound_checkbox = document.getElementById("play_sound_checkbox");
  var play_sound = play_sound_checkbox.checked;
  MailboxAlertAlertSettings.setUIPlaySound(play_sound);
  if (do_click && play_sound) {
    MailboxAlertAlertSettings.doClick("play_sound_tab");
    return true;
  }
  return !do_click;
}

MailboxAlertAlertSettings.setUIExecuteCommand = function (execute_command) {
  MailboxAlertAlertSettings.setUIElementList([
    "execute_command_tab",
    "execute_command_html:input",
    "execute_command_browse_button",
    "execute_command_escape_html_checkbox",
    "execute_command_escape_windows_quotes_checkbox"
  ], execute_command);
}

MailboxAlertAlertSettings.checkUIExecuteCommand = function(do_click) {
  var execute_command_checkbox = document.getElementById("execute_command_checkbox");
  var execute_command = execute_command_checkbox.checked;
  MailboxAlertAlertSettings.setUIExecuteCommand(execute_command);
  if (do_click && execute_command) {
    MailboxAlertAlertSettings.doClick("execute_command_tab");
    return true;
  }
  return !do_click;
}

MailboxAlertAlertSettings.setUIShowMessageCustomPosition = function (show_message_custom_position) {
  MailboxAlertAlertSettings.setUIElementList([
    "show_message_custom_position_options",
    "show_message_custom_position_x_val_label",
    "show_message_custom_position_x_label",
    "show_message_custom_position_y_val_label",
    "show_message_custom_position_y_label",
    "show_message_custom_position_anchor_label",
    "show_message_custom_position_choose"
  ], show_message_custom_position);
}

MailboxAlertAlertSettings.checkUIShowMessageCustomPosition = function() {
  var show_message_menu = document.getElementById("show_message_position_menulist");
  var show_message_custom_position = false;
  if (show_message_menu.value == "custom") {
    document.getElementById('show_message_custom_position_options').hidden = false;
    show_message_custom_position = true;
  } else {
    document.getElementById('show_message_custom_position_options').hidden = true;
  }
  MailboxAlertAlertSettings.setUIShowMessageCustomPosition(show_message_custom_position);
}

MailboxAlertAlertSettings.setUIOkButton = function (enabled) {
  var dialog = document.getElementById('mailboxalert_alert_prefs_dialog');
  var button = dialog.getButton('accept');
  button.disabled = !enabled;
}

MailboxAlertAlertSettings.checkUIOkButton = function () {
  var name = document.getElementById("alert_name_html:input");
  MailboxAlertAlertSettings.setUIOkButton(name.value && name.value != "");
}

MailboxAlertAlertSettings.checkUIAll = function () {
  clicked = MailboxAlertAlertSettings.checkUIShowMessage(true);
  clicked = MailboxAlertAlertSettings.checkUIPlaySound(!clicked);
  clicked = MailboxAlertAlertSettings.checkUIExecuteCommand(!clicked);
  MailboxAlertAlertSettings.checkUIOkButton();
}

MailboxAlertAlertSettings.setUIPrefCheckbox = function (alert_prefs, name, element_name) {
  var element = document.getElementById(element_name);
  if (element) {
    element.checked = alert_prefs.get(name);
  } else {
    alert("Code error: element " + element_name + " not found");
  }
}

MailboxAlertAlertSettings.setUIPrefTextbox = function (alert_prefs, name, element_name) {
  var element = document.getElementById(element_name);
  if (element) {
    element.value = alert_prefs.get(name);
  } else {
    alert("Code error: element " + element_name + " not found");
  }
}

MailboxAlertAlertSettings.setUIPrefInt = function (alert_prefs, name, element_name) {
  var element = document.getElementById(element_name);
  if (element) {
    element.value = alert_prefs.get(name);
  } else {
    alert("Code error: element " + element_name + " not found");
  }
}

MailboxAlertAlertSettings.setUIPrefAttribute = function (alert_prefs, name, element_name, attribute) {
  var element = document.getElementById(element_name);
  if (element) {
    element.setAttribute(attribute, alert_prefs.get(name));
  } else {
    alert("Code error: element " + element_name + " not found");
  }
}

MailboxAlertAlertSettings.readPrefs = function (alert_id) {
  try {
    alert_prefs = MailboxAlert.getAlertPreferences(alert_id);

    MailboxAlertAlertSettings.setUIPrefTextbox(alert_prefs, "name", "alert_name_html:input");

    MailboxAlertAlertSettings.setUIPrefCheckbox(alert_prefs, "show_message", "show_message_checkbox");
    MailboxAlertAlertSettings.setUIPrefCheckbox(alert_prefs, "play_sound", "play_sound_checkbox");
    MailboxAlertAlertSettings.setUIPrefCheckbox(alert_prefs, "execute_command", "execute_command_checkbox");

    MailboxAlertAlertSettings.setUIPrefTextbox(alert_prefs, "show_message_subject", "show_message_subject_html:input");
    MailboxAlertAlertSettings.setUIPrefTextbox(alert_prefs, "show_message_message", "show_message_content_html:input");

    MailboxAlertAlertSettings.setUIPrefCheckbox(alert_prefs, "show_message_icon", "show_message_icon_checkbox");

    MailboxAlertAlertSettings.setUIPrefAttribute(alert_prefs, "show_message_icon_file", "show_message_icon_image", "src");
    MailboxAlertAlertSettings.setUIPrefInt(alert_prefs, "show_message_duration", "show_message_duration_html:input");
    MailboxAlertAlertSettings.setUIPrefInt(alert_prefs, "show_message_duration", "show_message_duration_html:input");
    MailboxAlertAlertSettings.setUIPrefInt(alert_prefs, "show_message_custom_position_x", "show_message_custom_position_x_val_label");
    MailboxAlertAlertSettings.setUIPrefInt(alert_prefs, "show_message_custom_position_y", "show_message_custom_position_y_val_label");
    MailboxAlertAlertSettings.setUIPrefTextbox(alert_prefs, "show_message_custom_position_anchor", "show_message_custom_position_anchor_label");

    var show_message_position = alert_prefs.get("show_message_position");
    if (show_message_position == "top-left") {
      MailboxAlertAlertSettings.doClick("show_message_position_top-left");
    } else if (show_message_position == "top-right") {
      MailboxAlertAlertSettings.doClick("show_message_position_top-right");
    } else if (show_message_position == "bottom-left") {
      MailboxAlertAlertSettings.doClick("show_message_position_bottom-left");
    } else if (show_message_position == "bottom-right") {
      MailboxAlertAlertSettings.doClick("show_message_position_bottom-right");
    } else if (show_message_position == "center") {
      MailboxAlertAlertSettings.doClick("show_message_position_center");
    } else if (show_message_position == "custom") {
      MailboxAlertAlertSettings.doClick("show_message_position_custom");
    }

    var show_message_effect = alert_prefs.get("show_message_effect");
    cur_element = document.getElementById("show_message_effect_menulist");
    if (show_message_effect == "slide") {
      MailboxAlertAlertSettings.doClick("show_message_effect_slide");
    } else if (show_message_effect == "fade") {
      MailboxAlertAlertSettings.doClick("show_message_effect_fade");
    }

    var show_message_onclick = alert_prefs.get("show_message_onclick");
    cur_element = document.getElementById("show_message_onclick_menulist");
    if (show_message_onclick == "selectmail") {
      MailboxAlertAlertSettings.doClick("show_message_onclick_selectmail");
    } else if (show_message_onclick == "openmail") {
      MailboxAlertAlertSettings.doClick("show_message_onclick_openmail");
    } else if (show_message_onclick == "deletemail") {
      MailboxAlertAlertSettings.doClick("show_message_onclick_deletemail");
    }

    var sound_wav = alert_prefs.get("play_sound_wav");
    var element_default = document.getElementById("play_sound_radio_default");
    var element_file = document.getElementById("play_sound_radio_file");
    if (sound_wav) {
      element_file.setAttribute("selected", true);
      element_default.removeAttribute("selected");
    } else {
      element_default.setAttribute("selected", true);
      element_file.removeAttribute("selected");
    }

    MailboxAlertAlertSettings.setUIPrefTextbox(alert_prefs, "play_sound_wav_file", "play_sound_file_html:input");

    MailboxAlertAlertSettings.setUIPrefTextbox(alert_prefs, "command", "execute_command_html:input");
    MailboxAlertAlertSettings.setUIPrefCheckbox(alert_prefs, "command_escape", "execute_command_escape_html_checkbox", false);
    MailboxAlertAlertSettings.setUIPrefCheckbox(alert_prefs, "command_escape_windows_quotes", "execute_command_escape_windows_quotes_checkbox", false);

  } catch (e) {
    alert(e);
  }
}

MailboxAlertAlertSettings.storeUIPrefTextbox = function (alert_prefs, name, element_name) {
  var element = document.getElementById(element_name);
  if (element) {
    alert_prefs.set(name, element.value);
  } else {
    alert("Store error: element not found: " + element_name);
  }
}

MailboxAlertAlertSettings.storeUIPrefCheckbox = function (alert_prefs, name, element_name) {
  var element = document.getElementById(element_name);
  if (element) {
    alert_prefs.set(name, element.checked);
 } else {
    alert("Store error: element not found: " + element_name);
  }
}

MailboxAlertAlertSettings.storeUIPrefInt = function (alert_prefs, name, element_name) {
  var element = document.getElementById(element_name);
  if (element) {
    alert_prefs.set(name, element.value);
  } else {
    alert("Store error: element not found: " + element_name);
  }
}

MailboxAlertAlertSettings.storeUIPrefAttribute = function (alert_prefs, name, element_name, attribute) {
  var element = document.getElementById(element_name);
  if (element) {
    alert_prefs.set(name, element.getAttribute(attribute));
  } else {
    alert("Store error: element not found: " + element_name);
  }
}

MailboxAlertAlertSettings.getPrefsFromWindow = function (alert_id) {
  try {
    alert_prefs = MailboxAlert.getAlertPreferences(alert_id);
    MailboxAlertAlertSettings.storeUIPrefTextbox(alert_prefs, "name", "alert_name_html:input");

    MailboxAlertAlertSettings.storeUIPrefCheckbox(alert_prefs, "show_message", "show_message_checkbox");
    MailboxAlertAlertSettings.storeUIPrefCheckbox(alert_prefs, "play_sound", "play_sound_checkbox");
    MailboxAlertAlertSettings.storeUIPrefCheckbox(alert_prefs, "execute_command", "execute_command_checkbox");

    MailboxAlertAlertSettings.storeUIPrefTextbox(alert_prefs, "show_message_subject", "show_message_subject_html:input");
    MailboxAlertAlertSettings.storeUIPrefTextbox(alert_prefs, "show_message_message", "show_message_content_html:input");

    MailboxAlertAlertSettings.storeUIPrefCheckbox(alert_prefs, "show_message_icon", "show_message_icon_checkbox");

    MailboxAlertAlertSettings.storeUIPrefAttribute(alert_prefs, "show_message_icon_file", "show_message_icon_image", "src");
    MailboxAlertAlertSettings.storeUIPrefInt(alert_prefs, "show_message_duration", "show_message_duration_html:input");

    MailboxAlertAlertSettings.storeUIPrefTextbox(alert_prefs, "show_message_position", "show_message_position_menulist");
    MailboxAlertAlertSettings.storeUIPrefInt(alert_prefs, "show_message_custom_position_x", "show_message_custom_position_x_val_label");
    MailboxAlertAlertSettings.storeUIPrefInt(alert_prefs, "show_message_custom_position_y", "show_message_custom_position_y_val_label");
    MailboxAlertAlertSettings.storeUIPrefTextbox(alert_prefs, "show_message_custom_position_anchor", "show_message_custom_position_anchor_label");
    MailboxAlertAlertSettings.storeUIPrefTextbox(alert_prefs, "show_message_effect", "show_message_effect_menulist");
    MailboxAlertAlertSettings.storeUIPrefTextbox(alert_prefs, "show_message_onclick", "show_message_onclick_menulist");

    var element_file = document.getElementById("play_sound_radio_file");
    alert_prefs.set("play_sound_wav", element_file.selected);
    MailboxAlertAlertSettings.storeUIPrefTextbox(alert_prefs, "play_sound_wav_file", "play_sound_file_html:input");

    MailboxAlertAlertSettings.storeUIPrefTextbox(alert_prefs, "command", "execute_command_html:input");
    MailboxAlertAlertSettings.storeUIPrefCheckbox(alert_prefs, "command_escape", "execute_command_escape_html_checkbox");
    MailboxAlertAlertSettings.storeUIPrefCheckbox(alert_prefs, "command_escape_windows_quotes", "execute_command_escape_windows_quotes_checkbox");

    return alert_prefs;
  } catch (e) {
    alert("Error: " + e);
  }
}

MailboxAlertAlertSettings.storePrefs = function (alert_id) {
    try {
        var alert_prefs = MailboxAlertAlertSettings.getPrefsFromWindow(alert_id);
        if (alert_prefs.index == 0) {
            alert_prefs.createNewIndex();
        }
        alert_prefs.store();
        // if the parent is the alert list, update it
        var parent_window = this.getParent();
        if (parent_window) {
            parent_window.fillAlertList();
        }
    } catch (e) {
        alert("Error saving alert " + alert_id + ": " + e);
    }
}

MailboxAlertAlertSettings.resizeWindowCall = function () {
	window.sizeToContent();
}

MailboxAlertAlertSettings.resize = function () {
	setTimeout(MailboxAlertAlertSettings.resizeWindowCall, 50);
}

MailboxAlertAlertSettings.fp = MailboxAlertAlertSettings.filepicker = Components.classes["@mozilla.org/filepicker;1"].getService(Components.interfaces.nsIFilePicker);

MailboxAlertAlertSettings.filePickerShow = function(fp) {
  let done = false;
  let rv, result;
  fp.open(result => {
    rv = result;
    done = true;
  });
  let thread = Components.classes["@mozilla.org/thread-manager;1"]
                         .getService().currentThread;
  while (!done) {
    thread.processNextEvent(true);
  }
  return rv;
}

MailboxAlertAlertSettings.chooseIconFile = function () {
    var icon_image_element = document.getElementById("show_message_icon_image");
    try {
        var pref_icon = icon_image_element.src;
        var prefix = "file://";
        if (pref_icon.substring(0, prefix.length) == prefix) {
            pref_icon = pref_icon.substring(prefix.length);
        }
        var FileUtils = Components.utils.import("resource://gre/modules/FileUtils.jsm").FileUtils
        var file = new FileUtils.File( pref_icon )
        if (file.exists()) {
            MailboxAlertAlertSettings.fp.displayDirectory = file.parent;
        }

    } catch (e) {
        // Specified directory does not seem to exist, use default
    }

    // use whatever nsIFilePicker options are suitable
    MailboxAlertAlertSettings.fp.init(window, "File to Read", MailboxAlertAlertSettings.fp.modeOpen);
    MailboxAlertAlertSettings.fp.appendFilter("all files", "*");

    if ( MailboxAlertAlertSettings.filePickerShow(MailboxAlertAlertSettings.fp) != MailboxAlertAlertSettings.fp.returnCancel ) {
        /*result = fp.file.persistentDescriptor;*/
        result = MailboxAlertAlertSettings.fp.file.path;
        result = "file://" + result;
        icon_image_element.src = result;
        MailboxAlertAlertSettings.resize();
    }
}

MailboxAlertAlertSettings.setDefaultIconFile = function () {
    var icon_image_element = document.getElementById("show_message_icon_image");
    if (icon_image_element.src != "resource://mailboxalert-skin/mailboxalert.png") {
        icon_image_element.src = "resource://mailboxalert-skin/mailboxalert.png";
        //alert("changed");
        MailboxAlertAlertSettings.resize();
    }
}

MailboxAlertAlertSettings.chooseWavFile = function () {
  var wav_file_element = document.getElementById("play_sound_file_html:input");
  try {
    var wav_file = wav_file_element.value;
    var FileUtils = Components.utils.import("resource://gre/modules/FileUtils.jsm").FileUtils
    var exec = new FileUtils.File( wav_file )
    if (exec.exists()) {
      MailboxAlertAlertSettings.fp.displayDirectory = exec.parent;
    }
  } catch (e) {
    // Specified directory does not seem to exist, use default
    // but only if it not empty
    if (wav_file && wav_file !== "") {
        alert("Error, unable to find selected audio file. Using default.");
    }
  }

  // use whatever nsIFilePicker options are suitable
  MailboxAlertAlertSettings.fp.init(window, "File to Read", MailboxAlertAlertSettings.fp.modeOpen);
  MailboxAlertAlertSettings.fp.appendFilter("all files", "*");

  if ( MailboxAlertAlertSettings.filePickerShow(MailboxAlertAlertSettings.fp) != MailboxAlertAlertSettings.fp.returnCancel ) {
    result = MailboxAlertAlertSettings.fp.file.path;
    wav_file_element.value = result;
  }
}

MailboxAlertAlertSettings.chooseExecFile = function () {
  var exec_file_element = document.getElementById("execute_command_html:input");
  try {
    var exec_file = exec_file_element.value;
    var index = exec_file.indexOf(" ");
    if (index > 0) {
        exec_file = exec_file.substring(0, index);
    }
    var FileUtils = Components.utils.import("resource://gre/modules/FileUtils.jsm").FileUtils
    var exec = new FileUtils.File( exec_file )
    if (exec.exists()) {
      MailboxAlertAlertSettings.fp.displayDirectory = exec.parent;
    }
  } catch (e) {
    // Specified directory does not seem to exist, use default
  }

  // use whatever nsIFilePicker options are suitable
  MailboxAlertAlertSettings.fp.init(window, "File to Read", MailboxAlertAlertSettings.fp.modeOpen);
  MailboxAlertAlertSettings.fp.appendFilter("all files", "*");

  if ( MailboxAlertAlertSettings.filePickerShow(MailboxAlertAlertSettings.fp) != MailboxAlertAlertSettings.fp.returnCancel ) {
    result = MailboxAlertAlertSettings.fp.file.path;
    exec_file_element.value = result;
  }
  // TODO, this can be refactored
}

MailboxAlertAlertSettings.selectPosition = function () {
  var dialog_positions = {};
  var x_pos_label = document.getElementById("show_message_custom_position_x_val_label");
  var y_pos_label = document.getElementById("show_message_custom_position_y_val_label");
  var anchor_label = document.getElementById("show_message_custom_position_anchor_label");
  dialog_positions.x = x_pos_label.value;
  dialog_positions.y = y_pos_label.value;
  dialog_positions.anchor = anchor_label.value;
  dialog_positions.changed = false;
  window.openDialog('chrome://mailboxalert/content/alert_settings_position.xhtml', "_blank", "chrome,titlebar=yes,modal=yes", dialog_positions);
  if (dialog_positions.changed) {
    x_pos_label.value = dialog_positions.x;
    y_pos_label.value = dialog_positions.y;
    anchor_label.value = dialog_positions.anchor;
  }
}
