var leftButton, rightButton, view, titleLabel;

var _onDeviceRotation = function (e) {
    var _visibility = view.visible;
    
    try {
        titleLabel.width = app.styles.secondaryNavLabel.width;
        leftButton.left = app.styles.secondaryNavButton.left;
        rightButton.right = app.styles.secondaryNavButton.left;

        view.width = app.styles.secondaryNavBar.width;
        view.visible = _visibility || true;
    }
    catch (e) {
        Ti.API.error("Couldn't change views in SecondaryNavBar");
    }
};

Titanium.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], _onDeviceRotation);

view = Titanium.UI.createView(app.styles.secondaryNavBar);

leftButton = Titanium.UI.createButton(app.styles.secondaryNavBarButton);
leftButton.left = app.styles.secondaryNavBarButton.leftFloat;
leftButton.title = app.localDictionary.back;
view.add(leftButton);

rightButton = Titanium.UI.createButton(app.styles.secondaryNavButton);
rightButton.left = 'auto';
rightButton.right = 10;
view.add(rightButton);

titleLabel = Titanium.UI.createLabel(app.styles.secondaryNavLabel);
view.add(titleLabel);

exports.view = view;
exports.leftButton = leftButton;
exports.rightButton = rightButton;
exports.titleLabel = titleLabel;