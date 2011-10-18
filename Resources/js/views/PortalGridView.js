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
** @constructor
*/
var PortalGridView = function (facade) {
    var app = facade, _self = this;
    
    //Pseudo private variables
    this._completeWidth;
    this._completeHeight;
    this._numColumns;
    this._leftPadding;
    this._didLayoutCleanup = false;
    this._state;
    this._numGridItems = 0;
    
    //Pseudo private views
    this._gridView;
    this._gridItems = {};
    
    this._init = function () {
        _self._completeWidth = app.styles.gridItem.width + 2 * app.styles.gridItem.padding;
        _self._completeHeight = app.styles.gridItem.width + 2 * app.styles.gridItem.padding;
        _self._numColumns = Math.floor(app.models.deviceProxy.getWidth() / _self._completeWidth);
        _self._leftPadding = Math.floor(((app.models.deviceProxy.getWidth() - (_self._completeWidth * _self._numColumns))) / 2);
        
        Ti.App.addEventListener(ApplicationFacade.events['STYLESHEET_UPDATED'], this._onRotation);
        Ti.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], this._onOrientationChange);
        Ti.App.addEventListener(ApplicationFacade.events['LAYOUT_CLEANUP'], this._onLayoutCleanup);
        
        _self._gridView = Titanium.UI.createScrollView(app.styles.homeGrid);
        
        _self.setState(PortalGridView.states.INITIALIZED);
    };
    
    this.getState = function () {
        return _self._state;
    };
    
    this.setState = function (newState) {
        _self._state = newState;
        Ti.App.fireEvent(PortalGridView.events['STATE_CHANGE'], {state: _self._state});
        
    };
    
    this.getGridView = function () {
        if (_self._didLayoutCleanup || !_self._gridView) {
            _self._gridView = Titanium.UI.createScrollView(app.styles.homeGrid);
        }
        this._rearrangeGrid();
        return _self._gridView;
    };
    
    this.updateGrid = function (portlets) {
        var _portlets = portlets || [], _item;

        /*
        * In this method, we're comparing portlets from the portalProxy (Portal) with our local 
        * collection of portlets.
        * First we iterate through our local items, and see if they exist in the new array.
        * If not, we destroy them (which removes them from the view, and the _gridItems collection)
        * then we iterate through the latest correction from the portalProxy and add them if they don't exist.
        */
        _self._numGridItems = _portlets.length || 0;
        for (_item in _self._gridItems) {
            if (_self._gridItems.hasOwnProperty(_item)) {
                for (var j=0; j<_self._numGridItems; j++) {
                    if ('fName' + _portlets[j].fname === _item) {
                        // Ti.API.debug("Not destroying: " + _item);
                        break;
                    }
                    else if (j == _self._numGridItems - 1) {
                        // Ti.API.info("About to destroy" + _item + " & is destroy defined? " + _self._gridItems[_item].destroy);
                        _self._gridItems[_item].destroy();
                    }
                    else {
                        // Ti.API.info("Didn't destroy " + _item + " because it wasn't " + _portlets[j].fname);
                    }
                }
            }
        }
        
        for (var i=0; i<_self._numGridItems; i++ ) {
            //Place the item in the scrollview and listen for singletaps
            if (!_self._gridItems['fName' + _portlets[i].fname] || app.models.deviceProxy.isIOS()) {
                // Ti.API.debug("!_gridItems['fName' + _portlets[i].fname]");
                //Create the item, implicity add to local array, and explicitly assign sort order
                _self._gridView.add(this._createGridItem(_portlets[i], i).view);
            }
            else {
                // Ti.API.debug("else");
                //We just need to tell the item its new sort order
                _self._gridItems['fName' + _portlets[i].fname].sortOrder = i;
                _self._gridItems['fName' + _portlets[i].fname].view.show();
                _self._gridItems['fName' + _portlets[i].fname].view.visible =true;
                _self._gridItems['fName' + _portlets[i].fname].addEventListeners();
            }
        }
        
        this._rearrangeGrid();
        _self._didLayoutCleanup = false;
    };
    
    this._createGridItem = function (portlet, sortOrder) {
        // Create the container for the grid item
        var gridItem = {}, gridItemLabel, gridItemIcon, gridBadgeBackground, gridBadgeNumber,
        gridItemDefaults = app.styles.gridItem, gridItemIconDefaults, gridBadgeBackgroundDefaults, gridBadgeNumberDefaults;
        if ('fName'+portlet.fname in _self._gridItems) {
            _self._gridItems['fName'+portlet.fname].view.show();
            _self._gridItems['fName'+portlet.fname].sortOrder = sortOrder;
            return _self._gridItems['fName'+portlet.fname];
        }
        else {
            gridItem.view = Ti.UI.createView(gridItemDefaults);

            gridItem.view.portlet = portlet;
            gridItem.sortOrder = sortOrder;

            //Add a label to the grid item
            if (portlet.title) {
                var gridItemLabelDefaults = app.styles.gridItemLabel;
                gridItemLabelDefaults.text =  portlet.title.toLowerCase();
                gridItemLabel = Ti.UI.createLabel(gridItemLabelDefaults);
                gridItem.view.add(gridItemLabel);
            }

            //Add an icon to the grid item
            gridItemIconDefaults = app.styles.gridIcon;
            gridItemIconDefaults.image = app.models.portalProxy.getIconUrl(portlet);
            gridItemIcon = Ti.UI.createImageView(gridItemIconDefaults);
            gridItemIcon.portlet = portlet;
            gridItem.view.add(gridItemIcon);

            // if the module has a new item count of more than zero (no new items)
            // add a badge number to the home screen icon
            if (portlet.newItemCount > 0) {
                gridBadgeBackgroundDefaults = app.styles.gridBadgeBackground;
                gridBadgeBackground = Ti.UI.createImageView(gridBadgeBackgroundDefaults);
                gridItem.view.add(gridBadgeBackground);

                gridBadgeNumberDefaults = app.styles.gridBadgeNumber;
                gridBadgeNumberDefaults.text = portlet.newItemCount;
                gridBadgeNumber = Ti.UI.createLabel(gridBadgeNumberDefaults);
                gridItem.view.add(gridBadgeNumber);
            }

            gridItem.view.visible = false;

            gridItem.destroy = function () {
                Ti.API.info("Destroying GridItem!");
    /*            if (gridItem.view.getParent()) {
                    Ti.API.info("GridItem has a parent");
                    gridItem.view.getParent().remove(gridItem.view);
                    delete _self._gridItems['fName'+portlet.fname];
                }
                else {
                    Ti.API.error("gridItem doesn't have a parent");
                }*/
                gridItem.view.hide();
                gridItem.view.visible = false;
                gridItem.sortOrder = -1;
            };
            
            gridItem.addEventListeners = function () {
                gridItemIcon.addEventListener("singletap", _self._onGridItemClick);
                gridItemIcon.addEventListener("touchstart", _self._onGridItemPressDown);
                gridItemIcon.addEventListener(app.models.deviceProxy.isAndroid() ? 'touchcancel' : 'touchend', _self._onGridItemPressUp);
            };
            
            gridItem.removeEventListeners = function () {
                try {
                    gridItemIcon.removeEventListener("singletap", _self._onGridItemClick);
                    gridItemIcon.removeEventListener("touchstart", _self._onGridItemPressDown);
                    gridItemIcon.removeEventListener(app.models.deviceProxy.isAndroid() ? 'touchcancel' : 'touchend', _self._onGridItemPressUp);
                }
                catch (e) {
                    Ti.API.error("Couldn't remove event listeners");
                }
            };
            
            gridItem.addEventListeners();
            
            _self._gridItems['fName'+portlet.fname] = gridItem;

            return gridItem;
        }

    };
    
    this._rearrangeGrid = function (e) {
        var _gridItem;
        
        _self.resizeGrid((app.models.userProxy.isGuestUser() || !app.models.portalProxy.getIsPortalReachable()) ? true : false);
        
        for (_gridItem in _self._gridItems) {
            if (_self._gridItems.hasOwnProperty(_gridItem)) {
                _self._gridItems[_gridItem].view.top = app.styles.gridItem.padding + Math.floor(_self._gridItems[_gridItem].sortOrder / _self._numColumns) * _self._completeHeight;
                _self._gridItems[_gridItem].view.left = _self._leftPadding + app.styles.gridItem.padding + (_self._gridItems[_gridItem].sortOrder % _self._numColumns) * _self._completeWidth;
                _self._gridItems[_gridItem].view.show();
            }
        }
        
        _self.setState(_self._numGridItems > 0 ? PortalGridView.states.COMPLETE : PortalGridView.states.LOADING); 
    };
    
    this.destroy = function () {
        Ti.App.removeEventListener(ApplicationFacade.events['STYLESHEET_UPDATED'], this._onRotation);
        Ti.App.removeEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], this._onOrientationChange);
        Ti.App.removeEventListener(ApplicationFacade.events['LAYOUT_CLEANUP'], this._onLayoutCleanup);
        
        for (var _gridItem in _self._gridItems) {
            if (_self._gridItems.hasOwnProperty(_gridItems)) {
                _gridItem.removeEventListeners();
            }
        }
    };
    
    this.resizeGrid = function (_isSpecialLayout) {
        //Variable tells if the special layout indicator is displayed or not
         if (_isSpecialLayout) {
            if (app.models.deviceProxy.isAndroid()) {
                _self._gridView.height = Ti.Platform.displayCaps.platformHeight - app.styles.titleBar.height - app.styles.homeGuestNote.height - 25; //20 is the height of the status bar
            }
            else {
                _self._gridView.height = (Ti.UI.currentWindow ? Ti.UI.currentWindow.height : Ti.Platform.displayCaps.platformHeight - 20) - app.styles.titleBar.height - app.styles.homeGuestNote.height;
            }
        }
        else {
            if (app.models.deviceProxy.isAndroid()) {
                _self._gridView.height = Ti.Platform.displayCaps.platformHeight - app.styles.titleBar.height - 25;//25 is the size of the status bar.
            }
            else {
                _self._gridView.height = (Ti.UI.currentWindow ? Ti.UI.currentWindow.height : Ti.Platform.displayCaps.platformHeight - 20) - app.styles.titleBar.height;
            }
        }
    };
    
    this._onRotation = function (e) {
        _self._completeWidth = app.styles.gridItem.width + 2 * app.styles.gridItem.padding;
        _self._completeHeight = app.styles.gridItem.width + 2 * app.styles.gridItem.padding;
        _self._numColumns = Math.floor(app.models.deviceProxy.getWidth() / _self._completeWidth);
        _self._leftPadding = Math.floor(((app.models.deviceProxy.getWidth() - (_self._completeWidth * _self._numColumns))) / 2);
    };
    
    this._onLayoutCleanup = function (e) {
        Ti.API.debug("onLayoutCleanup() in PortalGridView");
        if (e.win === app.controllers.portalWindowController.key) {
            Ti.API.debug("current window is " + app.controllers.portalWindowController.key);
            _self._didLayoutCleanup = true;
            _self.setState(PortalGridView.states.HIDDEN);
        }
        else {
            Ti.API.debug("current window is NOT " + app.controllers.portalWindowController.key + ', it\'s ' + e.win);
        }
    };
    
    this._onOrientationChange = function (e) {
        if (app.models.windowManager.getCurrentWindow() === app.controllers.portalWindowController.key || app.models.deviceProxy.isAndroid()) {
            //If the device is Android, we always want to rearrange the grid to 
            //account for the back button circumventing the windowManager
            _self._rearrangeGrid();
        }
    };
    
    this._onGridItemClick = function (e) {
        var func;
        Ti.API.debug("onGridItemClick() in PortalGridView " + JSON.stringify(e.source.portlet));
        if (e.source.portlet) {
            func = app.models.portalProxy.getShowPortletFunc(e.source.portlet);
            func();
        }
        else {
            Ti.API.error("No portlet was attached to the icon.");
        }
    };
    
    this._onGridItemPressDown = function (e) {
        Ti.API.debug("Home button pressed down, source: " + e.source.type);
        if(app.models.deviceProxy.isIOS()) {
            if (e.source.type === 'gridIcon') {
                e.source.getParent().opacity = app.styles.gridItem.pressOpacity;
            }
            else {
                e.source.opacity = app.styles.gridItem.pressOpacity;
            }
        }
        else {
            Ti.API.debug("Not setting opacity of icon because Android doesn't support it.");
        }
    };

    this._onGridItemPressUp = function (e) {
        Ti.API.debug("Home button pressed up");
        if(app.models.deviceProxy.isIOS()) {
            if (e.source.type === 'gridIcon') {
                e.source.getParent().setOpacity(1.0);
            }
            else {
                e.source.setOpacity(1.0);
            }
        }
        else {
            Ti.API.debug("onGridItemPressUp condition wasn't met");
        }
    };
    
    this._init ();
};

PortalGridView.states = {
    INCLUDED    : "Included",
    INITIALIZED : "Initialized",
    LOADING     : "Loading",
    COMPLETE    : "Complete",
    HIDDEN      : "Hidden"
};

PortalGridView.events = {
    STATE_CHANGE    : 'PortalGridViewStateChange'
};