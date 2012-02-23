/*
 * Licensed to Jasig under one or more contributor license
 * agreements. See the NOTICE file distributed with this work
 * for additional information regarding copyright ownership.
 * Jasig licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var _view, _guestNotificationLabel, _state, _previousState, _notifications, emergencyNote,
styles = require('/js/style'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')],
deviceProxy = require('/js/models/DeviceProxy'),
_ = require('/js/libs/underscore-min');;

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
exports.emergencyNote = function () {
    return emergencyNote || false;
};

exports.createView = function () {
    _view = Ti.UI.createView(styles.homeGuestNote);

    _guestNotificationLabel = Ti.UI.createLabel(styles.homeGuestNoteLabel);
    _guestNotificationLabel.touchEnabled = false;
    
    _view.add(_guestNotificationLabel);
};
exports.showGuestNote = function () {
    _view.backgroundGradient = styles.homeGuestNote.backgroundGradient;
    if (deviceProxy.isAndroid()) _view.backgroundImage = styles.homeGuestNote.backgroundImage;
    _guestNotificationLabel.text = localDictionary.viewingGuestLayout;
    _state = exports.states['GUEST_USER'];
};

exports.showPortalUnreachableNote = function () {
    _view.backgroundGradient = styles.homeGuestNote.backgroundGradient;
    if (deviceProxy.isAndroid()) _view.backgroundImage = styles.homeGuestNote.backgroundImage;
    _guestNotificationLabel.text = localDictionary.portalNotReachable;
    _state = exports.states['PORTAL_UNREACHABLE'];
};

exports.showNotificationSummary = function (notifications) {
    
    if (notifications && notifications.length > 0) {
        _notifications = notifications;
        _.each(_notifications, function (note, index, list){
            if (note.level === 'Emergency') emergencyNote = note;
        });
        if (emergencyNote) {
            Ti.App.fireEvent(exports.events['EMERGENCY_NOTIFICATION'], emergencyNote);
            _view.backgroundGradient = styles.homeGuestNote.emergencyBackgroundGradient;
            if (deviceProxy.isAndroid()) _view.backgroundImage = styles.homeGuestNote.emergencyBackgroundImage;
            _guestNotificationLabel.text = emergencyNote.message;
        }
        else {
            _view.backgroundGradient = styles.homeGuestNote.backgroundGradient;
            _guestNotificationLabel.text = localDictionary.notifications;
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