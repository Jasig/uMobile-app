var styles = require('/js/style'),
deviceProxy = require('/js/models/DeviceProxy'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];

exports.createSecondaryNav = function () {
    var navBar = {}, leftButton, rightButton, titleLabel;
    styles = styles.updateStyles();
    
    navBar.view = Titanium.UI.createView(styles.secondaryNavBar);

    leftButton = Titanium.UI.createButton(styles.secondaryNavButton);
    leftButton.left = styles.secondaryNavButton.plainLeft + 'dp';
    leftButton.title = localDictionary.back;
    navBar.view.add(leftButton);

    rightButton = Titanium.UI.createButton(styles.secondaryNavButton);
    rightButton.right = styles.secondaryNavButton.plainLeft + 'dp';
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
    
    return navBar;
};