GlobalActivityIndicator = function (app) {
    /*
        This is a view factory to create separate, but identical activity indicators 
        for the different controllers to indicate time-intensive activity to a user.
        The activity indicator is NOT hidden by default, so controllers need to hide
        it right away unless they want to show it. This is to keep it consistent with
        other view components that are always shown by default when added to another view.
    */
    this.createActivityIndicator = function () {
        var messageLabel,
            indicator = Ti.UI.createView(app.styles.globalActivityIndicator),
            dialog = Ti.UI.createView(app.styles.activityIndicatorDialog);

        indicator.add(dialog);
        
        messageLabel = Ti.UI.createLabel(app.styles.activityIndicatorMessage);
        messageLabel.text = app.localDictionary.loading;
        dialog.add(messageLabel);
        
        indicator.loadingMessage = function (m) {
            Ti.API.info("loadingMessage() in GlobalActivityIndicator");
            if (typeof m == 'string') {
                Ti.API.debug("Setting activity indicator text to: " + m);
                messageLabel.text = m;
            }
            else {
                Ti.API.debug("Message isn't valid:" + m + ' ' + typeof m);
            }
        };
        
        indicator.resetDimensions = function () {
            indicator.top = app.styles.globalActivityIndicator.top;
            indicator.height = app.styles.globalActivityIndicator.height;
            indicator.width = app.styles.globalActivityIndicator.width;
        };
        
        return indicator;
    };
};