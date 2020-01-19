"use strict";

// This is loaded into all XUL windows. Wrap in a block to prevent
// leaking to window scope.
{
  class MailboxAlertRuleactiontargetBase extends MozXULElement { }

  const updateParentNode = (parentNode) => {
    MailboxAlertUtil.logMessage(5, "updateParentNode: " + parentNode.nodeName);
    let attrs = parentNode.attributes;
    for (let i=0; i<attrs.length; i++) {
      let item = attrs.item(i);
      MailboxAlertUtil.logMessage(5, "updateParentNode attr: " + item.nodeName);
    }
    if (parentNode.hasAttribute("initialActionIndex")) {
      let actionIndex = parentNode.getAttribute("initialActionIndex");
      MailboxAlertUtil.logMessage(5, "updateParentNode has initialActionIndex " + actionIndex);
      let filterAction = gFilter.getActionAt(actionIndex);
      MailboxAlertUtil.logMessage(5, "filterAction: " + filterAction);
      MailboxAlertUtil.logMessage(5, "updateParentNode call init with action");
      parentNode.initWithAction(filterAction);
    }
    MailboxAlertUtil.logMessage(5, "updateParentNode remove button");
    parentNode.updateRemoveButton();
  };

  const printNodeAttrsRecurse = (parentNode, i) => {
    MailboxAlertUtil.logMessage(5, "NodeAttrsRecurse node: " + i + ": " + parentNode.nodeName);
    let attrs = parentNode.attributes;
    for (let i=0; i<attrs.length; i++) {
      let item = attrs.item(i);
      MailboxAlertUtil.logMessage(5, "    attr: " + item.nodeName);
    }
    if (parentNode.parentNode) {
      printNodeAttrsRecurse(parentNode.parentNode, i+1)
    }
  };


class MozRuleactiontargetFilteralert extends MailboxAlertRuleactiontargetBase {
  connectedCallback() {
    if (this.delayConnectedCallback()) {
      return;
    }
    this.textContent = "";
    this.appendChild(MozXULElement.parseXULToFragment(`
      <menulist flex="1" class="ruleactionitem" inherits="disabled"
                onchange="this.parentNode.updateValue(this);"
                oncommand="this.parentNode.updateValue(this);"
      >
        <menupopup></menupopup>
      </menulist>
    `));

    //var alert_menu = document.getAnonymousNodes(this)[0].menupopup;
    let alert_menu = this.getElementsByTagName('menulist')[0];
    let value = alert_menu.value;
    let alert_menupopup= alert_menu.menupopup;
    let all_alerts = MailboxAlert.getAllAlertPrefs();
    for (var alert_i = 0; alert_i < all_alerts.length; ++alert_i) {
      let alert = all_alerts[alert_i];
      let alert_index = alert.index;
      let alert_menuitem = MailboxAlert.createMenuItem(alert.get("name"), alert_index);
      MailboxAlertUtil.logMessage(5, "add " + alert.get("name") + " to menu");
      alert_menupopup.appendChild(alert_menuitem);
    }
    updateParentNode(this.closest(".ruleaction"));
  }
  
  updateValue(element) {
    element.parentNode.setAttribute('value', element.value);
    element.parentNode.value=element.value;
  }
}

// Patch the relevant RuleAction item, so that our own content
// can be provided
function patchTarget() {
  let wrapper = customElements.get("ruleactiontarget-wrapper");
  if (!wrapper) {
      return;
  }
  // only want to patch it once
  let alreadyPatched = wrapper.prototype.hasOwnProperty("_MailboxAlertPatched") ?
                       wrapper.prototype._patchedByFiltaQuillaExtension :
                       false;
  if (alreadyPatched) {
    // already patched
    return;
  }
  let prevMethod = wrapper.prototype._getChildNode;
  MailboxAlertUtil.logMessage(5, "prevMethod: " + prevMethod);
  if (prevMethod) {
    wrapper.prototype._getChildNode = function(type) {
      if (type == 'mailboxalert@tjeb.nl#mailboxalertfilter') {
        return document.createXULElement('ruleactiontarget-filteralert');
      } else {
        return prevMethod(type);
      }
    };
    wrapper.prototype._MailboxAlertPatched = true;
  }
}

customElements.define("ruleactiontarget-filteralert", MozRuleactiontargetFilteralert);
patchTarget();
}
