/* ***** BEGIN LICENSE BLOCK *****
 * This file has been taken from the Thunderbird 2.0 source, and modified
 * by Jelte Jansen, original license below.
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Scott MacGregor <mscott@mozilla.org>
 *   Jens Bannmann <jens.b@web.de>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

MailboxAlertNewMail.showMethods = function (obj) {
    dump("[Object] Type: " + obj + "\n");
    for (var id in obj) {
        try {
            if (typeof(obj[id]) == "function") {
                dump("[Object] " + id + ": " + obj[id].toString() + "\n");
            }
        } catch (err) {
            result.push("[Object] " + id + ": inaccessible\n");
        }
    }
}

MailboxAlertNewMail.tokenizeString = function(string) {
    var result = new Array();
    var curtoken = "";
    var index = 0;
    
    for (var pos = 0; pos < string.length; pos++) {
        // in each case we have three options;
        // 1. The last thing we read was a newline
        // 2. We have not read anything in the current token
        // 3. We have read some characters
        if (string[pos] == "\r") {
            // skip \r
        } else if (string[pos] == "\n") {
            if (curtoken == "\n") {
                // skip double empty lines
            } else if (curtoken == "") {
                curtoken = "\n";
            } else {
                result[index] = curtoken;
                index++;
                curtoken = "\n";
            }
        } else if (string[pos] == " ") {
            if (curtoken == "" || curtoken == "\n") {
                // skip extra whitespace
            } else {
                result[index] = curtoken;
                index++;
                curtoken = "";
            }
        } else {
            curtoken += string[pos];
        }
    }
    if (curtoken != "") {
        result[index] = curtoken;
        index++;
    }

    return result;
}

// returns one string again, with '\n' added according to wrapsize
// and linemax
MailboxAlertNewMail.wrapTokens = function(tokens, wrap_size, line_max) {
    var result = "";
    var cur_line_length = 0;
    var line_count = 0;
    
    for (var i = 0; i < tokens.length && line_count < line_max; i++) {
        var cur_token = tokens[i];
        if (cur_token == "\n") {
            result += "\n";
            cur_line_length = 0;
            line_count++;
        } else {
            if (cur_line_length + cur_token.length + 1 < wrap_size) {
                result += cur_token + " ";
                cur_line_length += cur_token.length + 1;
            } else if (cur_token.length > wrap_size) {
                // hmz, cut it up by force
                while (cur_token.length > wrap_size && line_count < line_max) {
                    result += cur_token.substring(0, wrap_size);
                    cur_token = cur_token.substring(wrap_size, cur_token.length);
                    result += "\n";
                    line_count++;
                    cur_line_length = 0;
                }
                if (line_count < line_max) {
                    result += cur_token;
                    cur_line_length = cur_token.length;
                }
            } else {
                line_count++;
                if (line_count < line_max) {
                    result += "\n";
                    result += cur_token + " ";
                    cur_line_length = cur_token.length + 1;
                }
            }
        }
    }
    return result;
}

MailboxAlertNewMail.prefillAlertInfo = function ()
{
	var subject = window.arguments[0];
	var message = window.arguments[1];
	var show_icon = window.arguments[2];
	var image_url = window.arguments[3];
    MailboxAlertNewMail.folder = window.arguments[4];
    MailboxAlertNewMail.message_hdr = window.arguments[5];
	window.class = "MyClass";

	var label = document.getElementById('subject');
	label.value = subject;
    dump("[XX] Subject: " + subject + "\n");
    dump("[XX] Message: " + message + "\n");
    dump("[XX] end of message\n");

    // tokenize the full string on whitespace
    // newlines get their own token
    // then we walk through each token,
    // counting the number of chars
    // if we reach the limit, or if we encounter said 
    // whitespace, we add what we read so far
    // to an array of lines
    dump("[XX] full message text:\n")
    dump(message);
    dump("\n[XX] end of full message text\n");
    var tokens = MailboxAlertNewMail.tokenizeString(message);
    dump("[XX] Tokens: ");
    dump(tokens);
    dump("\n");
    var full_field = MailboxAlertNewMail.wrapTokens(tokens, 50, 10);
    
    // let's do some playing with the message field
    // we'll 'wrap' to 50 characters
    var label = document.getElementById('message_field');
    var text_node = label.childNodes[0];
    dump("[XX] original child: " + text_node + "\n");
    text_node.replaceWholeText(full_field);

    label.hidden = false;

    var container = document.getElementById('alertMessageField');
    container.hidden = false;

	var image = document.getElementById('alertImage');
	if (show_icon) {
		image.src = image_url;
	} else {
		image.hidden = true;
	}
}

MailboxAlertNewMail.onAlertLoad = function ()
{
  // read out our initial settings from prefs.
  try 
  {
    var prefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(null);
  } catch (ex) { }
  try 
  {
    MailboxAlertNewMail.position = prefBranch.getCharPref("extensions.mailboxalert.alert_position");
  } catch (ex) { }
  try 
  {
    MailboxAlertNewMail.duration = prefBranch.getIntPref("extensions.mailboxalert.alert_duration");
  } catch (ex) { }
  try 
  {
    MailboxAlertNewMail.effect = prefBranch.getCharPref("extensions.mailboxalert.alert_effect");
  } catch (ex) { }
  try 
  {
    MailboxAlertNewMail.onclick = prefBranch.getCharPref("extensions.mailboxalert.alert_onclick");
  } catch (ex) { }
  
  // bogus call to make sure the window is moved offscreen until we are ready for it.
  MailboxAlertNewMail.resizeAlert(true);

  // if we aren't waiting to fetch preview text, then go ahead and 
  // start showing the alert.
  if (MailboxAlertNewMail.effect == "fade") {
    this.showAlertFade();
    //setTimeout(MailboxAlertNewMail.showAlertFade, 0); // let the JS thread unwind, to give layout 
                              // a chance to recompute the styles and widths for our alert text.
  } else if (MailboxAlertNewMail.effect == "slide") {
    this.showAlertSlide();
    //setTimeout(MailboxAlertNewMail.showAlertSlide, 0);
  } else {
    MailboxAlertNewMail.resizeAlert(false);
    MailboxAlertNewMail.placeAlert();
    this.timer_state = MailboxAlertNewMail.WAITING;
    this.timer.initWithCallback(this, this.duration * 1000, this.timer.TYPE_ONE_SHOT);
  }
}

MailboxAlertNewMail.showAlertSlide = function ()
{
    var top = true;
    
    var alertContainer = document.getElementById('alertContainer');
    alertContainer.style.opacity = 0;
    MailboxAlertNewMail.resizeAlert(false);
    MailboxAlertNewMail.placeAlert();
    
    MailboxAlertNewMail.window_y = -MailboxAlertNewMail.getWindowHeight();
    
    if (MailboxAlertNewMail.position == "tr") {
    MailboxAlertNewMail.window_x = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - MailboxAlertNewMail.getWindowWidth());
    } else if (MailboxAlertNewMail.position == "br") {
    top = false;
    MailboxAlertNewMail.window_x = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - MailboxAlertNewMail.getWindowWidth());
    MailboxAlertNewMail.window_y = screen.height + MailboxAlertNewMail.getWindowHeight();
    MailboxAlertNewMail.window_to_y = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight - MailboxAlertNewMail.getWindowHeight());
    } else if (MailboxAlertNewMail.position == "bl") {
    top = false;
    MailboxAlertNewMail.window_y = screen.height + MailboxAlertNewMail.getWindowHeight();
    MailboxAlertNewMail.window_to_y = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight - MailboxAlertNewMail.getWindowHeight());
    } else if (MailboxAlertNewMail.position == "c") {
    MailboxAlertNewMail.window_x = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.LEFT ? screen.availLeft :
        ((screen.availLeft + screen.availWidth) / 2 - (MailboxAlertNewMail.getWindowWidth() / 2));
    MailboxAlertNewMail.window_y = -MailboxAlertNewMail.getWindowHeight();
    MailboxAlertNewMail.window_to_y = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.TOP ? screen.availTop :
        ((screen.availTop + screen.availHeight) / 2 - (MailboxAlertNewMail.getWindowHeight() / 2));
    }
    //window.sizeToContent();
    //window.resizeTo(MailboxAlertNewMail.getWindowWidth(), MailboxAlertNewMail.getWindowHeight());
    window.moveTo(MailboxAlertNewMail.window_x, MailboxAlertNewMail.window_y);
    MailboxAlertNewMail.resizeAlert(false);
    MailboxAlertNewMail.placeAlertOutside();
    alertContainer.style.opacity = 1;
    
    if (top) {
        this.timer_state = MailboxAlertNewMail.SLIDING_IN_TOP;
    } else {
        this.timer_state = MailboxAlertNewMail.SLIDING_IN_BOTTOM;
    }
    this.timer.initWithCallback(this, this.gSlideTime, this.timer.TYPE_REPEATING_PRECISE);
}

MailboxAlertNewMail.slideInTop = function ()
{
    // called by a repeated timer now, if we need to move we move,
    // if we are done we need to reset the timer
    if (window.screenY < MailboxAlertNewMail.window_to_y) {
        window.moveBy(0, MailboxAlertNewMail.gSlideDistance);
    } else {
        this.timer.cancel();
        this.timer_state = MailboxAlertNewMail.WAITING;
        MailboxAlertNewMail.window_to_y = -MailboxAlertNewMail.getWindowHeight();
        // we only need to wait the duration once (the handler should init the slideout
        // timer on a repeated basis again
        this.timer.initWithCallback(this, MailboxAlertNewMail.duration * 1000, this.timer.TYPE_ONE_SHOT);
    }
}

MailboxAlertNewMail.slideOutTop = function ()
{
    if (window.screenY > MailboxAlertNewMail.window_to_y) {
        window.moveBy(0, -MailboxAlertNewMail.gSlideDistance);
    } else {
        this.timer.cancel();
        this.timer_state = MailboxAlertNewMail.DONE;
        window.close();
    }
}

MailboxAlertNewMail.slideInBottom = function ()
{
    MailboxAlertNewMail.window_y = MailboxAlertNewMail.window_y - MailboxAlertNewMail.gSlideDistance;
    if (MailboxAlertNewMail.window_y > MailboxAlertNewMail.window_to_y) {
        window.moveTo(MailboxAlertNewMail.window_x, MailboxAlertNewMail.window_y);
    } else {
        this.timer.cancel();
        this.timer_state = MailboxAlertNewMail.WAITING;
        
        window.moveTo(MailboxAlertNewMail.window_x, MailboxAlertNewMail.window_to_y);
        MailboxAlertNewMail.window_y = MailboxAlertNewMail.window_to_y;
        MailboxAlertNewMail.window_to_y = screen.height + MailboxAlertNewMail.getWindowHeight();
        
        // we only need to wait the duration once (the handler should init the slideout
        // timer on a repeated basis again
        this.timer.initWithCallback(this, MailboxAlertNewMail.duration * 1000, this.timer.TYPE_ONE_SHOT);
    }
}

MailboxAlertNewMail.slideOutBottom = function ()
{
    MailboxAlertNewMail.window_y = MailboxAlertNewMail.window_y + MailboxAlertNewMail.gSlideDistance;
    if (MailboxAlertNewMail.window_y < MailboxAlertNewMail.window_to_y) {
        window.moveTo(MailboxAlertNewMail.window_x, MailboxAlertNewMail.window_y);
    } else {
        this.timer.cancel();
        this.timer_state = MailboxAlertNewMail.DONE;
        window.close();
    }
}

MailboxAlertNewMail.showAlertFade = function ()
{
	var alertContainer = document.getElementById('alertContainer');
	alertContainer.style.opacity = 0;
	MailboxAlertNewMail.resizeAlert(false);
    MailboxAlertNewMail.placeAlert();
    this.timer.initWithCallback(this, this.gFadeTime, this.timer.TYPE_REPEATING_PRECISE);
}

MailboxAlertNewMail.getWindowHeight = function ()
{
  return 10 + Math.max (document.getBoxObjectFor(document.getElementById('alertTextBox')).height
                  ,document.getBoxObjectFor(document.getElementById('alertImage')).height);
}

MailboxAlertNewMail.getWindowWidth = function ()
{
  return 30
         + document.getBoxObjectFor(document.getElementById('alertImage')).width
         + Math.max (document.getBoxObjectFor(document.getElementById('subject')).width,
                     document.getBoxObjectFor(document.getElementById('message_field')).width);
}

MailboxAlertNewMail.resizeAlert = function (aMoveOffScreen)
{
  resizeTo(MailboxAlertNewMail.getWindowWidth(), MailboxAlertNewMail.getWindowHeight());

  // leftover hack to get the window properly hidden when we first open it
  if (aMoveOffScreen) {
    window.outerHeight = 1;
  }
}

MailboxAlertNewMail.placeAlert = function () {
  var x = 0;
  var y = 0;

  if (MailboxAlertNewMail.position == "tr") {
    x = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - MailboxAlertNewMail.getWindowWidth());
  } else if (MailboxAlertNewMail.position == "br") {
    x = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - MailboxAlertNewMail.getWindowWidth());
    y = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight - MailboxAlertNewMail.getWindowHeight());
  } else if (MailboxAlertNewMail.position == "bl") {
    y = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight - MailboxAlertNewMail.getWindowHeight());
  } else if (MailboxAlertNewMail.position == "c") {
    x = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.LEFT ? screen.availLeft :
        ((screen.availLeft + screen.availWidth) / 2 - (MailboxAlertNewMail.getWindowWidth() / 2));
    y = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.TOP ? screen.availTop :
        ((screen.availTop + screen.availHeight) / 2 - (MailboxAlertNewMail.getWindowHeight() / 2));
  }
  window.moveTo(x, y);
}

MailboxAlertNewMail.placeAlertOutside = function () {
  var x = 0;
  var y = -MailboxAlertNewMail.getWindowHeight();

  if (MailboxAlertNewMail.position == "tr") {
    x = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - MailboxAlertNewMail.getWindowWidth());
  } else if (MailboxAlertNewMail.position == "br") {
    x = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - MailboxAlertNewMail.getWindowWidth());
    y = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight);
  } else if (MailboxAlertNewMail.position == "bl") {
    y = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight);
  } else if (MailboxAlertNewMail.position == "c") {
    x = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.LEFT ? screen.availLeft :
        ((screen.availLeft + screen.availWidth) / 2 - (MailboxAlertNewMail.getWindowWidth() / 2));
/*
    y = MailboxAlertNewMail.gOrigin & MailboxAlertNewMail.TOP ? screen.availTop :
        ((screen.availTop + screen.availHeight) / 2 - (MailboxAlertNewMail.getWindowHeight() / 2));
*/
  }
  window.moveTo(x, y);
}

