// Import any needed modules.
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

// Load an additional JavaScript file.
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalert_util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalert_vars.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalert_funcs.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/mailboxalertOverlay.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mailboxalert/content/new_filterEditor.js", window, "UTF-8");

function onLoad(activatedWhileWindowOpen) {

  WL.injectCSS("chrome://mailboxalert/content/mailboxalert_filter.css");
  WL.injectElements(`
<menupopup id="taskPopup">
        <menuseparator id="mailboxalertSeperator" />
        <menuitem id="mailboxalert-moz-tools-menu-prefs"
            label="&mailboxalert.menu.editalerts;" accesskey="L"
            oncommand="window.openDialog('chrome://mailboxalert/content/alert_list.xhtml', 'mailboxalert_prefs', 'chrome');"/>
        <menuitem id="mailboxalert-moz-tools-menu-mute"
            type="checkbox"
            label="&mailboxalert.mute;" accesskey="M"
            oncommand="MailboxAlert.toggleMute();"
            autocheck="false"/>
        <menu id="mailboxalert-moz-tool-menu-delay" label="&mailboxalert.alert_prefs.delay;">
            <menupopup id="mailboxalert-alert-delay-popup">
                <menuitem label="&mailboxalert.alert_prefs.effect.none;"
                          type="checkbox"
                          id="mailboxalert-alert-delay-0"
                          checked="true"
                          value="0"
                          oncommand="MailboxAlert.setAlertDelay(0);" />
                <menuitem label="1 &mailboxalert.alert_prefs.time_unit;"
                          type="checkbox"
                          id="mailboxalert-alert-delay-1000"
                          value="1000"
                          oncommand="MailboxAlert.setAlertDelay(1000);" />
                <menuitem label="2 &mailboxalert.alert_prefs.time_unit;"
                          type="checkbox"
                          id="mailboxalert-alert-delay-2000"
                          value="2000"
                          oncommand="MailboxAlert.setAlertDelay(2000);" />
                <menuitem label="3 &mailboxalert.alert_prefs.time_unit;"
                          type="checkbox"
                          id="mailboxalert-alert-delay-3000"
                          value="3000"
                          oncommand="MailboxAlert.setAlertDelay(3000);" />
                <menuitem label="5 &mailboxalert.alert_prefs.time_unit;"
                          type="checkbox"
                          id="mailboxalert-alert-delay-5000"
                          value="5000"
                          oncommand="MailboxAlert.setAlertDelay(5000);" />
                <menuitem label="10 &mailboxalert.alert_prefs.time_unit;"
                          type="checkbox"
                          id="mailboxalert-alert-delay-10000"
                          value="10000"
                          oncommand="MailboxAlert.setAlertDelay(10000);" />
                <menuitem label="30 &mailboxalert.alert_prefs.time_unit;"
                          type="checkbox"
                          id="mailboxalert-alert-delay-30000"
                          value="20000"
                          oncommand="MailboxAlert.setAlertDelay(20000);" />
            </menupopup>
        </menu>

    </menupopup>

    <popup id="folderPaneContext">
        <menu
            label="&mailboxalert.name;"
            accesskey="a"
            insertbefore="folderPaneContext-properties"
            index="10"
        >
            <menupopup
                id="folderPaneContext-mailboxalert"
                onpopupshowing="if (event.target == this) { MailboxAlert.fillFolderMenu(this, MailboxAlert.getFolder()); }"
            />
        </menu>
    </popup>`,
  ["chrome://mailboxalert/locale/mailboxalert.dtd"]);

  window.MailboxAlert.onLoad();

}

function onUnload(deactivatedWhileWindowOpen) {
}
