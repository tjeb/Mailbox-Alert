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
 * Mailbox Alert code written by Jelte Jansen <Tjebbe@kanariepiet.com>
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
 *
 * ***** END LICENSE BLOCK ***** */

MailboxAlertNewMail.showMethods = function (obj) {
    MailboxAlertUtil.logMessage(1, "[Object] Type: " + obj + "\n");
    for (var id in obj) {
        try {
            if (typeof(obj[id]) == "function") {
                MailboxAlertUtil.logMessage(1, "[Object] " + id + ": " + obj[id].toString() + "\n");
            }
        } catch (err) {
            result.push("[Object] " + id + ": inaccessible\n");
        }
    }
}

MailboxAlertNewMail.tokenizeString = function(string) {
    MailboxAlertUtil.logStart("MailboxAlertNewMail.tokenizeString");
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

    MailboxAlertUtil.logEnd("MailboxAlertNewMail.tokenizeString");
    return result;
}

// returns one string again, with '\n' added according to wrapsize
// and linemax
MailboxAlertNewMail.wrapTokens = function(tokens, wrap_size, line_max) {
    MailboxAlertUtil.logStart("MailboxAlertNewMail.wrapTokens");
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
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.wrapTokens");
    return result;
}

MailboxAlertNewMail.prefillAlertInfo = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.prefillAlertInfo");
    var subject = window.arguments[0];
    var message = window.arguments[1];
    var show_icon = window.arguments[2];
    var image_url = window.arguments[3];
    this.folder = window.arguments[4];
    this.message_hdr = window.arguments[5];
    this.position = window.arguments[6];
    this.duration = window.arguments[7];
    this.effect = window.arguments[8];
    this.whenclicked = window.arguments[9];
    this.custom_position_x = window.arguments[10];
    this.custom_position_y = window.arguments[11];
    this.custom_position_anchor = window.arguments[12];
    //window.class = "MyClass";

    var label = document.getElementById('subject');
    label.value = subject;

    // tokenize the full string on whitespace
    // newlines get their own token
    // then we walk through each token,
    // counting the number of chars
    // if we reach the limit, or if we encounter said
    // whitespace, we add what we read so far
    // to an array of lines
    var tokens = this.tokenizeString(message);
    var full_field = this.wrapTokens(tokens, 50, 10);

    // let's do some playing with the message field
    // we'll 'wrap' to 50 characters
    var label = document.getElementById('message_field');
    var text_node = label.childNodes[0];
    text_node.data = full_field;

    label.hidden = false;

    var container = document.getElementById('alertMessageField');
    container.hidden = false;

	var image = document.getElementById('alertImage');
	if (show_icon) {
		image.src = image_url;
	} else {
		image.hidden = true;
	}
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.prefillAlertInfo");
}

MailboxAlertNewMail.onAlertLoad = function ()
{
  MailboxAlertUtil.logStart("MailboxAlertNewMail.onAlertLoad");
  // bogus call to make sure the window is moved offscreen until we are ready for it.
  this.resizeAlert(true);

  // if we aren't waiting to fetch preview text, then go ahead and
  // start showing the alert.
  if (this.effect == "fade") {
    this.showAlertFade();
  // Disable slide for custom and center positions
  } else if (this.effect == "slide" &&
             this.position != "custom" &&
             this.position != "center") {
    this.showAlertSlide();
  } else {
    this.resizeAlert(false);
    var alertContainer = document.getElementById('alertContainer');
    alertContainer.style.opacity = 1;
    this.placeAlert();
    this.resizeAlert(false);
    this.timer_state = this.WAITING;
    if (this.duration > 0) {
        this.timer.cancel();
        this.timer.initWithCallback(this, this.duration * 1000, this.timer.TYPE_ONE_SHOT);
    }
  }
  MailboxAlertUtil.logEnd("MailboxAlertNewMail.onAlertLoad");
}

