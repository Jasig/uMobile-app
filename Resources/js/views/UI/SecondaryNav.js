var leftButton, rightButton, view, titleLabel;

exports.hide = function () {
    view.hide();
};

exports.show = function () {
    view.show();
};

exports.rotate = function (orientation) {
    var _visibility = view.visible;
    titleLabel.width = app.styles.secondaryNavLabel.width;
    leftButton.left = app.styles.secondaryNavButton.left;
    rightButton.left = app.models.deviceProxy.retrieveWidth(true) - rightButton.getWidth - app.styles.secondaryNavButton.getLeft + 'dp'; //Had to do it this way so Android wouldn't stretch the button

    view.width = app.styles.secondaryNavBar.width;
    view.visible = _visibility || true;
};

view = Titanium.UI.createView(app.styles.secondaryNavBar);

leftButton = Titanium.UI.createButton(app.styles.secondaryNavButton);
leftButton.left = app.styles.secondaryNavButton.left;
leftButton.title = app.localDictionary.back;
view.add(leftButton);

rightButton = Titanium.UI.createButton(app.styles.secondaryNavButton);
rightButton.left = app.models.deviceProxy.retrieveWidth(true) - app.styles.secondaryNavButton.getWidth - app.styles.secondaryNavButton.getLeft + 'dp'; //Had to do it this way so Android wouldn't stretch the button
view.add(rightButton);

titleLabel = Titanium.UI.createLabel(app.styles.secondaryNavLabel);
view.add(titleLabel);

exports.view = view;
exports.leftButton = leftButton;
exports.rightButton = rightButton;
exports.titleLabel = titleLabel;