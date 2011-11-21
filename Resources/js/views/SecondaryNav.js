var _onDeviceRotation = function (e) {
    var _visibility = exports.view.visible;
    
    try {
        _titleLabel.width = app.styles.secondaryNavLabel.width;
        exports.leftButton.left = app.styles.secondaryNavButton.left;
        exports.rightButton.right = app.styles.secondaryNavButton.left;

        exports.view.width = app.styles.secondaryNavBar.width;
        exports.view.visible = _visibility || true;
    }
    catch (e) {
        Ti.API.error("Couldn't change views in SecondaryNavBar");
    }
};

Titanium.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], _onDeviceRotation);

exports.view = Titanium.UI.createView(app.styles.secondaryNavBar);

exports.leftButton = Titanium.UI.createButton(app.styles.secondaryNavButton);
exports.leftButton.title = app.localDictionary.back;
exports.view.add(exports.leftButton);

exports.rightButton = Titanium.UI.createButton(app.styles.secondaryNavButton);
exports.rightButton.left = 'auto';
exports.rightButton.right = 10;
exports.view.add(exports.rightButton);

exports.titleLabel = Titanium.UI.createLabel(app.styles.secondaryNavLabel);
exports.view.add(exports.titleLabel);

