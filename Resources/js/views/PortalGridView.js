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


exports.states = {
    INCLUDED    : "Included",
    INITIALIZED : "Initialized",
    LOADING     : "Loading",
    COMPLETE    : "Complete",
    HIDDEN      : "Hidden"
};

exports.events = {
    STATE_CHANGE    : 'PortalCollectionViewStateChange'
};

var _completeWidth, _completeHeight, _numColumns, _leftPadding, _didLayoutCleanup = false, _state, _numGridItems = 0, _gridView, _gridItems = {}, styles, deviceProxy,
_ = require('/js/libs/underscore-min'),
app = require('/js/Constants'),
portalProxy = require('/js/models/PortalProxy');

exports.open = function () {
    styles = require('/js/style');
    deviceProxy = require('/js/models/DeviceProxy');
    
    _completeWidth = styles.gridItem.width + 2 * styles.gridItem.padding;
    _completeHeight = styles.gridItem.width + 2 * styles.gridItem.padding;
    _numColumns = Math.floor(deviceProxy.retrieveWidth(true) / _completeWidth);
    _leftPadding = Math.floor(((deviceProxy.retrieveWidth(true) - (_completeWidth * _numColumns))) / 2);
    
    exports.setState(exports.states.INITIALIZED);
};

exports.close = function () {
    _gridView = null;
};

exports.getState = function () {
    return _state;
};

exports.setState = function (newState) {
    _state = newState;
    Ti.App.fireEvent(exports.events['STATE_CHANGE'], {state: _state});
    
};

exports.getView = function () {
    if (!_gridView) _gridView = Titanium.UI.createScrollView(styles.homeGrid);
    
    _rearrangeGrid();
    return _gridView;
};

exports.updateModules = function (portlets) {
    Ti.API.debug('updateModules() in PortalGridView. portlets:'+JSON.stringify(portlets));
    var _portlets = portlets || [], _item;

    /*
    * In this method, we're comparing portlets from the portalProxy (Portal) with our local 
    * collection of portlets.
    * First we iterate through our local items, and see if they exist in the new array.
    * If not, we destroy them (which removes them from the view, and the _gridItems collection)
    * then we iterate through the latest correction from the portalProxy and add them if they don't exist.
    */
    _numGridItems = _portlets.length || 0;
    for (_item in _gridItems) {
        if (_gridItems.hasOwnProperty(_item)) {
            for (var j=0; j<_numGridItems; j++) {
                if ('fName' + _portlets[j].fname === _item) {
                    break;
                }
                else if (j == _numGridItems - 1) {
                    _gridItems[_item].destroy();
                }
            }
        }
    }
    
    for (var i=0; i<_numGridItems; i++) {
        //Place the item in the scrollview and listen for singletaps
        if (!_gridItems['fName' + _portlets[i].fname] || deviceProxy.isIOS()) {
            //Create the item, implicity add to local array, and explicitly assign sort order
            _gridView.add(_createGridItem(_portlets[i], i).view);
        }
        else {
            //We just need to tell the item its new sort order
            _gridItems['fName' + _portlets[i].fname].sortOrder = i;
            _gridItems['fName' + _portlets[i].fname].view.show();
            _gridItems['fName' + _portlets[i].fname].view.visible =true;
        }
    }
    
    _rearrangeGrid();
    _didLayoutCleanup = false;
};

exports.rotate = function (orientation) {
    _completeWidth = styles.gridItem.width + 2 * styles.gridItem.padding;
    _completeHeight = styles.gridItem.width + 2 * styles.gridItem.padding;
    _numColumns = Math.floor(deviceProxy.retrieveWidth(true) / _completeWidth);
    _leftPadding = Math.floor(((deviceProxy.retrieveWidth(true) - (_completeWidth * _numColumns))) / 2);
    _rearrangeGrid();
};

