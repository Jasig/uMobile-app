/*
notification: {
    id: 0,
    level: 'Emergency',
    message: 'Stay inside.',
    unread: true
}
*/
function onNotificationsReceived (e) {
    Ti.API.debug('onNotificationsReceived'+e.source.responseText);
    var db, results, newNotifications = [];
    db = Titanium.Database.open('umobile');
    db.execute('CREATE TABLE IF NOT EXISTS "notifications" ("id" INTEGER UNIQUE, "created" DATE, "expireson" DATE, "level" TEXT, "message" TEXT, "unread" BOOLEAN, "expired" BOOLEAN)');
    
    results = JSON.parse(e.source.responseText).results;
    
    _.each(results, function (note, index, list) {
        Ti.API.debug('iteration note: '+note);
        var isRead = 0, isExpired = note.Expired || 0, dbResult = db.execute('SELECT * FROM "notifications" WHERE "id" IS ?', parseInt(note._id, 10));
        if (dbResult.rowCount < 1) {
            newNotifications.push(note);
        }
        else {
            isRead = dbResult.fieldByName('unread') === 1 ? 1 : 0;
        }
        dbResult.close();
        db.execute('REPLACE INTO notifications (id, created, expireson, level, message, unread, expired) VALUES (?,?,?,?,?,?,?)', note._id, note.Created || null, note.Expires || null, note.Level, note.Message, isRead, note.Expired);
    });
    db.close();
    // TODO: Make this event a globally-accessible constant
    Ti.App.fireEvent('NewNotifications', {notifications: newNotifications});
    Ti.API.debug('retrieveNotifications');
    Ti.API.debug(exports.retrieveNotifications());
}

function onNotificationsError (e) {
    Ti.API.debug('onNotificationsError'+e.source.responseText);
}
exports.updateNotifications = function () {
    // url = require('/js/config').BASE_PORTAL_URL + '/'
    url = 'http://localhost:3000/search/Notifications';
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
exports.saveViewedNote = function (id) {
    //TODO: Update the unread attribute to be false for the given id.
};