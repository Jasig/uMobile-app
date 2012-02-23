var styles = require('/js/style');
exports.createTableView = function (options) {
    //options: {data, top, height}
    var table = {}, options = options || {};
    options.layout = options.layout || 'vertical';
    options.contentHeight = options.contentHeight || 'auto'
    options.bottom = options.bottom || 0;
    
    table.view = Ti.UI.createScrollView(options);
    
    table.setData = function (data) {
        Ti.API.debug('setData() in TableView data.length:'+data.length);
        var _view;
        while (_view = data.shift()) {
            Ti.API.debug('_view: '+_view);
            table.view.add(_view.view || _view);
        }
    };
    
    table.addEventListener = function (event, handler) {
        
    };
    
    table.removeEventListener = function (event, handler) {
        
    };
    
    table.hide = function () {
        
    };
    
    table.show = function () {
        
    };
    
    return table;
};

exports.createTableViewRow = function (options) {
    //options: {className, title, hasChild, data}
    var row = {}, titleLabel, arrow;
    row.view = Ti.UI.createView(styles.tableRow);
    
    //Every row should have a title. But we'll check to make sure anyway.
    function createTitle (title) {
        titleLabel = Ti.UI.createLabel(styles.tableRowLabel);
        titleLabel.text = title;
        row.view.add(titleLabel);
    }
    if (options.title) createTitle(options.title);
    
    function addIcon(image) {
        var icon = Ti.UI.createImageView(styles.tableRowIcon);
        icon.image = image;
        row.view.add(icon);
        
    }
    if (options.icon) addIcon(options.icon);
    
    //If there are children to the row, let's indicate so with an arrow
    function addChildArrow () {
        arrow = Ti.UI.createImageView(styles.tableRowArrow);
        row.view.add(arrow);
    }
    if (options.hasChild) addChildArrow();
    
    row.add = function (view) {
        try {
            row.view.add(view);
        }
        catch (e) {
            Ti.API.error('Could not add view to tableViewRow: '+JSON.stringify(e));
        }
    };
    
    row.addEventListener = function (event, handler) {
        row.view.addEventListener(event, handler);
    };
    
    row.removeEventListener = function (event, handler) {
        row.view.removeEventListener(event, handler);
    };
    
    return row;
};

exports.createTableViewSection = function (options) {
    Ti.API.debug('createTableViewSection() in TableView');
    //options: {headerTitle} and other styles for the container
    var section = {}, headerLabel, sectionHeaderView;
    options.layout = options.layout || 'vertical';

    //Create the main container view for the section
    section.view = Ti.UI.createView(options);
    
    function createHeader(title) {
        Ti.API.debug('createHeader() in TableView.createTableViewSection');
        sectionHeaderView = Ti.UI.createView(styles.tableSectionHeader);
        _folderLabel = Ti.UI.createLabel(styles.tableSectionHeaderLabel);
        _folderLabel.text = title;
        sectionHeaderView.add(_folderLabel);
        section.view.add(sectionHeaderView);
    }
    if (options.headerTitle) createHeader(options.headerTitle);
    
    section.setHeaderTitle = function(title) {
        if (!sectionHeaderView) return createHeader(title);
        if (_folderLabel) _folderLabel.text = title;
        return true;
    };
    
    section.add = function (view) {
        try {
            section.view.add(view);
        }
        catch (e) {
            Ti.API.error('Could not add view to section: '+JSON.stringify(e));
        }
    };
    
    return section;
};