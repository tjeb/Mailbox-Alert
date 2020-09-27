var alert_menu = document.getElementById('menupopup');
var all_alerts = MailboxAlert.getAllAlertPrefs();

MailboxAlertUtil.logMessage(0, "[MailboxAlert] BINDING INIT!!!\n");
for (var alert_i = 0; alert_i < all_alerts.length; ++alert_i) {
    var alert = all_alerts[alert_i];
    var alert_index = alert.index;
    alert_menuitem = MailboxAlert.createMenuItem(alert.get("name"), alert_index);
    alert_menu.appendChild(alert_menuitem);
}
