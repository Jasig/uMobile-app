/*
** @constructor
*/
var PortalGridView = function (facade) {
    var app = facade, _self = this, init, Styles, Device, Portal,
    completeWidth, completeHeight, _gridView, _gridItems =[], numColumns, leftPadding, gridViewDefaults,
    createGridItem, rearrangeGrid,
    onGridItemClick, onGridItemPressUp, onGridItemPressDown;
    
    init = function () {
        Styles = app.styles;
        Device = app.models.deviceProxy;
        Portal = app.models.portalProxy;
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
        
        Ti.App.addEventListener('dimensionchanges', rearrangeGrid);
        
        _gridView = Titanium.UI.createScrollView(Styles.homeGrid);
    };
    
    this.getGridView = function (options) {
        _gridView.height = options.isGuestLayout ? Styles.homeGrid.height - Styles.homeGuestNote.height : Styles.homeGrid.height;

        completeWidth = Styles.gridItem.width + 2 * Styles.gridItem.padding;
        completeHeight = Styles.gridItem.width + 2 * Styles.gridItem.padding;
        numColumns = Math.floor(Device.getWidth() / completeWidth);
        leftPadding = Math.floor(((Device.getWidth() - (completeWidth * numColumns))) / 2);
        
        return _gridView;
    };
    
    this.updateGrid = function (modules) {
        for (var i=0, iLength = modules.length; i<iLength; i++ ) {
            //Place the item in the scrollview and listen for singletaps
            _gridView.add(createGridItem(Styles.gridItem.padding + Math.floor(i / numColumns) * completeHeight, //Top
                leftPadding + Styles.gridItem.padding + (i % numColumns) * completeWidth, //Left
                modules[i]));
        }
        rearrangeGrid();
    };
    
    createGridItem = function (top, left, portlet) {
        // Create the container for the grid item
        var gridItem, gridItemLabel, gridItemIcon, gridBadgeBackground, gridBadgeNumber,
        gridItemDefaults = Styles.gridItem, gridItemIconDefaults, gridBadgeBackgroundDefaults, gridBadgeNumberDefaults;
        
        gridItem = Ti.UI.createView(gridItemDefaults);

        gridItem.portlet = portlet;

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
        
        _gridItems.push(gridItem);
        
        return gridItem;
    };
    
    rearrangeGrid = function (e) {
        for (var i=0, iLength = _gridItems.length; i<iLength; i++) {
            _gridItems[i].top = Styles.gridItem.padding + Math.floor(i / numColumns) * completeHeight;
            _gridItems[i].left = leftPadding + Styles.gridItem.padding + (i % numColumns) * completeWidth;
        };
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