MailboxAlertNewMail.showAlertSlide = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.showAlertSlide");
    var top = true;

    var alertContainer = document.getElementById('alertContainer');
    alertContainer.style.opacity = 0;
    this.resizeAlert(false);
    this.placeAlert();

    this.window_y = -this.getWindowHeight();

    if (this.position == "top-right") {
        this.window_x = this.gOrigin & this.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - this.getWindowWidth());
    } else if (this.position == "bottom-right") {
        top = false;
        this.window_x = this.gOrigin & this.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - this.getWindowWidth());
        this.window_y = screen.height + this.getWindowHeight();
        this.window_to_y = this.gOrigin & this.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight - this.getWindowHeight());
    } else if (this.position == "bottom-left") {
        top = false;
        this.window_y = screen.height + this.getWindowHeight();
        this.window_to_y = this.gOrigin & this.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight - this.getWindowHeight());
    } else if (this.position == "center") {
        this.window_x = this.gOrigin & this.LEFT ? screen.availLeft :
        ((screen.availLeft + screen.availWidth) / 2 - (this.getWindowWidth() / 2));
        this.window_y = -this.getWindowHeight();
        this.window_to_y = this.gOrigin & this.TOP ? screen.availTop :
        ((screen.availTop + screen.availHeight) / 2 - (this.getWindowHeight() / 2));
    }
    //window.sizeToContent();
    //window.resizeTo(this.getWindowWidth(), this.getWindowHeight());
    window.moveTo(this.window_x, this.window_y);
    this.resizeAlert(false);
    this.placeAlertOutside();
    alertContainer.style.opacity = 1;

    if (top) {
        this.timer_state = this.SLIDING_IN_TOP;
    } else {
        this.timer_state = this.SLIDING_IN_BOTTOM;
    }
    this.timer.initWithCallback(this, this.gSlideTime, this.timer.TYPE_REPEATING_PRECISE);
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.showAlertSlide");
}

MailboxAlertNewMail.slideInTop = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.slideInTop");
    // called by a repeated timer now, if we need to move we move,
    // if we are done we need to reset the timer
    // if something goes wrong, we simply give up and close the window
    try {
        if (window.screenY < this.window_to_y) {
            window.moveBy(0, this.gSlideDistance);
        } else {
            this.timer_state = this.WAITING;
            this.window_to_y = -this.getWindowHeight();
            // we only need to wait the duration once (the handler should init the slideout
            // timer on a repeated basis again
            if (this.duration > 0) {
                this.timer.cancel();
                this.timer.initWithCallback(this, this.duration * 1000, this.timer.TYPE_ONE_SHOT);
            }
        }
    } catch (e) {
        MailboxAlertUtil.logMessage(0, "Error moving window, closing window\n");
        this.timer.cancel();
        MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideInTop", "close window on error");
        window.close();
        return;
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideInTop");
}

MailboxAlertNewMail.slideOutTop = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.slideOutTop");
    if (!window) {
        this.timer.cancel();
        return;
    }
    // if something goes wrong, we simply give up and close the window
    try {
        var y_pos = window.screenY;
        if (y_pos > this.window_to_y) {
            window.moveBy(0, -this.gSlideDistance);
            // if we don't appear to be moving anymore, close
            if (window.screenY == y_pos) {
                this.timer.cancel();
                this.timer_state = this.DONE;
                MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideOutTop", "close window on movement stop");
                window.close();
                return;
            }
        } else {
            this.timer.cancel();
            this.timer_state = this.DONE;
            MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideOutTop", "close window on done");
            window.close();
            return;
        }
    } catch (e) {
        this.timer.cancel();
        MailboxAlertUtil.logMessage(0, "Error moving window, closing window: " + e + "\n");
        MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideOutTop", "close window on error");
        window.close();
        return;
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideOutTop");
}

