var _view, _guestNotificationLabel, _state, _previousState;
exports.initialized = false;

exports.states = {
    GUEST_USER : "GuestUser",
    PORTAL_UNREACHABLE : "PortalUnreachable",
    NOTIFICATIONS_SUMMARY : "NotificationsSummary",
    NOTIFICATIONS_EXPANDED : "NotificationsExpanded",
    HIDDEN : "Hidden"
};

exports.view = function () {
    return _view;
};

exports.currentState = function () {
    return _state;
};

exports.createView = function () {
    _view = Ti.UI.createView(app.styles.homeGuestNote);
    exports.initialized = true;

    _guestNotificationLabel = Ti.UI.createLabel(app.styles.homeGuestNoteLabel);
    
    _view.add(_guestNotificationLabel);
};
exports.showGuestNote = function () {
    _guestNotificationLabel.text = app.localDictionary.viewingGuestLayout;
    _state = exports.states['GUEST_USER'];
};

exports.showPortalUnreachableNote = function () {
    _guestNotificationLabel.text = app.localDictionary.portalNotReachable;
    _state = exports.states['PORTAL_UNREACHABLE'];
};

exports.showNotificationSummary = function (notifications) {
    if (notifications) {
        _guestNotificationLabel.text = app.localDictionary.notifications;
    }
    else {
        _guestNotificationLabel.text = app.localDictionary.notifications;
    }
    _state = exports.states['NOTIFICATIONS_SUMMARY'];
};
exports.showNotificationsList = function () {
    //TODO: Implement this.
};

exports.hideNotificationsList = function () {
    //TODO: Implement this.
};

exports.show = function () {
    if (_state === exports.states['HIDDEN'] && _previousState) _state = _previousState;
    _view.show();
};

exports.hide = function () {
    if (_view) _view.hide();
    _previousState = _state;
    _state = exports.states['HIDDEN'];
};