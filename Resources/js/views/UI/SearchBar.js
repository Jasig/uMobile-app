var deviceProxy = require('/js/models/DeviceProxy'),
styles = require('/js/style').updateStyles();
exports.createSearchBar = function (opts) {
    var searchBar, searchBarObject = {}, searchBarInput;
    styles = styles.updateStyles();
    
    if (deviceProxy.isIOS()) {
        searchBar = Titanium.UI.createSearchBar(styles.searchBar);
        searchBarObject.container = searchBar;
        searchBarObject.input = searchBar;
    }
    else {
        searchBar = Titanium.UI.createView(styles.searchBar);
        searchBarInput = Titanium.UI.createTextField(styles.searchBarInput);
        searchBar.add(searchBarInput);
        searchBarObject.container = searchBar;
        searchBarObject.input = searchBarInput;
    }
    
    searchBarObject.hide = searchBarObject.container.hide;
    searchBarObject.show = searchBarObject.container.show;
    
    if (!opts) {
        opts = {};
    }
    
    if (opts.cancel) {
        searchBarObject.input.addEventListener('cancel', opts.cancel);
    }
    if (opts.submit) {
        searchBarObject.input.addEventListener('return', opts.submit);
    }
    if (opts.change) {
        searchBarObject.input.addEventListener('change', opts.change);
    }

    searchBarObject.rotate = function (orientation) {
        styles = styles.updateStyles();
        if (searchBar) searchBar.width = styles.searchBar.width;
        if (searchBarInput) searchBarInput.width = styles.searchBarInput.width;
    };
    
    searchBarObject.hide = function () {
        //In Android, it didn't respect searchBarObject.hide = searchBar.hide;
        searchBar.hide();
    };
    searchBarObject.show = function () {
        searchBar.show();
    };
    
    return searchBarObject;
};