MailboxAlertNewMail.slideInBottom = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.slideInBottom");
    // if something goes wrong, we simply give up and close the window
    try {
        var y_pos = window.screenY;
        if (y_pos > this.window_to_y) {
            window.moveBy(0, -this.gSlideDistance);
        } else {
            this.timer_state = this.WAITING;

            window.moveTo(this.window_x, this.window_to_y);
            this.window_y = this.window_to_y;
            this.window_to_y = screen.height + this.getWindowHeight();

            // we only need to wait the duration once (the handler should init the slideout
            // timer on a repeated basis again
            if (this.duration > 0) {
                this.timer.cancel();
                this.timer.initWithCallback(this, this.duration * 1000, this.timer.TYPE_ONE_SHOT);
            }
        }
    } catch (e) {
        MailboxAlertUtil.logMessage(0, "Error moving window, closing window\n");
        this.timer.cancel();
        MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideInBottom", "close window on error");
        window.close();
        return;
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideInBottom");
}

MailboxAlertNewMail.slideOutBottom = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.slideOutBottom");
    try {
        var y_pos = window.screenY;
        if (y_pos < this.window_to_y) {
            window.moveBy(0, this.gSlideDistance);
            // if we don't appear to be moving anymore, close
            if (window.screenY == y_pos) {
                this.timer.cancel();
                this.timer_state = this.DONE;
                MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideOutBottom", "close window on movement stop");
                window.close();
                return;
            }
        } else {
            this.timer.cancel();
            this.timer_state = this.DONE;
            MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideOutBottom", "close window on done");
            window.close();
            return;
        }
    } catch (e) {
        MailboxAlertUtil.logMessage(0, "Error moving window, closing window\n");
        this.timer.cancel();
        MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideOutBottom", "close window on error");
        window.close();
        return;
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.slideOutBottom");
}

MailboxAlertNewMail.showAlertFade = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.showAlertFade");
    var alertContainer = document.getElementById('alertContainer');
    alertContainer.style.opacity = 0;
    this.resizeAlert(false);
    this.placeAlert();
    this.resizeAlert(false);
    this.timer_state = this.FADING_IN;
    this.timer.cancel();
    this.timer.initWithCallback(this, this.gFadeTime, this.timer.TYPE_REPEATING_PRECISE);
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.showAlertFade");
}

MailboxAlertNewMail.getWindowHeight = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.getWindowHeight");
    var result = 10 + Math.max (document.getElementById('alertTextBox').getBoundingClientRect().height,
                              document.getElementById('alertImage').getBoundingClientRect().height);
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.getWindowHeight");
    return result;
}

MailboxAlertNewMail.getWindowWidth = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.getWindowWidth");
    result =  30
            + document.getElementById('alertImage').getBoundingClientRect().width
            + Math.max (document.getElementById('subject').getBoundingClientRect().width,
                        document.getElementById('message_field').getBoundingClientRect().width);
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.getWindowWidth");
    return result;
}

MailboxAlertNewMail.resizeAlert = function (aMoveOffScreen)
{
  MailboxAlertUtil.logStart("MailboxAlertNewMail.resizeAlert");
  resizeTo(this.getWindowWidth(), this.getWindowHeight());
  MailboxAlertUtil.logEnd("MailboxAlertNewMail.resizeAlert");
}

