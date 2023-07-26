import { getFolderPrefs, getAllAlertPrefs, initialAlertConfiguration, toggleAlertForFolder } from "/scripts/preferences.js"

(async () => {

    // Keep track of the number of times Mailbox Alert was initialized
    let initializationCount = 0;

    // This listener returns a selective Promise and is therefore compatible with
    // runtime messaging (messenger.storage.local.set/get return Promises).
    function listener(data) {
        switch (data.command) {
            /*
             * Return the number of times Mailbox Alert was initialized
             * (with the windowListener API, it is instanced every
             * time a new window is opened).
             */
            case "getInitializationCount":
                return initializationCount++;
            default:
                console.log("[MailboxAlert] Unknown command sent to background: " + data.command + "\n");
        }
    }

    // Listen to commands from extension instances
    messenger.NotifyTools.onNotifyBackground.addListener(listener);

    messenger.WindowListener.registerDefaultPrefs("skin/defaults/preferences/mailboxalert_default.js");

    messenger.WindowListener.registerChromeUrl([
        ["content",  "mailboxalert",                "content/"],
        ["resource", "mailboxalert-skin",           "skin/classic/"]
    ]);

    messenger.WindowListener.registerOptionsPage("chrome://mailboxalert/content/alert_list.xhtml");
    
    messenger.WindowListener.registerWindow(
        "chrome://messenger/content/messenger.xhtml",
        "chrome://mailboxalert/content/scripts/mailboxalertOverlay.js");

    messenger.WindowListener.registerWindow(
        "chrome://messenger/content/FilterEditor.xhtml",
        "chrome://mailboxalert/content/scripts/filterEditorOverlay.js");

    messenger.WindowListener.startListening();

    initialAlertConfiguration();

    // Folder context menu is dynamic based on preferences
    messenger.menus.onShown.addListener(async ({ selectedFolder }, tab) => {
        if (selectedFolder) {
            console.log("[XX] yo");
            let folderPrefs = await getFolderPrefs(selectedFolder);
            console.log("[XX] yo2: " + folderPrefs);
            let alertPrefs = await getAllAlertPrefs();
            
            console.log("[XX] Menu shown: " + selectedFolder);
            messenger.menus.remove("mailboxalert_context_menu");
            let top_menu = messenger.menus.create({
                contexts: ["folder_pane"],
                id: "mailboxalert_context_menu",
                title: messenger.i18n.getMessage("mailboxalert.name")
            });
            alertPrefs.forEach((alertPref) => {
                console.log("[XX] ADD PREF TO MENU: " + alertPref.index);
                messenger.menus.create({
                    contexts: ["folder_pane"],
                    parentId: "mailboxalert_context_menu",
                    title: alertPref.values['name'],
                    type: 'checkbox',
                    checked: folderPrefs.alertActive(alertPref.index),
                    onclick: () => { console.log(`toggle alert ${alertPref.index} for folder ${folderPrefs.uri} clicked`);
                        toggleAlertForFolder(alertPref.index, folderPrefs);
                    }
                });
            });
            let afc_id = messenger.menus.create({
                contexts: ["folder_pane"],
                parentId: "mailboxalert_context_menu",
                id: "mailboxalert_context_menu_sub",
                title: messenger.i18n.getMessage("mailboxalert.menu.alertforchildren"),
                onclick: () => { console.log("alert for children clicked"); doNewLog(); }
            });
            //let element = messenger.menus.getTargetElement(afc_id);
            //element.addEventListener("command", (ev) => { console.log("[XX] NEW EVENT!"); }, false);
            messenger.menus.create({
                contexts: ["folder_pane"],
                parentId: "mailboxalert_context_menu",
                type: "checkbox",
                checked: true,
                title: messenger.i18n.getMessage("mailboxalert.menu.noalerttoparent"),
                onclick: (event) => { console.log("no alert to parent clicked: " + typeof(event)); event.stopPropagation(); doNewLog(); return false; }
            });
            messenger.menus.refresh();
        }
    })
})();
