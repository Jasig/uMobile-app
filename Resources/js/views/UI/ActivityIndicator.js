var messageLabel, indicator, dialog,
styles = require('/js/style'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];

indicator = {view: Ti.UI.createView(styles.globalActivityIndicator)};
exports.view = indicator.view;

dialog = Ti.UI.createView(styles.activityIndicatorDialog);
indicator.view.add(dialog);

messageLabel = Ti.UI.createLabel(styles.activityIndicatorMessage);
messageLabel.text = localDictionary.loading;
dialog.add(messageLabel);

exports.saveLoadingMessage = function (m) {
    if (typeof m == 'string') {
        messageLabel.text = m;
    }
    else {
        Ti.API.error("Message isn't valid:" + m + ' ' + typeof m);
    }
};

exports.rotate = function (orientation) {
    exports.resetDimensions();
};

exports.resetDimensions = function () {
    indicator.view.top = styles.globalActivityIndicator.top;
    indicator.view.height = styles.globalActivityIndicator.height;
    indicator.view.width = styles.globalActivityIndicator.width;
    dialog.width = styles.activityIndicatorDialog.width;
};

