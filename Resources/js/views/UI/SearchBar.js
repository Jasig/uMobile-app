var searchBar, searchBarObject = {}, searchBarInput,
deviceProxy = require('/js/models/DeviceProxy'),
styles = require('/js/style');

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

exports.container = searchBarObject.container;
exports.input = searchBarObject.input;
exports.hide = function () {
    searchBarObject.container.hide();
};
exports.show = function () {
    searchBarObject.container.show();
};
exports.createSearchBar = function (opts) {
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
};

exports.rotate = function (orientation) {
    if (searchBar) { searchBar.width = styles.searchBar.width; }
    if (searchBarInput) { searchBarInput.width = styles.searchBarInput.width; }
};