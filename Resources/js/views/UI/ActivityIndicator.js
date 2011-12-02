var messageLabel,
    indicator = {view: Ti.UI.createView(app.styles.globalActivityIndicator)},
    dialog = Ti.UI.createView(app.styles.activityIndicatorDialog);

exports.view = indicator.view;

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
    Ti.App.removeEventListener(app.events['DIMENSION_CHANGES'], resetActivityIndicator);
};

exports.resetDimensions = function () {
    indicator.view.top = app.styles.globalActivityIndicator.top;
    indicator.view.height = app.styles.globalActivityIndicator.height;
    indicator.view.width = app.styles.globalActivityIndicator.width;
    dialog.width = app.styles.activityIndicatorDialog.width;
};

function resetActivityIndicator (e) {
    indicator.resetDimensions();
}
Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], resetActivityIndicator);