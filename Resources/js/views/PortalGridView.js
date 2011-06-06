/*
** @constructor
*/
var PortalGridView = function (facade) {
    var app = facade, _self = this, init, Styles, Device, Portal, User,
    completeWidth, completeHeight, _gridView, _gridItems = [], numColumns, leftPadding, gridViewDefaults, isGuestLayout,
    createGridItem, rearrangeGrid,
    onOrientationChange, onGridItemClick, onGridItemPressUp, onGridItemPressDown;
    
    init = function () {
        Styles = app.styles;
        Device = app.models.deviceProxy;
        Portal = app.models.portalProxy;
        User = app.models.userProxy;
        
        completeWidth = Styles.gridItem.width + 2 * Styles.gridItem.padding;
        completeHeight = Styles.gridItem.width + 2 * Styles.gridItem.padding;
        numColumns = Math.floor(Device.getWidth() / completeWidth);
        leftPadding = Math.floor(((Device.getWidth() - (completeWidth * numColumns))) / 2);
        
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
            completeWidth = Styles.gridItem.width + 2 * Styles.gridItem.padding;
            completeHeight = Styles.gridItem.width + 2 * Styles.gridItem.padding;
            numColumns = Math.floor(Device.getWidth() / completeWidth);
            leftPadding = Math.floor(((Device.getWidth() - (completeWidth * numColumns))) / 2);
        });
        
        Ti.App.addEventListener('dimensionchanges', onOrientationChange);
        
        _gridView = Titanium.UI.createScrollView(Styles.homeGrid);
    };
    
    this.getGridView = function (options) {
        return _gridView;
    };
    
    this.updateGrid = function () {
        var _portlets = Portal.getPortlets(), _item;

        /*
        * In this method, we're comparing portlets from the portalProxy (Portal) with our local 
        * collection of portlets.
        * First we iterate through our local items, and see if they exist in the new array.
        * If not, we destroy them (which removes them from the view, and the _gridItems collection)
        * then we iterate through the latest correction from the portalProxy and add them if they don't exist.
        */
        for (_item in _gridItems) {
            if (_gridItems.hasOwnProperty(_item)) {
                for (var j=0, jLength = _portlets.length; j<jLength; j++) {
                    if ('fName' + _portlets[j].fname === _item) {
                        break;
                    }
                    else if (j == jLength - 1) {
                        _gridItems[_item].destroy();
                    }
                }
                
            }
        }
        
        for (var i=0, iLength = _portlets.length; i<iLength; i++ ) {
            //Place the item in the scrollview and listen for singletaps
            if (!_gridItems['fName' + _portlets[i].fname]) {
                //Create the item, implicity add to local array, and explicitly assign sort order
                _gridView.add(createGridItem(_portlets[i], i));
            }
            else {
                //We just need to tell the item its new sort order
                _gridItems['fName' + _portlets[i].fname].sortOrder = i;
            }
        }
        
        rearrangeGrid();
    };
    
    createGridItem = function (portlet, sortOrder) {
        // Create the container for the grid item
        var gridItem, gridItemLabel, gridItemIcon, gridBadgeBackground, gridBadgeNumber,
        gridItemDefaults = Styles.gridItem, gridItemIconDefaults, gridBadgeBackgroundDefaults, gridBadgeNumberDefaults;
        
        gridItem = Ti.UI.createView(gridItemDefaults);

        gridItem.portlet = portlet;
        gridItem.sortOrder = sortOrder;

        //Add a label to the grid item
        if (portlet.title) {
            var gridItemLabelDefaults = Styles.gridItemLabel;
            gridItemLabelDefaults.text =  portlet.title.toLowerCase();
            gridItemLabel = Ti.UI.createLabel(gridItemLabelDefaults);
            gridItem.add(gridItemLabel);
        }

        //Add an icon to the grid item
        gridItemIconDefaults = Styles.gridIcon;
        gridItemIconDefaults.image = Portal.getIconUrl(portlet);
        gridItemIcon = Ti.UI.createImageView(gridItemIconDefaults);
        gridItemIcon.portlet = portlet;
        gridItem.add(gridItemIcon);
        
        // if the module has a new item count of more than zero (no new items)
        // add a badge number to the home screen icon
        if (portlet.newItemCount > 0) {
            gridBadgeBackgroundDefaults = Styles.gridBadgeBackground;
            gridBadgeBackground = Ti.UI.createImageView(gridBadgeBackgroundDefaults);
            gridItem.add(gridBadgeBackground);

            gridBadgeNumberDefaults = Styles.gridBadgeNumber;
            gridBadgeNumberDefaults.text = portlet.newItemCount;
            gridBadgeNumber = Ti.UI.createLabel(gridBadgeNumberDefaults);
            gridItem.add(gridBadgeNumber);
        }
        
        gridItemIcon.addEventListener("singletap", onGridItemClick);
        gridItemIcon.addEventListener("touchstart", onGridItemPressDown);
        gridItemIcon.addEventListener(Device.isAndroid() ? 'touchcancel' : 'touchend', onGridItemPressUp);
        
        gridItem.destroy = function () {
            Ti.API.info("Destroying GridItem!");
            if (gridItem.getParent()) {
                Ti.API.info("GridItem has a parent");
                gridItem.getParent().remove(gridItem);
                delete _gridItems['fName'+portlet.fname];
            }
            else {
                Ti.API.error("gridItem doesn't have a parent");
            }
        };
        
        _gridItems['fName'+portlet.fname] = gridItem;
        
        return gridItem;
    };
    
    rearrangeGrid = function (e) {
        var _gridItem;
        Ti.API.debug("rearrangeGrid() in PortalGridView");
        _gridView.height = User.isGuestUser() ? Styles.homeGrid.height - Styles.homeGuestNote.height : Styles.homeGrid.height;
        
        for (_gridItem in _gridItems) {
            if (_gridItems.hasOwnProperty(_gridItem)) {
                _gridItems[_gridItem].top = Styles.gridItem.padding + Math.floor(_gridItems[_gridItem].sortOrder / numColumns) * completeHeight;
                _gridItems[_gridItem].left = leftPadding + Styles.gridItem.padding + (_gridItems[_gridItem].sortOrder % numColumns) * completeWidth;
            }
            else {
                Ti.API.error("NOT _gridItems.hasOwnProperty(_gridItem)");
            }
        }
    };
    
    onOrientationChange = function (e) {
        rearrangeGrid();
    };
    
    onGridItemClick = function (e) {
        var func;
        Ti.API.debug("onGridItemClick() in PortalWindowController " + JSON.stringify(e.source.portlet));
        if (e.source.portlet) {
            func = Portal.getShowPortletFunc(e.source.portlet);
            func();
        }
        else {
            Ti.API.error("No portlet was attached to the icon.");
        }
    };
    
    onGridItemPressDown = function (e) {
        Ti.API.debug("Home button pressed down, source: " + e.source.type);
        if(Device.isIOS()) {
            if (e.source.type === 'gridIcon') {
                e.source.getParent().opacity = Styles.gridItem.pressOpacity;
            }
            else {
                e.source.opacity = Styles.gridItem.pressOpacity;
            }
        }
        else {
            Ti.API.debug("Not setting opacity of icon because Android doesn't support it.");
        }
    };

    onGridItemPressUp = function (e) {
        Ti.API.debug("Home button pressed up");
        if(Device.isIOS()) {
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
    
    init ();
};