MailboxAlertNewMail.fadeOpen = function ()
{
    var alertContainer = document.getElementById('alertContainer');
    var newOpacity = parseFloat(window.getComputedStyle(alertContainer, "").opacity) + MailboxAlertNewMail.gFadeIncrement;
    alertContainer.style.opacity = newOpacity;
    
    if (newOpacity >= 1.0) {
        // switch gears and start closing the alert
        this.timer.cancel();
        this.timer_state = MailboxAlertNewMail.WAITING;
        this.timer.initWithCallback(this, 1000 * this.duration, this.timer.TYPE_ONE_SHOT);
        //setTimeout(MailboxAlertNewMail.fadeClose, 1000 * MailboxAlertNewMail.duration);
    }
}

MailboxAlertNewMail.fadeClose = function ()
{
    var alertContainer = document.getElementById('alertContainer');
    var newOpacity = parseFloat(window.getComputedStyle(alertContainer, "").opacity) - MailboxAlertNewMail.gFadeIncrement;
    alertContainer.style.opacity = newOpacity;
    if (newOpacity <= 0) {
        this.timer.cancel();
        this.timer_state = MailboxAlertNewMail.DONE;
        window.close();
    }
}

MailboxAlertNewMail.closeAlert = function ()
{
    // make sure there won't be anything else firing
    this.timer.cancel();
    
    if (MailboxAlertNewMail.effect == "fade") {
        this.timer_state = MailboxAlertNewMail.FADING_OUT;
        this.timer.initWithCallback(this, this.gFadeTime, this.timer.TYPE_REPEATING_PRECISE);
        MailboxAlertNewMail.fadeClose();
    } else if (MailboxAlertNewMail.effect == "slide") {
        if (MailboxAlertNewMail.position == "tr" || MailboxAlertNewMail.position == "tl") {
            this.timer_state = MailboxAlertNewMail.SLIDING_OUT_TOP;
            this.timer.initWithCallback(this, this.gSlideTime, this.timer.TYPE_REPEATING_PRECISE);
        } else if (MailboxAlertNewMail.position == "br" || MailboxAlertNewMail.position == "bl") {
            this.timer_state = MailboxAlertNewMail.SLIDING_OUT_BOTTOM;
            this.timer.initWithCallback(this, this.gSlideTime, this.timer.TYPE_REPEATING_PRECISE);
        } else {
            window.close();
        }
    } else {
        window.close();
    }
}

