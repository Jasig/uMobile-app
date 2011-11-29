var searchBar, searchBarObject = {}, searchBarInput;

if (app.models.deviceProxy.isIOS()) {
    searchBar = Titanium.UI.createSearchBar(app.styles.searchBar);
    searchBarObject.container = searchBar;
    searchBarObject.input = searchBar;
}
else {
    searchBar = Titanium.UI.createView(app.styles.searchBar);
    searchBarInput = Titanium.UI.createTextField(app.styles.searchBarInput);
    searchBar.add(searchBarInput);
    searchBarObject.container = searchBar;
    searchBarObject.input = searchBarInput;
}

exports.container = searchBarObject.container;
exports.input = searchBarObject.input;
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
    
    Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], function (e) {
        if (searchBar) { searchBar.width = app.styles.searchBar.width; }
        if (searchBarInput) { searchBarInput.width = app.styles.searchBarInput.width; }
    });
};