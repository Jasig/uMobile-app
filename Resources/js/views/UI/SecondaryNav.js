var leftButton, rightButton, view, titleLabel,
styles = require('/js/style'),
deviceProxy = require('/js/models/DeviceProxy'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];

exports.hide = function () {
    view.hide();
};

exports.show = function () {
    view.show();
};

exports.rotate = function (orientation) {
    var _visibility = view.visible;
    titleLabel.width = styles.secondaryNavLabel.width;
    leftButton.left = styles.secondaryNavButton.left;
    rightButton.left = deviceProxy.retrieveWidth(true) - rightButton.getWidth - styles.secondaryNavButton.getLeft + 'dp'; //Had to do it this way so Android wouldn't stretch the button

    view.width = styles.secondaryNavBar.width;
    view.visible = _visibility || true;
};

view = Titanium.UI.createView(styles.secondaryNavBar);

leftButton = Titanium.UI.createButton(styles.secondaryNavButton);
leftButton.left = styles.secondaryNavButton.left;
leftButton.title = localDictionary.back;
view.add(leftButton);

rightButton = Titanium.UI.createButton(styles.secondaryNavButton);
rightButton.left = deviceProxy.retrieveWidth(true) - styles.secondaryNavButton.getWidth - styles.secondaryNavButton.getLeft + 'dp'; //Had to do it this way so Android wouldn't stretch the button
view.add(rightButton);

titleLabel = Titanium.UI.createLabel(styles.secondaryNavLabel);
view.add(titleLabel);

exports.view = view;
exports.leftButton = leftButton;
exports.rightButton = rightButton;
exports.titleLabel = titleLabel;