MailboxAlertNewMail.handleClick = function ()
{
    dump("Alert window clicked\n");
    if (MailboxAlertNewMail.onclick == "close") {
        dump("Close alert window\n");
        // Do nothing, the window will be closed at the end of this
        // function.
    } else if (MailboxAlertNewMail.onclick == "selectmail") {
        dump("Select mail\n");
        const Cc = Components.classes;
        const Ci = Components.interfaces;
        var windowManager = Cc['@mozilla.org/appshell/window-mediator;1'].getService();
        var windowManagerInterface = windowManager.QueryInterface(Ci.nsIWindowMediator);
        //var windowManagerInterface = windowManager.QueryInterface(Ci.nsIWindowMediator);
        
        var mailWindow = windowManagerInterface.getMostRecentWindow( "mail:3pane" );
        if ( mailWindow ) {
            tabmail = mailWindow.document.getElementById("tabmail");
            tabmail.selectTabByMode('folder');
            if (MailboxAlertNewMail.message_hdr) {
                mailWindow.gFolderTreeView.selectFolder(MailboxAlertNewMail.folder);
                mailWindow.gDBView.selectMsgByKey(MailboxAlertNewMail.message_hdr.messageKey);
            }
            mailWindow.restore();
            mailWindow.focus();
        } else {
            dump("did not get mailWindow\n");
            window.open(uri, "_blank", "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");
        }
    } else if (MailboxAlertNewMail.onclick == "openmail") {
        // get the messenger window open service and ask it to open a new window for us
        var mailWindowService = Components.classes["@mozilla.org/messenger/windowservice;1"].getService(Components.interfaces.nsIMessengerWindowService);
        if (mailWindowService) {
            window.openDialog( "chrome://messenger/content/messageWindow.xul", "_blank", "all,chrome,dialog=no,status,toolbar", MailboxAlertNewMail.message_hdr, null );
        } else {
            dump("Could not get nsIMsgWindow service\n");
        }
    }
    this.closeAlert();
}

MailboxAlertNewMail.notify = function(timer) {
    // this function is called every time a fade or slide timer fires
    // we need to move the window or change the opacity until we're done
    // then we need to set a new timer to wait until the window needs to
    // close automatically, after which this function is called until
    // we have faded or slided out again.
    // note: every time we close the window, we should cancel the timer
    if (this.timer_state == this.SLIDING_IN_TOP) {
        this.slideInTop();
    } else if (this.timer_state == this.SLIDING_IN_BOTTOM) {
        this.slideInBottom();
    } else if (this.timer_state == this.SLIDING_OUT_TOP) {
        this.slideOutTop();
    } else if (this.timer_state == this.SLIDING_OUT_BOTTOM) {
        this.slideOutBottom();
    } else if (this.timer_state == this.FADING_IN) {
        this.fadeOpen();
    } else if (this.timer_state == this.FADING_OUT) {
        this.fadeClose();
    } else if (this.timer_state == this.WAITING) {
        this.closeAlert();
    }
}
