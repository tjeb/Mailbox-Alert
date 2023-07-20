// Import any needed modules.
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");



// Load an additional JavaScript file.
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalert_util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalert_vars.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalert_funcs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalertOverlay.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/new_filterEditor.js", window, "UTF-8");

var ADDON_ID = "{9c21158b-2c76-4d0a-980a-c51fc9cefaa7}";

// Import any needed modules.
var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");

// Get our extension object.
let extension = ExtensionParent.GlobalManager.getExtension(ADDON_ID);

// Load notifyTools into a custom namespace, to prevent clashes with other add-ons.
//window.MailboxAlert = {};
Services.scriptloader.loadSubScript(extension.rootURI.resolve("content/notifyTools/notifyTools.js"), window.MailboxAlert, "UTF-8");


//Services.scriptloader.loadSubScript("chrome://mailboxalert/content/notifyTools/notifyTools.js", window.MailboxAlert, "UTF-8");

function onLoad(activatedWhileWindowOpen) {

  WL.injectCSS("chrome://mailboxalert/content/mailboxalert_filter.css");
  WL.injectElements(`
<menupopup id="taskPopup">
        <menuseparator id="mailboxalertSeperator" />
        <menuitem id="mailboxalert-moz-tools-menu-prefs"
            label="${extension.localeData.localizeMessage("mailboxalert.menu.editalerts")}" accesskey="L"
            oncommand="window.openDialog('chrome://mailboxalert/content/alert_list.xhtml', 'mailboxalert_prefs', 'chrome');"/>
        <menuitem id="mailboxalert-moz-tools-menu-mute"
            type="checkbox"
            label="${extension.localeData.localizeMessage("mailboxalert.mute")}" accesskey="M"
            oncommand="MailboxAlert.toggleMute();"
            autocheck="false"/>
        <menu id="mailboxalert-moz-tool-menu-delay" label="${extension.localeData.localizeMessage("mailboxalert.alert_prefs.delay")}">
            <menupopup id="mailboxalert-alert-delay-popup">
                <menuitem label="${extension.localeData.localizeMessage("mailboxalert.alert_prefs.effect.none")}"
                          type="checkbox"
                          id="mailboxalert-alert-delay-0"
                          checked="true"
                          value="0"
                          oncommand="MailboxAlert.setAlertDelay(0);" />
                <menuitem label="1 ${extension.localeData.localizeMessage("mailboxalert.alert_prefs.time_unit")}"
                          type="checkbox"
                          id="mailboxalert-alert-delay-1000"
                          value="1000"
                          oncommand="MailboxAlert.setAlertDelay(1000);" />
                <menuitem label="2 ${extension.localeData.localizeMessage("mailboxalert.alert_prefs.time_unit")}"
                          type="checkbox"
                          id="mailboxalert-alert-delay-2000"
                          value="2000"
                          oncommand="MailboxAlert.setAlertDelay(2000);" />
                <menuitem label="3 ${extension.localeData.localizeMessage("mailboxalert.alert_prefs.time_unit")}"
                          type="checkbox"
                          id="mailboxalert-alert-delay-3000"
                          value="3000"
                          oncommand="MailboxAlert.setAlertDelay(3000);" />
                <menuitem label="5 ${extension.localeData.localizeMessage("mailboxalert.alert_prefs.time_unit")}"
                          type="checkbox"
                          id="mailboxalert-alert-delay-5000"
                          value="5000"
                          oncommand="MailboxAlert.setAlertDelay(5000);" />
                <menuitem label="10 ${extension.localeData.localizeMessage("mailboxalert.alert_prefs.time_unit")}"
                          type="checkbox"
                          id="mailboxalert-alert-delay-10000"
                          value="10000"
                          oncommand="MailboxAlert.setAlertDelay(10000);" />
                <menuitem label="30 ${extension.localeData.localizeMessage("mailboxalert.alert_prefs.time_unit")}"
                          type="checkbox"
                          id="mailboxalert-alert-delay-30000"
                          value="20000"
                          oncommand="MailboxAlert.setAlertDelay(20000);" />
            </menupopup>
        </menu>

    </menupopup>

    <popup id="folderPaneContext">
        <menu
            label="${extension.localeData.localizeMessage("mailboxalert.name")}"
            accesskey="a"
            insertbefore="folderPaneContext-properties"
            index="10"
        >
            <menupopup
                id="folderPaneContext-mailboxalert"
                onpopupshowing="if (event.target == this) { MailboxAlert.fillFolderMenu(this, MailboxAlert.getFolder()); }"
            />
        </menu>
    </popup>`);

  window.MailboxAlert.onLoad();

}

function onUnload(deactivatedWhileWindowOpen) {
    window.MailboxAlert.onUnload();
}
