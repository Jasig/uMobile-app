var styles = require('/js/style'),
deviceProxy = require('/js/models/DeviceProxy'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];

exports.createSecondaryNav = function () {
    var navBar = {}, leftButton, rightButton, titleLabel;
    styles = styles.updateStyles();
    
    navBar.view = Titanium.UI.createView(styles.secondaryNavBar);

    leftButton = Titanium.UI.createButton(styles.secondaryNavButton);
    leftButton.left = styles.secondaryNavButton.left;
    leftButton.title = localDictionary.back;
    navBar.view.add(leftButton);

    rightButton = Titanium.UI.createButton(styles.secondaryNavButton);
    rightButton.left = deviceProxy.retrieveWidth(true) - styles.secondaryNavButton.plainWidth - styles.secondaryNavButton.plainLeft + 'dp'; //Had to do it this way so Android wouldn't stretch the button
    navBar.view.add(rightButton);

    titleLabel = Titanium.UI.createLabel(styles.secondaryNavLabel);
    navBar.view.add(titleLabel);

    navBar.leftButton = leftButton;
    navBar.rightButton = rightButton;
    navBar.titleLabel = titleLabel;
    
    navBar.hide = function () {
        //Couldn't directly alias view method in Android
        navBar.view.hide();
    };
    
    navBar.show = function() {
        //Couldn't directly alias view method in Android
        navBar.view.show();
    };
    
    navBar.rotate = function (orientation) {
        var _visibility = navBar.view.visible;
        styles = styles.updateStyles();
        titleLabel.width = styles.secondaryNavLabel.width;
        leftButton.left = styles.secondaryNavButton.left;
        rightButton.left = (deviceProxy.retrieveWidth(true) - rightButton.plainWidth - styles.secondaryNavButton.plainLeft);
        if (deviceProxy.isAndroid()) rightButton.left += 'dp'; //Had to do it this way so Android wouldn't stretch the button
        
        navBar.view.width = styles.secondaryNavBar.width;
        navBar.view.visible = _visibility || true;
    };
    
    return navBar;
};