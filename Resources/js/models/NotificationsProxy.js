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
/*
notification: {
    id: 0,
    level: 'Emergency',
    message: 'Stay inside.',
    unread: true
}
*/
var _ = require('/js/libs/underscore-min');
exports.notificationLevels = {
    EMERGENCY : "Emergency",
    URGENT : "Urgent",
    INFO : "Info",
    MESSAGE : "Message"
};
exports.notificationEvents = {
    UPDATED : "NotificationsUpdated"
};
function onNotificationsReceived (e) {
    var db, results, newNotifications = [];
    db = Titanium.Database.open('umobile');
    db.execute('CREATE TABLE IF NOT EXISTS "notifications" ("id" TEXT UNIQUE, "created" DATE, "expireson" DATE, "level" TEXT, "message" TEXT, "unread" BOOLEAN, "expired" BOOLEAN)');
    
    results = JSON.parse(e.source.responseText).results;
    
    _.each(results, function (note, index, list) {
        var isUnread = 1, isExpired = note.Expired || 0, dbResult = db.execute('SELECT * FROM "notifications" WHERE id= ?', note._id);
        if (dbResult.rowCount < 1) {
            newNotifications.push(note);
        }
        else {
            isUnread = Number(dbResult.fieldByName('unread'));
        }
        dbResult.close();
        db.execute('INSERT OR REPLACE INTO notifications (id, created, expireson, level, message, unread, expired) VALUES (?,?,?,?,?,?,?)', note._id, note.Created ? parseInt(note.Created, 10) : null, note.Expires ? parseInt(note.Expires, 10) : null, note.Level, note.Message, isUnread, note.Expired ? Number(note.Expired) : 0);
    });
    db.close();

    Ti.App.fireEvent(exports.notificationEvents['UPDATED']);
}

function onNotificationsError (e) {
    Ti.API.error('onNotificationsError'+e.source.responseText);
}
exports.updateNotifications = function () {
    var config = require('/js/config');
    if (!config.NOTIFICATIONS_ENABLED) return;

    url = config.NOTIFICATIONS_SERVICE;
    var xhr = Ti.Network.createHTTPClient({
        onload: onNotificationsReceived,
        onerror: onNotificationsError
    });
    xhr.open('GET', url);
    xhr.send();
};
exports.retrieveNotifications = function (limit, page, unreadOnly, showExpired) {
    //TODO: Implement limit and page.
    //TODO: Implement unreadOnly

    var db, dbResults, notifications = [];
    db = Titanium.Database.open('umobile');
    dbResults = db.execute('SELECT * FROM notifications');
    while (dbResults.isValidRow()) {
        var expiresOn = dbResults.fieldByName('expireson');
        if (!showExpired && dbResults.fieldByName('expired') !== 1) {
            if ((typeof expiresOn === 'number' && expiresOn > new Date().getTime()) || typeof expiresOn !== 'number') {
                notifications.push({
                    id: dbResults.fieldByName('id'),
                    created: dbResults.fieldByName('created'),
                    expireson: dbResults.fieldByName('expireson'),
                    level: dbResults.fieldByName('level'),
                    message: dbResults.fieldByName('message'),
                    unread: dbResults.fieldByName('unread'),
                    expired: dbResults.fieldByName('expired')
                });
            }
        }
        dbResults.next();
    }
    dbResults.close();
    db.close();

    return notifications;
};
exports.updateUnreadState = function (id, state) {
    var db, dbResults, unreadState;
    unreadState = Number(state);
    db = Titanium.Database.open('umobile');
    db.execute('UPDATE notifications SET unread=? WHERE id=?', unreadState, id);
    db.close();
};