MailboxAlertNewMail.placeAlert = function () {
  MailboxAlertUtil.logStart("MailboxAlertNewMail.placeAlert");
  var x = 0;
  var y = 0;

  if (this.position == "top-right") {
    x = this.gOrigin & this.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - this.getWindowWidth());
  } else if (this.position == "bottom-right") {
    x = this.gOrigin & this.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - this.getWindowWidth());
    y = this.gOrigin & this.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight - this.getWindowHeight());
  } else if (this.position == "bottom-left") {
    y = this.gOrigin & this.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight - this.getWindowHeight());
  } else if (this.position == "center") {
    x = this.gOrigin & this.LEFT ? screen.availLeft :
        ((screen.availLeft + screen.availWidth) / 2 - (this.getWindowWidth() / 2));
    y = this.gOrigin & this.TOP ? screen.availTop :
        ((screen.availTop + screen.availHeight) / 2 - (this.getWindowHeight() / 2));
  } else if (this.position == "custom") {
    if (this.custom_position_anchor == "topleft") {
        x = this.custom_position_x;
        y = this.custom_position_y;
    } else if (this.custom_position_anchor == "topright") {
        x = this.custom_position_x - this.getWindowWidth();
        y = this.custom_position_y;
    } else if (this.custom_position_anchor == "bottomleft") {
        x = this.custom_position_x;
        y = this.custom_position_y - this.getWindowHeight();
    } else if (this.custom_position_anchor == "bottomright") {
        x = this.custom_position_x - this.getWindowWidth();
        y = this.custom_position_y - this.getWindowHeight();
    }
  }
  window.sizeToContent();
  window.moveTo(x, y);
  MailboxAlertUtil.logEnd("MailboxAlertNewMail.placeAlert");
}

MailboxAlertNewMail.placeAlertOutside = function () {
  MailboxAlertUtil.logStart("MailboxAlertNewMail.placeAlertOutside");
  var x = 0;
  var y = -this.getWindowHeight();

  if (this.position == "top-right") {
    x = this.gOrigin & this.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - this.getWindowWidth());
  } else if (this.position == "bottom-right") {
    x = this.gOrigin & this.LEFT ? screen.availLeft :
        (screen.availLeft + screen.availWidth - this.getWindowWidth());
    y = this.gOrigin & this.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight);
  } else if (this.position == "bottom-left") {
    y = this.gOrigin & this.TOP ? screen.availTop :
        (screen.availTop + screen.availHeight);
  } else if (this.position == "center") {
    x = this.gOrigin & this.LEFT ? screen.availLeft :
        ((screen.availLeft + screen.availWidth) / 2 - (this.getWindowWidth() / 2));
/*
    y = this.gOrigin & this.TOP ? screen.availTop :
        ((screen.availTop + screen.availHeight) / 2 - (this.getWindowHeight() / 2));
*/
  } else if (this.position == "custom") {
    if (this.custom_poisition_anchor == "topleft") {
        x = this.custom_position_x;
        y = this.custom_position_y;
    } else if (this.custom_poisition_anchor == "topright") {
        x = this.custom_position_x - this.getWindowWidth();
        y = this.custom_position_y;
    } else if (this.custom_poisition_anchor == "bottomleft") {
        x = this.custom_position_x;
        y = this.custom_position_y - this.getWindowHeight();
    } else if (this.custom_poisition_anchor == "bottomright") {
        x = this.custom_position_x - this.getWindowWidth();
        y = this.custom_position_y - this.getWindowHeight();
    }
  }
  window.moveTo(x, y);
  MailboxAlertUtil.logEnd("MailboxAlertNewMail.placeAlertOutside");
}

MailboxAlertNewMail.fadeOpen = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.fadeOpen");
    var alertContainer = document.getElementById('alertContainer');
    var newOpacity = parseFloat(window.getComputedStyle(alertContainer, "").opacity) + this.gFadeIncrement;
    alertContainer.style.opacity = newOpacity;

    if (newOpacity >= 1.0) {
        // switch gears and start closing the alert
        this.timer_state = this.WAITING;
        if (this.duration > 0) {
            this.timer.cancel();
            this.timer.initWithCallback(this, 1000 * this.duration, this.timer.TYPE_ONE_SHOT);
        }
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.fadeOpen");
}

