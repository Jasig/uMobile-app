var SecondaryNav = function () {
    _self = this;
};

// Global facade
SecondaryNav.prototype._app;

// The main view container for the secondary nav bar
SecondaryNav.prototype.view;

// The left button, typically "back" for the secondary nav bar
SecondaryNav.prototype.leftButton;
SecondaryNav.prototype._leftButtonClickHandler = function (e) {
    _self.view.fireEvent("LeftButtonClick");
};

// Centered title label
SecondaryNav.prototype.titleLabel;

SecondaryNav.prototype._onDeviceRotation = function (e) {
    var _visibility = _self.view.visible;
    
    _self._titleLabel.width = _self._app.styles.secondaryNavLabel.width;
    _self.leftButton.left = _self.app.styles.secondaryNavButton.left;
    
    _self.view.width = _self._app.styles.secondaryNavBar.width;
    _self.view.visible = _visibility || true;
};

SecondaryNav.prototype.init = function (facade) {
    _self._app = facade;
    Titanium.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], _self._onDeviceRotation);

    _self.view = Titanium.UI.createView(_self._app.styles.secondaryNavBar);
    
    _self.leftButton = Titanium.UI.createButton(_self._app.styles.secondaryNavButton);
    _self.leftButton.addEventListener('click', _self._leftButtonClickHandler);
    _self.view.add(_self.leftButton);
    
    _self.titleLabel = Titanium.UI.createLabel(_self._app.styles.secondaryNavLabel);
    _self.view.add(_self.titleLabel);
};