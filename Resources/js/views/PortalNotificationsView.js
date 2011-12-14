var _view, _guestNotificationLabel, _state, _previousState, _notifications, _initialized = false;

exports.initialized = function () {
    return _initialized;
};

exports.states = {
    GUEST_USER : "GuestUser",
    PORTAL_UNREACHABLE : "PortalUnreachable",
    NOTIFICATIONS_SUMMARY : "NotificationsSummary",
    NOTIFICATIONS_EXPANDED : "NotificationsExpanded",
    HIDDEN : "Hidden"
};

exports.events = {
    EMERGENCY_NOTIFICATION : "EmergencyNotification"
};

exports.view = function () {
    return _view;
};

exports.currentState = function () {
    return _state;
};

exports.createView = function () {
    _view = Ti.UI.createView(app.styles.homeGuestNote);
    _initialized = true;

    _guestNotificationLabel = Ti.UI.createLabel(app.styles.homeGuestNoteLabel);
    
    _view.add(_guestNotificationLabel);
};
exports.showGuestNote = function () {
    _view.backgroundGradient = app.styles.homeGuestNote.backgroundGradient;
    _guestNotificationLabel.text = app.localDictionary.viewingGuestLayout;
    _state = exports.states['GUEST_USER'];
};

exports.showPortalUnreachableNote = function () {
    _view.backgroundGradient = app.styles.homeGuestNote.backgroundGradient;
    _guestNotificationLabel.text = app.localDictionary.portalNotReachable;
    _state = exports.states['PORTAL_UNREACHABLE'];
};

exports.showNotificationSummary = function (notifications) {
    var _emergencyNote;
    
    if (notifications && notifications.length > 0) {
        _notifications = notifications;
        _.each(_notifications, function (note, index, list){
            if (note.level === 'Emergency') _emergencyNote = note;
        });
        if (_emergencyNote) {
            Ti.App.fireEvent(exports.events['EMERGENCY_NOTIFICATION'], _emergencyNote);
            _view.backgroundGradient = app.styles.homeGuestNote.emergencyBackgroundGradient;
            _guestNotificationLabel.text = _emergencyNote.message;
        }
        else {
            _view.backgroundGradient = app.styles.homeGuestNote.backgroundGradient;
            _guestNotificationLabel.text = app.localDictionary.notifications;
        }
    }
    else if (!_notifications || (_notifications && _notifications.length < 1)) {
        exports.hide();
        return;
    }
    
    _state = exports.states['NOTIFICATIONS_SUMMARY'];
    exports.show();
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