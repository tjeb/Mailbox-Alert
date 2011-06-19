
MailboxAlert.getFolder = function () {
	try {
		var folderResource = GetFirstSelectedMsgFolder();
		if (folderResource)
		{
			var msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
			return msgFolder;
		}
	} catch (ex) {
		dump("ex="+ex+"\n");
	}
	dump("[mailboxalert] error: folder not found\n");
	return null;
}

MailboxAlert.toggleMute = function () {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    var muted = true;
    try {
        muted = !prefs.getBoolPref("extensions.mailboxalert.mute");
    }
    catch (e) {
        // Ignore, mute never saved
    }
    prefs.setBoolPref("extensions.mailboxalert.mute", muted);
    /* should we check whether the user has made the mute state out of sync, by
     toggling mute in different windows? */
    /* window_muted = menuitem.hasAttribute("checked");*/
    MailboxAlert.setMuteMenuitem(muted);
}

MailboxAlert.muted = function() {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    var muted = false;
    try {
        muted = prefs.getBoolPref("extensions.mailboxalert.mute");
    }
    catch (e) {
        // Ignore, mute never saved
    }
    return muted;
}

MailboxAlert.setMuteMenuitem = function(muted) {
    menuitem = document.getElementById("mailboxalert-moz-tools-menu-mute");
    if (muted) {
        menuitem.setAttribute("checked", true);
    } else {
        menuitem.removeAttribute("checked");
    }
}

MailboxAlert.showPrefs = function (url, arg1, arg2, folder)  {
	if (folder.flags) {
		//if (folder.flags & MSG_FOLDER_FLAG_VIRTUAL) {
		if (folder.flags & 0x0020) {
			var stringsBundle = document.getElementById("string-bundle");
			alert(stringsBundle.getString('mailboxalert.error.virtualfolder'));
		} else {
			window.openDialog(url, arg1, arg2, folder);
		}
	}
}

MailboxAlert.deleteFolderPrefs = function (folder_name) {
	var stringsBundle = document.getElementById("string-bundle");

	try {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		prefs.deleteBranch("extensions.mailboxalert.show_message." + folder_name);
		prefs.deleteBranch("extensions.mailboxalert.subject." + folder_name);
		prefs.deleteBranch("extensions.mailboxalert.message." + folder_name);
		prefs.deleteBranch("extensions.mailboxalert.icon_file." + folder_name);

		prefs.deleteBranch("extensions.mailboxalert.play_sound." + folder_name);
		prefs.deleteBranch("extensions.mailboxalert.sound_wav." + folder_name);
		prefs.deleteBranch("extensions.mailboxalert.sound_wav_file." + folder_name);

		prefs.deleteBranch("extensions.mailboxalert.execute_command." + folder_name);
		prefs.deleteBranch("extensions.mailboxalert.command." + folder_name);
		prefs.deleteBranch("extensions.mailboxalert.escape." + folder_name);

		prefs.deleteBranch("extensions.mailboxalert.alert_for_children." + folder_name);
		prefs.deleteBranch("extensions.mailboxalert.no_alert_to_parent." + folder_name);

		dump("[mailboxalert] deleted (old) preferences for folder\n");
	} catch (e) {
		dump("[mailboxalert] Error deleting folder preferences\n");
		dump(stringsBundle.getString('mailboxalert.error') + e + "\n");
	}
}

