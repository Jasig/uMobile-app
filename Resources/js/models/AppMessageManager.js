var _intents = {}, app = require('/js/Facade');
exports.register = function (intent, windowKey, portlet) {
    _intents[intent] = { window: windowKey };
    if (portlet) _intents[intent].portlet = portlet;
};

exports.broadcast = function (intent, payload) {
    if (!_intents[intent]) return false;
    windowData = { newWindow: _intents[intent].window, parameters: payload };
    if (_intents[intent].portlet) windowData.portlet = _intents[intent].portlet;
    return Ti.App.fireEvent(app.events[_intents[intent].portlet ? 'SHOW_PORTLET' : 'SHOW_WINDOW'], windowData);
};