MailboxAlertNewMail.fadeClose = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.fadeClose");
    if (document) {
        var alertContainer = document.getElementById('alertContainer');
        var newOpacity = parseFloat(window.getComputedStyle(alertContainer, "").opacity) - this.gFadeIncrement;
        alertContainer.style.opacity = newOpacity;
        if (newOpacity <= 0) {
            this.timer.cancel();
            this.timer_state = this.DONE;
            MailboxAlertUtil.logEnd("MailboxAlertNewMail.fadeClose", "close window on done");
            window.close();
            return;
        }
    } else {
        this.timer.cancel();
        this.timer_state = this.DONE;
        MailboxAlertUtil.logEnd("MailboxAlertNewMail.fadeClose", "close window no document");
        window.close();
        return;
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.fadeClose");
}

MailboxAlertNewMail.closeAlert = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.closeAlert");
    try {
        // make sure there won't be anything else firing

        // We create a new timer here, sometimes canceling an existing
        // one and reinitializing it does to produce the expected result
        // (it would still wait duration*1000 before firing)

        if (this.effect == "fade") {
            this.timer_state = this.FADING_OUT;
            this.timer.cancel();
            this.close_timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
            this.close_timer.initWithCallback(this, this.gFadeTime, this.timer.TYPE_REPEATING_PRECISE);
            MailboxAlertUtil.logEnd("MailboxAlertNewMail.closeAlert", "close window fade");
        } else if (this.effect == "slide" &&
                   this.position != "custom" && this.position != "center") {
            if (this.position == "top-right" || this.position == "top-left") {
                this.timer_state = this.SLIDING_OUT_TOP;
                this.timer.cancel();
                this.close_timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
                this.close_timer.initWithCallback(this, this.gSlideTime, this.timer.TYPE_REPEATING_PRECISE);
            } else if (this.position == "bottom-right" || this.position == "bottom-left") {
                this.timer_state = this.SLIDING_OUT_BOTTOM;
                this.timer.cancel();
                this.close_timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
                this.close_timer.initWithCallback(this, this.gSlideTime, this.timer.TYPE_REPEATING_PRECISE);
            } else {
                MailboxAlertUtil.logEnd("MailboxAlertNewMail.closeAlert", "close window slide");
                window.close();
                return;
            }
        } else {
            MailboxAlertUtil.logEnd("MailboxAlertNewMail.closeAlert", "close window no effect");
            window.close();
            return;
        }
    } catch (e) {
        MailboxAlertUtil.logMessage(0, "error: " + e + "\n");
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.closeAlert");
}

MailboxAlertNewMail.handleClick = function (event)
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.handleClick");
    try {
        // this.showMethods(event);
        // Only do default action on left click (button value 0)
        // On middle click (1), do nothing
        // On right click (2), the menu items have their own action
        // associations, but we should stop the running timer
        // (TODO: restart it if we close the popup again?)
        if (event.button == 0) {
            this.performAction(this.whenclicked);
        } else if (event.button == 2) {
            if (!this.stored_timer_delay) {
                // store the timer before we cancel it so we can
                // restart it
                this.stored_timer_delay = this.timer.delay;
                this.stored_timer_type = this.timer.type;
            }
            this.timer.cancel();
        }
    } catch (e) {
        MailboxAlertUtil.logMessage(0, "[MailboxAlert] error2: " + e + "\n");
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.handleClick");
}

// This function is called if the context popup is closed
MailboxAlertNewMail.restartTimer = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.restartTimer");
	// Context menu closed, restart the timer
	if (this.stored_timer_delay) {
		this.timer.initWithCallback(this, this.stored_timer_delay,
		                            this.stored_timer_type);
		this.stored_timer_delay = null;
		this.stored_timer_type = null;
	}
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.restartTimer");
}

MailboxAlertNewMail.handleRightClick = function ()
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.handleRightClick");
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.handleRightClick");
}

