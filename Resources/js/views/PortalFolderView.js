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

var _state, _folders, portletListViewsByFolder = {}, view, activeFolder,
styles, deviceProxy, _, app, portalProxy;

exports.open = function () {
    Ti.API.debug('exports.open() in PortalFolderView');
    styles = require('/js/style');
    deviceProxy = require('/js/models/DeviceProxy');
    _ = require('/js/libs/underscore-min');
    app = require('/js/Constants');
    portalProxy = require('/js/models/PortalProxy');
    
    view = Titanium.UI.createScrollView(styles.portalFolderView);
};

exports.close = function () {
    
};

exports.rotate = function (orientation, specialLayout) {
    styles = styles.updateStyles();
    //Just update the height of the main table.
    exports.resizeView(specialLayout);
};

function showPortletsByFolder (folderId) {
    activeFolder = folderId;
    for (var _view in portletListViewsByFolder) {
        if (portletListViewsByFolder.hasOwnProperty(_view)) {
            portletListViewsByFolder[_view].hide();
        }
    }
    portletListViewsByFolder[folderId].show();
}
function onFolderClick (e) {
    Ti.API.debug('onFolderClick() in PortalFolderView. folderId:'+e.source.folderId);
}

function onPortletClick(e) {
    Ti.API.debug('onPortletClick() in PortalFolderView. portlet fname:'+e.source.portlet.fname);

    if (e.source.portlet.url) {
        Ti.App.fireEvent(app.events['SHOW_PORTLET'], e.source.portlet);
    }
    else {
        Ti.App.fireEvent(app.events['SHOW_WINDOW'], { newWindow: e.source.portlet.fname });
    }
}

function updateFolderListView(folders) {
    exports.setState(exports.states['LOADING']);
    
    //Remove all current views
    var l, i = view.children ? view.children.length : 0, _folderLabel, _folderHeaderView;
    
    while (i-- > 0) {
        if (view.children[i].folderId) view.children[i].removeEventListener('singletap', onFolderClick);
        if (view.children[i].portlet) view.children[i].removeEventListener('singletap', onPortletClick);
        view.remove(view.children[i]);
    }
    
    i = 0;
    l = folders.length;
    
    while (i++ != l) {
        _folderHeaderView = Ti.UI.createView(styles.portalFolderHeader);
        _folderHeaderView.folderId = folders[i-1].id;
        _folderHeaderView.addEventListener('singletap', onFolderClick);
        view.add(_folderHeaderView);
        
        _folderLabel = Ti.UI.createLabel(styles.portalFolderLabel);
        _folderLabel.text = folders[i-1].title;
        
        _folderHeaderView.add(_folderLabel);
        
        var j = 0, _portlets = portalProxy.getPortlets(folders[i-1].id), p = _portlets.length;
        if (_portlets.length > 0) {
            while (j++ != p) {
                var _portletRow = Ti.UI.createView(styles.portletRow);
                _portletRow.portlet = _portlets[j-1];
                
                _portletRow.addEventListener('singletap', onPortletClick);
                
                view.add(_portletRow);
                
                var _portletLabel = Ti.UI.createLabel(styles.portletRowLabel);
                _portletLabel.text = _portlets[j-1].title;
                
                _portletRow.add(_portletLabel);
                
                var _portletIcon = Ti.UI.createImageView(styles.portletRowIcon);
                _portletIcon.image = portalProxy.getIconUrl(_portlets[j-1]);
                _portletRow.add(_portletIcon);
                
            }
            
        }
    }
    
    //Then if there's a currentFolder that matches a currentFolder in the new array, show it.
    //Otherwise show the portlets for the first item in the folders array
    exports.setState(exports.states['COMPLETE']);
}

exports.updateModules = function (portlets) {
    //This method will be called whenever new portlets are loaded. 
    //The current view should be updated, but it should stay in the current context
    _folders = portalProxy.getFolderList();
    updateFolderListView(_folders);
    
};

exports.resizeView = function (_isSpecialLayout) {
    //Variable tells if the notifications bar is displayed or not
    view.height = _isSpecialLayout ? styles.homeGrid.heightWithNote : styles.homeGrid.height;
};

exports.getView = function () {
    return view;
};

exports.getState = function () {
    return _state;
};

exports.setState = function (newState) {
    _state = newState;
    Ti.App.fireEvent(exports.events['STATE_CHANGE'], {state: _state});
};
