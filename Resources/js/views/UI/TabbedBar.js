var labels = [], width, index, _listeners = [], _numButtons = 0;

exports.view = Ti.UI.createView(app.styles.mapButtonBar);

exports.labels = labels;
exports.doSetLabels = function (newLabels) {
    if (typeof newLabels === "object") {
        labels = newLabels;
        _numButtons = labels.length;

        var _buttonWidth = Math.floor((app.styles.mapButtonBar.getWidth - 10) / _numButtons) - 10;

        for (var i=0; i<_numButtons; i++) {
            var _button = Ti.UI.createButton({
                width: _buttonWidth + 'dp',
                color: "#000",
                height: app.styles.mapButtonBar.getHeight - 5 + 'dp',
                top: '5dp',
                left: (i * _buttonWidth) + ((i+1) * 10) + 'dp',
                title: labels[i],
                index: i
            });
            (function(index){
                _button.addEventListener("click", function (e) {
                    fireEvent("click",{ index: index });
                });
            })(i);
            
            exports.view.add(_button);
        }
    }
};

exports.width = width;
exports.doSetWidth = function (newWidth) {
    if (typeof newWidth === "number") {
        exports.view.width = newWidth + 'dp';
    }
};

exports.index = index;
exports.doSetIndex = function (newIndex) {
    if (typeof newIndex === "number") {
        //TODO: Actually update the selected button based on the new index
        index = parseInt(newIndex, 10);
    }
};

exports.addEventListener = function (event, handler) {
    if (typeof event === "string" && typeof handler === "function") {
        _listeners.push({event: event, handler: handler});
    }
    else {
        Ti.API.error("Arguments passed into addEventListener weren't the proper type");
    }
    
};

function fireEvent (event, object) {
    for (var i=0, iLength = _listeners.length; i<iLength; i++) {
        if(_listeners[i].event === event) {
            _listeners[i].handler(object);
        }
    }
}