var styles = require('/js/style'), _ = require('/js/libs/underscore-min');

exports.createTabbedBar = function () {
    var bar = {}, labels = [], _listeners = [], _numButtons = 0, _buttonsByIndex;
    
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
            var _buttonStyle = _.clone(styles.tabbedBarButton);
            _buttonsByIndex = [];
            
            //Let's cause the buttons to evenly fill 100% of the parent width
            var _buttonWidth = Math.floor(100 / _numButtons) + '%';
            
            for (var i=0; i<_numButtons; i++) {
                _buttonStyle.width = _buttonWidth;
                var _isLastButton = (i+1) === _numButtons ? true : false;
                _buttonStyle[_isLastButton ? 'right' : 'left'] = _isLastButton ? 0 : Math.floor(i * parseInt(_buttonWidth.replace('%', ''), 10)) + '%';
                _buttonStyle.title = labels[i];
                _buttonStyle.index = i;
                var _button = Ti.UI.createButton(_buttonStyle);
                _buttonsByIndex[i] = _button;
                
                _button.addEventListener("click", function (e) {
                    fireEvent("click", { index: e.source.index });
                });

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
            var l = _buttonsByIndex.length;
            while(l-- > 0) {
                //Let's enable all the buttons, except the active one.
                _buttonsByIndex[l].enabled = l == newIndex ? false : true;
            }
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