MailboxAlert.copyFolderPrefs = function (oldName, newName, deleteOldPrefs) {
	var stringsBundle = document.getElementById("string-bundle");

	var folder_uri = newName;
	var folder_name = oldName;

	//dump("copy from "+oldName+" to " + newName + "\n");
	try {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		var show_message_pref = false;
		var message_text_pref = "";
		var subject_text_pref = "";
		var icon_file_pref = "chrome://mailboxalert/skin/mailboxalert.png";

		var play_sound_pref = false;
		var sound_wav_pref = true;
		var sound_wav_file_pref = "";

		var execute_command_pref = false;
		var command_pref = "";
		var prev_pref = "";
		var escape_pref = false;

		var alertforchildren_pref = false;
		var noalerttoparent_pref = false;

		try {
			prefs.getBoolPref("extensions.mailboxalert.show_message."+folder_uri);
			//dump("extensions.mailboxalert.show_message."+folder_uri+" was set\n");
			return;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			prefs.getCharPref("extensions.mailboxalert.message."+folder_uri);
			//dump("extensions.mailboxalert.message."+folder_uri+" was set\n");
			return;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			prefs.getCharPref("extensions.mailboxalert.subject."+folder_uri);
			//dump("extensions.mailboxalert.subject."+folder_uri+" was set\n");
			return;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			prefs.getCharPref("extensions.mailboxalert.icon_file."+folder_uri);
			//dump("extensions.mailboxalert.icon_file."+folder_uri+" was set\n");
			return;
		} catch(e) {
			// ok pref doesn't exist yet.
		}

		try {
			prefs.getBoolPref("extensions.mailboxalert.play_sound."+folder_uri);
			//dump("extensions.mailboxalert.play_sound."+folder_uri+" was set\n");
			return;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			prefs.getBoolPref("extensions.mailboxalert.sound_wav."+folder_uri);
			//dump("extensions.mailboxalert.sound_wav."+folder_uri+" was set\n");
			return;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			prefs.getCharPref("extensions.mailboxalert.sound_wav_file."+folder_uri);
			//dump("extensions.mailboxalert.sound_wav_file."+folder_uri+" was set\n");
			return;
		} catch(e) {
			// ok pref doesn't exist yet.
		}

		try {
			prefs.getBoolPref("extensions.mailboxalert.execute_command."+folder_uri);
			//dump("extensions.mailboxalert.execute_command."+folder_uri+" was set\n");
			return;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			prefs.getCharPref("extensions.mailboxalert.command."+folder_uri);
			//dump("extensions.mailboxalert.command."+folder_uri+" was set\n");
			return;
		} catch (e) {
			// ok pref doesn't exist yet
		}

		try {
			prefs.getBoolPref("extensions.mailboxalert.escape."+folder_uri);
			//dump("extensions.mailboxalert.escape."+folder_uri+" was set\n");
			return;
		} catch (e) {
			// ok pref doesn't exist yet
		}

		try {
			prefs.getCharPref("extensions.mailboxalert.last_command");
			//dump("extensions.mailboxalert.last_command"+" was set\n");
			return;
		} catch (e) {
			// ok pref doesn't exist yet
		}

		try {
			prefs.getBoolPref("extensions.mailboxalert.alert_for_children."+folder_uri);
			//dump("extensions.mailboxalert.alert_for_children."+folder_uri+" was set\n");
			return;
		} catch (e) {
			// ok pref doesn't exist yet
		}

		try {
			prefs.getBoolPref("extensions.mailboxalert.no_alert_to_parent."+folder_uri);
			//dump("extensions.mailboxalert.no_alert_to_parent."+folder_uri+" was set\n");
			return;
		} catch (e) {
			// ok pref doesn't exist yet
		}


		/*
		 *
		 * Okay, so no preferences have been set for this URI, try the old-school name reference
		 *
		 */
		//dump("checking old settings\n");
		var old_set = false;

		try {
			show_message_pref = prefs.getBoolPref("extensions.mailboxalert.show_message."+folder_name);
			old_set = true;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			message_text_pref = prefs.getCharPref("extensions.mailboxalert.message."+folder_name);
			old_set = true;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			subject_text_pref = prefs.getCharPref("extensions.mailboxalert.subject."+folder_name);
			old_set = true;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			icon_file_pref = prefs.getCharPref("extensions.mailboxalert.icon_file."+folder_name);
			old_set = true;
		} catch(e) {
			// ok pref doesn't exist yet.
		}

		try {
			play_sound_pref = prefs.getBoolPref("extensions.mailboxalert.play_sound."+folder_name);
			old_set = true;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			sound_wav_pref = prefs.getBoolPref("extensions.mailboxalert.sound_wav."+folder_name);
			old_set = true;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			sound_wav_file_pref = prefs.getCharPref("extensions.mailboxalert.sound_wav_file."+folder_name);
			old_set = true;
		} catch(e) {
			// ok pref doesn't exist yet.
		}

		try {
			execute_command_pref = prefs.getBoolPref("extensions.mailboxalert.execute_command."+folder_name);
			old_set = true;
		} catch(e) {
			// ok pref doesn't exist yet.
		}
		try {
			command_pref = prefs.getCharPref("extensions.mailboxalert.command."+folder_name);
			old_set = true;
		} catch (e) {
			// ok pref doesn't exist yet
		}

		try {
			escape_pref = prefs.getBoolPref("extensions.mailboxalert.escape."+folder_name);
			old_set = true;
		} catch (e) {
			// ok pref doesn't exist yet
		}

		try {
			prev_pref = prefs.getCharPref("extensions.mailboxalert.last_command");
			old_set = true;
		} catch (e) {
			// ok pref doesn't exist yet
		}

		try {
			alertforchildren_pref = prefs.getBoolPref("extensions.mailboxalert.alert_for_children."+folder_name);
			old_set = true;
		} catch (e) {
			// ok pref doesn't exist yet
		}

		try {
			noalerttoparent_pref = prefs.getBoolPref("extensions.mailboxalert.no_alert_to_parent."+folder_name);
			old_set = true;
		} catch (e) {
			// ok pref doesn't exist yet
		}

		if (old_set) {
			dump("Copying preferences from "+folder_name+" to "+folder_uri+"\n");

			/* now store these at the uri location instead of the name location */
			prefs.setBoolPref("extensions.mailboxalert.show_message." + folder_uri, show_message_pref);
			prefs.setCharPref("extensions.mailboxalert.subject." + folder_uri, subject_text_pref);
			prefs.setCharPref("extensions.mailboxalert.message." + folder_uri, message_text_pref);
			prefs.setCharPref("extensions.mailboxalert.icon_file." + folder_uri, icon_file_pref);

			prefs.setBoolPref("extensions.mailboxalert.play_sound." + folder_uri, play_sound_pref);
			prefs.setBoolPref("extensions.mailboxalert.sound_wav." + folder_uri, sound_wav_pref);
			prefs.setCharPref("extensions.mailboxalert.sound_wav_file." + folder_uri, sound_wav_file_pref);

			prefs.setBoolPref("extensions.mailboxalert.execute_command." + folder_uri, execute_command_pref);
			prefs.setCharPref("extensions.mailboxalert.command." + folder_uri, command_pref);
			prefs.setBoolPref("extensions.mailboxalert.escape." + folder_uri, escape_pref);

			prefs.setBoolPref("extensions.mailboxalert.alert_for_children." + folder_uri, alertforchildren_pref);
			prefs.setBoolPref("extensions.mailboxalert.no_alert_to_parent." + folder_uri, noalerttoparent_pref);

			/* delete the old values */
			if (deleteOldPrefs) {
				MailboxAlert.deleteFolderPrefs(folder_name);
			}
		}
		//dump("done copying folder preferences\n");
	} catch (e) {
		dump("[mailboxalert] Error copying folder preferences\n");
		dump(stringsBundle.getString('mailboxalert.error') + e + "\n");
	}
}