MailboxAlertNewMail.performAction = function (action)
{
    MailboxAlertUtil.logStart("MailboxAlertNewMail.performAction");
    try {
        MailboxAlertUtil.logMessage(1, "Alert window clicked\n");
        const Cc = Components.classes;
        const Ci = Components.interfaces;
        if (action == "close") {
            MailboxAlertUtil.logMessage(1, "Close alert window\n");
            // Do nothing, the window will be closed at the end of this
            // function.
        } else if (action == "selectmail") {
            MailboxAlertUtil.logMessage(1, "Select mail\n");
            var windowManager = Cc['@mozilla.org/appshell/window-mediator;1'].getService();
            var windowManagerInterface = MailboxAlertUtil.getInterface(Ci.nsIWindowMediator);
            var mailWindow = windowManagerInterface.getMostRecentWindow( "mail:3pane" );
            if ( mailWindow ) {
                tabmail = mailWindow.document.getElementById("tabmail");
                tabmail.selectTabByMode('folder');
                if (this.message_hdr) {
                    mailWindow.gFolderTreeView.selectFolder(this.folder);
                    if (mailWindow.gDBView) {
                        mailWindow.gDBView.selectMsgByKey(this.message_hdr.messageKey);
                    } else if (mailWindow.gFolderDisplay) {
                        mailWindow.gFolderDisplay.selectMessageComingUp();
                        mailWindow.gFolderDisplay.selectMessage(this.message_hdr);
                    } else if (mailWindow.msgWindow) {
                        var mail_uri = this.message_hdr.folder.getUriForMsg(this.message_hdr);
                        mailWindow.msgWindow.windowCommands.selectMessage(mail_uri);
                    } else {
                        // Running out of ideas here...
                    }
                }
                //mailWindow.restore();
                mailWindow.focus();
            } else {
                MailboxAlertUtil.logMessage(1, "did not get mailWindow\n");
                window.open(uri, "_blank", "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");
            }
        } else if (action == "openmail") {
            // get the messenger window open service and ask it to open a new window for us
            var mailWindowService = Components.classes["@mozilla.org/messenger/windowservice;1"].getService(Components.interfaces.nsIMessengerWindowService);
            if (mailWindowService) {
                window.openDialog( "chrome://messenger/content/messageWindow.xhtml", "_blank", "all,chrome,dialog=no,status,toolbar", this.message_hdr, null );
            } else {
                MailboxAlertUtil.logMessage(1, "Could not get nsIMsgWindow service\n");
            }
        } else if (action == "deletemail") {
            if (this.message_hdr.folder) {
                var messages = Components.classes["@mozilla.org/array;1"]
                    .createInstance(Components.interfaces.nsIMutableArray);
                messages.appendElement(this.message_hdr, false);
                var windowManager = Cc['@mozilla.org/appshell/window-mediator;1'].getService();
                var windowManagerInterface = MailboxAlertUtil.getInterface(Ci.nsIWindowMediator);
                var mailWindow = windowManagerInterface.getMostRecentWindow( "mail:3pane" );
                this.message_hdr.folder.deleteMessages(messages, mailWindow.msgWindow, false, false, null, true);
                children.clear();
            }
        }
        this.closeAlert();
    } catch (e) {
        MailboxAlertUtil.logMessage(0, "[MailboxAlert] error3: " + e + "\n");
        MailboxAlertUtil.logEnd("MailboxAlertNewMail.performAction", "close window on error");
        window.close();
        return;
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.performAction");
}

MailboxAlertNewMail.notify = function(timer) {
    MailboxAlertUtil.logStart("MailboxAlertNewMail.notify");
    // this function is called every time a fade or slide timer fires
    // we need to move the window or change the opacity until we're done
    // then we need to set a new timer to wait until the window needs to
    // close automatically, after which this function is called until
    // we have faded or slided out again.
    // note: every time we close the window, we should cancel the timer
    try {
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
        } else {
            timer.cancel();
            MailboxAlertUtil.logEnd("MailboxAlertNewMail.notify", "close window on unknown state");
            window.close();
            return;
        }
    } catch (e) {
        timer.cancel();
        MailboxAlertUtil.logEnd("MailboxAlertNewMail.notify", "close window on error");
        window.close();
        return;
    }
    MailboxAlertUtil.logEnd("MailboxAlertNewMail.notify");
}
