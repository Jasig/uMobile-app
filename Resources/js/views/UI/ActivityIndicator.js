var messageLabel, indicator, dialog;

indicator = {view: Ti.UI.createView(app.styles.globalActivityIndicator)};
exports.view = indicator.view;

dialog = Ti.UI.createView(app.styles.activityIndicatorDialog);
indicator.view.add(dialog);

messageLabel = Ti.UI.createLabel(app.styles.activityIndicatorMessage);
messageLabel.text = app.localDictionary.loading;
dialog.add(messageLabel);

exports.saveLoadingMessage = function (m) {
    if (typeof m == 'string') {
        messageLabel.text = m;
    }
    else {
        Ti.API.error("Message isn't valid:" + m + ' ' + typeof m);
    }
};

exports.clear = function () {
    indicator.view = null;
    dialog = null;
    indicator = null;
};

exports.rotate = function (orientation) {
    exports.resetDimensions();
};

exports.resetDimensions = function () {
    indicator.view.top = app.styles.globalActivityIndicator.top;
    indicator.view.height = app.styles.globalActivityIndicator.height;
    indicator.view.width = app.styles.globalActivityIndicator.width;
    dialog.width = app.styles.activityIndicatorDialog.width;
};

