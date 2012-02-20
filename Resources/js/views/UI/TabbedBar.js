var styles = require('/js/style');

exports.createTabbedBar = function () {
    var bar = {}, labels = [], _listeners = [], _numButtons = 0;
    
    function fireEvent (event, object) {
        for (var i=0, iLength = _listeners.length; i<iLength; i++) {
            if(_listeners[i].event === event) {
                _listeners[i].handler(object);
            }
        }
    }
    
    bar.view = Ti.UI.createView(styles.mapButtonBar);

    bar.labels = labels;
    bar.doSetLabels = function (newLabels) {
        if (typeof newLabels === "object") {
            labels = newLabels;
            _numButtons = labels.length;

            //Let's cause the buttons to evenly fill 90% of the parent
            var _buttonWidth = Math.floor(90 / _numButtons) + '%';
            Ti.API.debug('_buttonWidth in TabbedBar: '+_buttonWidth);
            Ti.API.debug('button.left in TabbedBar: '+Math.floor((10 / (_numButtons + 1))) + '%');

            for (var i=0; i<_numButtons; i++) {
                var _button = Ti.UI.createButton({
                    width: _buttonWidth,
                    color: "#000",
                    height: styles.mapButtonBar.getHeight - 5 + 'dp',
                    top: '5dp',
                    // left: (i * _buttonWidth) + ((i+1) * 10) + 'dp',
                    left: Math.floor((10 / (_numButtons + 1))) + '%',
                    title: labels[i],
                    index: i
                });
                (function(index){
                    _button.addEventListener("click", function (e) {
                        fireEvent("click",{ index: index });
                    });
                })(i);

                bar.view.add(_button);
            }
        }
    };

    bar.doSetWidth = function (newWidth) {
        if (typeof newWidth === "number") {
            bar.view.width = newWidth + 'dp';
        }
    };

    
    bar.doSetIndex = function (newIndex) {
        if (typeof newIndex === "number") {
            //TODO: Actually update the selected button based on the new index
            bar.index = parseInt(newIndex, 10);
        }
    };

    bar.addEventListener = function (event, handler) {
        if (typeof event === "string" && typeof handler === "function") {
            _listeners.push({event: event, handler: handler});
        }
        else {
            Ti.API.error("Arguments passed into addEventListener weren't the proper type");
        }

    };

    return bar;
};
