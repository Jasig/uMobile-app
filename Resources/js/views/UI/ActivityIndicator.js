var styles = require('/js/style'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];

exports.createActivityIndicator = function () {
    var messageLabel, indicator, dialog;
    styles = styles.updateStyles();
    indicator = {view: Ti.UI.createView(styles.globalActivityIndicator)};

    dialog = Ti.UI.createView(styles.activityIndicatorDialog);
    indicator.view.add(dialog);

    messageLabel = Ti.UI.createLabel(styles.activityIndicatorMessage);
    messageLabel.text = localDictionary.loading;
    dialog.add(messageLabel);
    
    indicator.saveLoadingMessage = function (m) {
        if (typeof m == 'string') {
            messageLabel.text = m;
        }
        else {
            Ti.API.error("Message isn't valid:" + m + ' ' + typeof m);
        }
    };
    
    indicator.rotate = function (orientation) {
        indicator.resetDimensions();
    };
    
    indicator.resetDimensions = function () {
        indicator.view.top = styles.globalActivityIndicator.top;
        indicator.view.height = styles.globalActivityIndicator.height;
        indicator.view.width = styles.globalActivityIndicator.width;
        dialog.width = styles.activityIndicatorDialog.width;
    };
    
    return indicator;
};