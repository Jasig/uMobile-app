GlobalActivityIndicator = function (app) {
    var self = Ti.UI.createView(app.styles.globalActivityIndicator), init, dialog, messageLabel, bgHideAnimation, dialogHideAnimation, bgShowAnimation, dialogShowAnimation,
        ANIMATION_DURATION = 200;
    
    init = function () {
        dialog = Ti.UI.createView(app.styles.activityIndicatorDialog);
        self.add(dialog);
        
        messageLabel = Ti.UI.createLabel(app.styles.activityIndicatorMessage);
        messageLabel.text = app.localDictionary.loading;
        dialog.add(messageLabel);
        
        bgShowAnimation = Titanium.UI.createAnimation({
            opacity: 1.0,
            duration: ANIMATION_DURATION
        });
        
        dialogShowAnimation = Titanium.UI.createAnimation({
            // width: app.styles.activityIndicatorDialog.width,
            // height: app.styles.activityIndicatorDialog.height,
            transform: Titanium.UI.create2DMatrix({
                scale: 1.0
            }),
            opacity: 1.0,
            duration: ANIMATION_DURATION
        });
        
        bgHideAnimation = Titanium.UI.createAnimation({
            opacity: 0,
            duration: ANIMATION_DURATION
        });
        
        dialogHideAnimation = Titanium.UI.createAnimation({
            // width: app.styles.activityIndicatorDialog.width,
            // height: app.styles.activityIndicatorDialog.height,
            transform: Titanium.UI.create2DMatrix({
                scale: 0.5
            }),
            opacity: 0,
            duration: ANIMATION_DURATION
        });
        
        
    };
    
    self.loadingMessage = function (m) {
        Ti.API.info("loadingMessage() in GlobalActivityIndicator");
        if (typeof m == 'string') {
            Ti.API.debug("Setting activity indicator text to: " + m);
            messageLabel.text = m;
        }
        else {
            Ti.API.debug("Message isn't valid:" + m + ' ' + typeof m);
        }
    };
    
    self.resetDimensions = function () {
        self.top = app.styles.globalActivityIndicator.top;
        self.height = app.styles.globalActivityIndicator.height;
        self.width = app.styles.globalActivityIndicator.width;
    };
    
    self.showAnimate = function () {
        Ti.API.debug("showAnimate() in GlobalActivityIndicator");
        
        bgShowAnimation.addEventListener('complete', onBGShowComplete);
        dialogShowAnimation.addEventListener('complete', onDialogShowComplete);
        
        // self.opacity = 0;
        self.show();
        
        // dialog.width = Math.round(app.styles.activityIndicatorDialog.width * 0.5);
        // dialog.height = Math.round(app.styles.activityIndicatorDialog.height * 0.5);
        dialog.transform = Titanium.UI.create2DMatrix({
            scale: 0.5
        });
        dialog.opacity = 0;
        
        self.animate(bgShowAnimation);
    };
    
    self.hideAnimate = function () {
        Ti.API.debug("hideAnimate() in GlobalActivityIndicator");
        
        bgHideAnimation.addEventListener('complete', onBGHideComplete);
        dialogHideAnimation.addEventListener('complete', onDialogHideComplete);
        
        // self.opacity = 1;
        
        // dialog.width = Math.round(app.styles.activityIndicatorDialog.width * 0.5);
        // dialog.height = Math.round(app.styles.activityIndicatorDialog.height * 0.5);
        dialog.transform = Titanium.UI.create2DMatrix({
            scale: 1.0
        });
        dialog.opacity = 1.0;
        
        dialog.animate(dialogHideAnimation);
    };
    
    function onBGShowComplete () {
        Ti.API.debug("onBGComplete() in GlobalActivityIndicator");
        bgShowAnimation.removeEventListener('complete', onBGShowComplete);
        dialog.animate(dialogShowAnimation);
    }
    
    function onDialogShowComplete () {
        Ti.API.debug("onDialogComplete() in GlobalActivityIndicator");
        dialogShowAnimation.removeEventListener('complete', onDialogShowComplete);
    }
    
    function onBGHideComplete () {
        Ti.API.debug("onBGComplete() in GlobalActivityIndicator");
        bgHideAnimation.removeEventListener('complete', onBGHideComplete);
        self.hide();
    }
    
    function onDialogHideComplete () {
        dialogHideAnimation.removeEventListener('complete', onDialogHideComplete);
        self.animate(bgHideAnimation);
    }
    
    init();
    
    return self;
};