function _createGridItem (portlet, sortOrder) {
    // Create the container for the grid item
    var gridItem = {}, gridItemLabel, gridItemIcon, gridBadgeBackground, gridBadgeNumber,
    gridItemDefaults = _.clone(styles.gridItem), 
    gridItemIconDefaults, gridBadgeBackgroundDefaults, 
    gridBadgeNumberDefaults;
    gridItemDefaults.width = gridItemDefaults.width + 'dp';
    gridItemDefaults.height = gridItemDefaults.height + 'dp';
    gridItemDefaults.padding = gridItemDefaults.padding + 'dp';
    
    if ('fName'+portlet.fname in _gridItems) {
        _gridItems['fName'+portlet.fname].view.show();
        _gridItems['fName'+portlet.fname].sortOrder = sortOrder;
        return _gridItems['fName'+portlet.fname];
    }
    else {
        gridItem.view = Ti.UI.createView(gridItemDefaults);

        gridItem.view.portlet = portlet;
        gridItem.sortOrder = sortOrder;

        //Add a label to the grid item
        if (portlet.title) {
            var gridItemLabelDefaults = _.clone(styles.gridItemLabel);
            gridItemLabelDefaults.top += 'dp';
            gridItemLabelDefaults.text =  portlet.title.toLowerCase();
            gridItemLabel = Ti.UI.createLabel(gridItemLabelDefaults);
            gridItem.view.add(gridItemLabel);
        }

        //Add an icon to the grid item
        gridItemIconDefaults = _.clone(styles.gridIcon);
        
        gridItemIconDefaults.top += 'dp';
        gridItemIconDefaults.image = portalProxy.getIconUrl(portlet);
        gridItemIcon = Ti.UI.createImageView(gridItemIconDefaults);
        gridItemIcon.portlet = portlet;
        gridItem.view.add(gridItemIcon);

        // if the module has a new item count of more than zero (no new items)
        // add a badge number to the home screen icon
        if (portlet.newItemCount > 0) {
            gridBadgeBackground = Ti.UI.createImageView(styles.gridBadgeBackground);
            gridItem.view.add(gridBadgeBackground);

            gridBadgeNumberDefaults = styles.gridBadgeNumber;
            gridBadgeNumberDefaults.text = portlet.newItemCount;
            gridBadgeNumber = Ti.UI.createLabel(gridBadgeNumberDefaults);
            gridItem.view.add(gridBadgeNumber);
        }

        gridItem.view.visible = false;

        gridItem.destroy = function () {
            gridItem.view.hide();
            gridItem.view.visible = false;
            gridItem.sortOrder = -1;
        };
        
        gridItem.addEventListeners = function () {
            gridItemIcon.addEventListener("singletap", _onGridItemClick);
            // gridItemIcon.addEventListener("touchstart", _onGridItemPressDown);
            // gridItemIcon.addEventListener(deviceProxy.isAndroid() ? 'touchcancel' : 'touchend', _onGridItemPressUp);
        };
        
        gridItem.removeEventListeners = function () {
            try {
                gridItemIcon.removeEventListener("singletap", _onGridItemClick);
                // gridItemIcon.removeEventListener("touchstart", _onGridItemPressDown);
                // gridItemIcon.removeEventListener(deviceProxy.isAndroid() ? 'touchcancel' : 'touchend', _onGridItemPressUp);
            }
            catch (e) {
                Ti.API.error("Couldn't remove event listeners");
            }
        };
        
        gridItem.addEventListeners();
        
        _gridItems['fName'+portlet.fname] = gridItem;

        return gridItem;
    }
};

function _rearrangeGrid () {
    var _gridItem;
    
    for (_gridItem in _gridItems) {
        if (_gridItems.hasOwnProperty(_gridItem)) {
            _gridItems[_gridItem].view.top = (styles.gridItem.padding + Math.floor(_gridItems[_gridItem].sortOrder / _numColumns) * _completeHeight) + 'dp';
            _gridItems[_gridItem].view.left = (_leftPadding + styles.gridItem.padding + (_gridItems[_gridItem].sortOrder % _numColumns) * _completeWidth) + 'dp';
            _gridItems[_gridItem].view.show();
        }
    }
    
    exports.setState(_numGridItems > 0 ? exports.states.COMPLETE : exports.states.LOADING); 
};

function _onGridItemClick (e) {
    if (e.source.portlet.url) {
        Ti.App.fireEvent(app.events['SHOW_PORTLET'], e.source.portlet);
    }
    else {
        Ti.App.fireEvent(app.events['SHOW_WINDOW'], { newWindow: e.source.portlet.fname });
    }
};

function _onGridItemPressDown (e) {
    if(deviceProxy.isIOS()) {
        if (e.source.type === 'gridIcon') {
            e.source.getParent().opacity = styles.gridItem.pressOpacity;
        }
        else {
            e.source.opacity = styles.gridItem.pressOpacity;
        }
    }
};

function _onGridItemPressUp (e) {
    if(deviceProxy.isIOS()) {
        if (e.source.type === 'gridIcon') {
            e.source.getParent().setOpacity(1.0);
        }
        else {
            e.source.setOpacity(1.0);
        }
    }
}