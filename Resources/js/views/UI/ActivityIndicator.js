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
    
    indicator.setLoadingMessage = function (m) {
        if (typeof m == 'string') {
            messageLabel.text = m;
        }
        else {
            Ti.API.error("Message isn't valid:" + m + ' ' + typeof m);
        }
    };
        
    return indicator;
};