MailboxAlert.checkDefaultFolderPrefs = function (folder_uri) {
	/* check if there are any settings equal to the default, if so, erase them*/
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	var cur_pref;

	try {
		cur_pref = prefs.getBoolPref("extensions.mailboxalert.show_message."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("show_message", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.show_message."+folder_uri);
		}
	} catch(e) {
		// ok pref doesn't exist yet.
	}
	try {
		cur_pref = prefs.getBoolPref("extensions.mailboxalert.show_message_icon."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("show_message_icon", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.show_message_icon."+folder_uri);
		}
	} catch(e) {
		// ok pref doesn't exist yet.
	}
	try {
		cur_pref = prefs.getCharPref("extensions.mailboxalert.message."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("message", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.message."+folder_uri);
		}
	} catch(e) {
		// ok pref doesn't exist yet.
	}
	try {
		cur_pref = prefs.getCharPref("extensions.mailboxalert.subject."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("subject", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.subject."+folder_uri);
		}
	} catch(e) {
		// ok pref doesn't exist yet.
	}
	try {
		cur_pref = prefs.getCharPref("extensions.mailboxalert.icon_file."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("icon_file", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.icon_file."+folder_uri);
		}
	} catch(e) {
		// ok pref doesn't exist yet.
	}

	try {
		cur_pref = prefs.getBoolPref("extensions.mailboxalert.play_sound."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("play_sound", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.play_sound."+folder_uri);
		}
	} catch(e) {
		// ok pref doesn't exist yet.
	}
	try {
		cur_pref = prefs.getBoolPref("extensions.mailboxalert.sound_wav."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("sound_wav", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.sound_wav."+folder_uri);
		}
	} catch(e) {
		// ok pref doesn't exist yet.
	}
	try {
		cur_pref = prefs.getCharPref("extensions.mailboxalert.sound_wav_file."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("sound_wav_file", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.sound_wav_file."+folder_uri);
		}
	} catch(e) {
		// ok pref doesn't exist yet.
	}

	try {
		cur_pref = prefs.getBoolPref("extensions.mailboxalert.execute_command."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("execute_command", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.execute_command."+folder_uri);
		}
	} catch(e) {
		// ok pref doesn't exist yet.
	}
	try {
		cur_pref = prefs.getCharPref("extensions.mailboxalert.command."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("command", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.command."+folder_uri);
		}
	} catch (e) {
		// ok pref doesn't exist yet
	}

	try {
		cur_pref = prefs.getBoolPref("extensions.mailboxalert.escape."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("escape", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.escape."+folder_uri);
		}
	} catch (e) {
		// ok pref doesn't exist yet
	}

	try {
		cur_pref = prefs.getBoolPref("extensions.mailboxalert.alert_for_children."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("alert_for_children", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.alert_for_children."+folder_uri);
		}
	} catch (e) {
		// ok pref doesn't exist yet
	}

	try {
		cur_pref = prefs.getBoolPref("extensions.mailboxalert.no_alert_to_parent."+folder_uri);
		if (MailboxAlert.isDefaultPrefValue("no_alert_to_parent", cur_pref)) {
			prefs.clearUserPref("extensions.mailboxalert.no_alert_to_parent."+folder_uri);
		}
	} catch (e) {
		// ok pref doesn't exist yet
	}

}

MailboxAlert.FolderListener = function ()
{
	// empty constructor
}

MailboxAlert.FolderListener.prototype =
{
	OnItemAdded: function(parentItem, item)
	{
		const MSG_FOLDER_FLAG_OFFLINE = 0x8000000;

		var folder = parentItem.QueryInterface(Components.interfaces.nsIMsgFolder);
		var message;
		/*
		dump("item added\n");
		dump(folder);
		dump("\n");
		*/
		try {
			item.QueryInterface(Components.interfaces.nsIMsgDBHdr, message);
			MailboxAlert.addToQueue(folder, item);
		}
		catch (exception) {
			/* maybe it is a folder not a message */
			try {
				var folder2 = item.QueryInterface(Components.interfaces.nsIMsgFolder);
				dump("IT WAS A FOLDER! te weten: ");
				dump(MailboxAlert.getFullFolderName(folder2));
				dump("\n");
				dump("en ik had nog:\n");
				dump(MailboxAlert.getFullFolderName(folder));
				dump("\n");
				dump("en dat was een: "+parentItem+"\n");
				var rdf = item.QueryInterface(Components.interfaces.nsIRDFResource);
				dump("met waarde: "+rdf.Value+"\n");
				dump("heb ik nog iets selected?\n");
				dump("window: "+window);
				dump("selectedfolder: "+window.GetSelectedFolderURI()+"\n");
				dump("selectedfolder2: "+window.parent.GetSelectedFolderURI()+"\n");
				dump("selectedfolder3: "+window.parent.parent.GetSelectedFolderURI()+"\n");
			} catch (exception2) {
				dump("[mailboxalert] Exception: " + exception2 + "\n");
				dump("the item was: " + item + "\n");
			}			
		}
	}

}

MailboxAlert.FolderNameChangeListener = function ()
{
	// empty constructor
}

MailboxAlert.FolderNameChangeListener.prototype =
{
	OnItemEvent: function(parentItem, event)
	{
		if (event == "RenameCompleted") {
			var folder = parentItem.QueryInterface(Components.interfaces.nsIMsgFolder);
			dump("Event! ");
			dump(event);
			dump("\n");
			dump("Folder: ");
			dump(MailboxAlert.getFullFolderName(folder));
			dump("\n");
		}
	}
}

MailboxAlert.FolderAChanged = function () {
	// empty constructor
}

MailboxAlert.FolderAChanged.prototype =
{
	OnItemAdded: function(parentItem, item)
	{
		dump("ALL ITEM ADDED\n");
		dump("parentItem: " + parentItem + "\n");
		dump("item: " + item + "\n");
	}
}

MailboxAlert.FolderBChanged = function () {
	// empty constructor
}

MailboxAlert.FolderBChanged.prototype =
{
	OnItemBoolPropertyChanged: function(item, property, oldValue, newValue)
	{
		dump("BOOL PROPERTY CHANGED\n");
		dump("item: "+item+"\n");
		dump("property: "+property+"\n");
		dump("old value: "+oldValue+"\n");
		dump("new value: "+newValue+"\n");
	}
}

MailboxAlert.FolderCChanged = function () {
	// empty constructor
}

MailboxAlert.FolderCChanged.prototype =
{
	OnItemEvent: function(item , event)
	{
        if(event == "RenameCompleted" && MailboxAlert.renamed_folder) {
            dump("ITEM EVENT\n");
            dump("item: "+item+"\n");
            dump("event: "+event+"\n");
            dump("that's folder: ");
            dump(MailboxAlert.getFullFolderName(item));
            dump("\n");
            dump("that's probably the renamed folder from: ");
            dump(MailboxAlert.renamed_folder);
            dump("\n");
            MailboxAlert.copyFolderPrefs(MailboxAlert.renamed_folder, item.URI, true);
            MailboxAlert.renamed_folder = null;
        }
// handle rename
// ok done
	}
}

MailboxAlert.FolderDChanged = function () {
	// empty constructor
}

MailboxAlert.FolderDChanged.prototype =
{
	OnItemIntPropertyChanged: function(item, property, oldValue, newValue)
	{
		dump("ITEMINTPROPERTYCHANGED\n");
		dump("item: "+item+"\n");
		dump("property: "+property+"\n");
		dump("oldValue: "+oldValue+"\n");
		dump("newValue: "+newValue+"\n");
	}
}

MailboxAlert.FolderEChanged = function () {
	// empty constructor
}

MailboxAlert.FolderEChanged.prototype =
{
	OnItemPropertyChanged: function (item, property, oldValue, newValue )
	{
		dump("ITEMPROPERTYCHANGED\n");
		dump("item: "+item+"\n");
		dump("property: "+property+"\n");
		dump("oldValue: "+oldValue+"\n");
		dump("newValue: "+newValue+"\n");
	}
}

MailboxAlert.FolderFChanged = function () {
	// empty constructor
}

MailboxAlert.FolderFChanged.prototype =
{
	OnItemPropertyFlagChanged: function (item, property, oldFlag, newFlag )
	{
		dump("ITEMPROPERTYFLAGCHANGED\n");
		dump("item: "+item+"\n");
		dump("property: "+property+"\n");
		dump("oldFlag: "+oldFlag+"\n");
		dump("newFlag: "+newFlag+"\n");
	}
}

MailboxAlert.FolderGChanged = function () {
	// empty constructor
}

MailboxAlert.FolderGChanged.prototype =
{
	OnItemRemoved: function (parentItem, item)
	{
		//dump("ITEMREMOVED\n");
		//dump("parentItem: "+parentItem+"\n");
		//dump("item: "+item+"\n");
		if (item) {
			try {
				var rdf = item.QueryInterface(Components.interfaces.nsIRDFResource);
				//dump("RDF: "+rdf.Value+"\n");
				MailboxAlert.renamed_folder = rdf.Value;
				//dump("SET RENAMED FOLDER: "+MailboxAlert.renamed_folder+"\n");
			} catch (exception) {
				/*
				dump("[mailboxalert] exception trying to remember removed/renamed folder: ");
				dump(exception);
				dump("\n");
				*/
			}
		}
	}
}

MailboxAlert.FolderHChanged = function () {
	// empty constructor
}

MailboxAlert.FolderHChanged.prototype =
{
	OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue)
	{
		dump("ITEMUNICHARPROPERTYCHANGED\n");
		dump("item: "+item+"\n");
		dump("property: "+property+"\n");
		dump("oldValue: "+oldValue+"\n");
		dump("newValue: "+newValue+"\n");

		try {
			var folder = item.QueryInterface(Components.interfaces.nsIMsgFolder);
			dump("folder: ");
			dump(folder);
			dump("\n");
			dump("folder: ");
			dump(MailboxAlert.getFullFolderName(folder, true));
			dump("\r\n");
//    var msgFolder = window.parent.GetMsgFolderFromUri(folderURI, true);
			/* it's always the selected folder (?) */
			/* so get the preferences for the old, save them as new, and remove the old */
			dump("Window: ");
			dump(window);
			dump("\n");
		} catch (exception) {
			dump("exception trying to get folder: ");
			dump(exception);
			dump("\n");
		}
	}
}

MailboxAlert.checkOldSettings_folder = function (folder) {
	// check folder
	//dump("Check folder: "+MailboxAlert.getFullFolderName(folder)+"\n");
	if (folder) {
		//var subFolders = folder.GetSubFolders();
		var subFolders = folder.subFolders;
		MailboxAlert.copyFolderPrefs(MailboxAlert.getFullFolderName(folder, true), folder.URI, true);
		MailboxAlert.checkDefaultFolderPrefs(folder.URI);
		if (subFolders) {
			try {
				//subFolders.first();
				while (!subFolders.isDone()) {
					var nextFolder = subFolders.currentItem().QueryInterface(Components.interfaces.nsIMsgFolder);
					if (nextFolder) {
						MailboxAlert.checkOldSettings_folder(nextFolder);
					}
					subFolders.next();
				}
			} catch(exception) {
				/*
				dump("exception iterating through subfolders\n");
				dump("of folder: "+MailboxAlert.getFullFolderName(folder)+"\n");
				dump("uri: "+folder.URI+"\n");
				dump(exception);
				dump("subf: "+subFolders);
				dump("\n");
				dump("isdone: "+subFolders.isDone()+"\n");
				*/
			}
		}
	}
}

gMessengerBundle = document.getElementById("bundle_messenger");

MailboxAlert.checkOldSettings = function () {

        var allServers = accountManager.allServers;
        var i;

        for (i = 0; i < allServers.Count(); ++i) {
        	var currentServer = allServers.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer);
		var rootFolder = currentServer.rootFolder;
		if (rootFolder) {
			MailboxAlert.checkOldSettings_folder(rootFolder);
		}
	}
}

MailboxAlert.onLoad = function ()
{
	// remove to avoid duplicate initialization
	removeEventListener("load", MailboxAlert.onLoad, true);

//	Components.classes[mailSessionContractID]
	Components.classes["@mozilla.org/messenger/services/session;1"]
	.getService(Components.interfaces.nsIMsgMailSession)
	.AddFolderListener(new MailboxAlert.FolderListener(),
	Components.interfaces.nsIFolderListener.added);

//	Components.classes[mailSessionContractID]
//	.getService(Components.interfaces.nsIMsgMailSession)
//	.AddFolderListener(new MailboxAlert.FolderNameChangeListener(),
//	Components.interfaces.nsIFolderListener.event);

/*
	//Components.classes[mailSessionContractID]
	Components.classes["@mozilla.org/messenger/services/session;1"]
	.getService(Components.interfaces.nsIMsgMailSession)
	.AddFolderListener(new MailboxAlert.FolderAChanged(),
	Components.interfaces.nsIFolderListener.added);

	//Components.classes[mailSessionContractID]
	Components.classes["@mozilla.org/messenger/services/session;1"]
	.getService(Components.interfaces.nsIMsgMailSession)
	.AddFolderListener(new MailboxAlert.FolderBChanged(),
	Components.interfaces.nsIFolderListener.boolPropertyChanged);
*/
//	Components.classes[mailSessionContractID]
	Components.classes["@mozilla.org/messenger/services/session;1"]
	.getService(Components.interfaces.nsIMsgMailSession)
	.AddFolderListener(new MailboxAlert.FolderCChanged(),
	Components.interfaces.nsIFolderListener.event);

/*
	//Components.classes[mailSessionContractID]
	Components.classes["@mozilla.org/messenger/services/session;1"]
	.getService(Components.interfaces.nsIMsgMailSession)
	.AddFolderListener(new MailboxAlert.FolderDChanged(),
	Components.interfaces.nsIFolderListener.intPropertyChanged);

	//Components.classes[mailSessionContractID]
	Components.classes["@mozilla.org/messenger/services/session;1"]
	.getService(Components.interfaces.nsIMsgMailSession)
	.AddFolderListener(new MailboxAlert.FolderEChanged(),
	Components.interfaces.nsIFolderListener.propertyChanged);

	//Components.classes[mailSessionContractID]
	Components.classes["@mozilla.org/messenger/services/session;1"]
	.getService(Components.interfaces.nsIMsgMailSession)
	.AddFolderListener(new MailboxAlert.FolderFChanged(),
	Components.interfaces.nsIFolderListener.propertyFlagChanged);
*/

//	Components.classes[mailSessionContractID]
	Components.classes["@mozilla.org/messenger/services/session;1"]
	.getService(Components.interfaces.nsIMsgMailSession)
	.AddFolderListener(new MailboxAlert.FolderGChanged(),
	Components.interfaces.nsIFolderListener.removed);

/*
	//Components.classes[mailSessionContractID]
	Components.classes["@mozilla.org/messenger/services/session;1"]
	.getService(Components.interfaces.nsIMsgMailSession)
	.AddFolderListener(new MailboxAlert.FolderHChanged(),
	Components.interfaces.nsIFolderListener.unicharPropertyChanged);
*/

	// check if there are old settings (pre 0.11) to copy
	MailboxAlert.checkOldSettings();

	// check if we exited with muted on last time
	MailboxAlert.setMuteMenuitem(MailboxAlert.muted());

    var filterService = Components.classes["@mozilla.org/messenger/services/filters;1"]
                        .getService(Components.interfaces.nsIMsgFilterService);

    filterService.addCustomAction(MailboxAlert.filter_action);
}


addEventListener("load", MailboxAlert.onLoad, true);
