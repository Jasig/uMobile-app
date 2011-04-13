var PersonDetailTableView = function (facade,opts) {
    var app = facade,
        self = Titanium.UI.createTableView(app.styles.directoryDetailAttributeTable),
        person,
        //Event Handlers
        onEmailSelect;
    
    self.update = function (p) {
        person = p;
        Ti.API.info(person);
        
        if (!person.email.home && !person.phone.home && !person.jobTitle && !person.organization && !person.address.home) {
            var _emptyRow = Titanium.UI.createTableViewRow({
                title: app.localDictionary.noContactData
            });
        }
        
        Ti.API.debug("checking user's email " + person.email.home);
        if (person.email.home) {
            var _emailRow = createRow(app.localDictionary.email, person.email.home);

            self.appendRow(_emailRow);
            _emailRow.addEventListener('click', onEmailSelect);
        }
        
        Ti.API.debug("checking phone " + person.phone.home);
        if (person.phone.home) {
            self.appendRow(createRow(app.localDictionary.phone, person.phone.home));
        }
        
        Ti.API.debug("checking job " + person.jobTitle);
        if (person.jobTitle) {
            self.appendRow(createRow(app.localDictionary.title, person.jobTitle));
        }
        
        Ti.API.debug("checking org " + person.organization);
        if (person.organization) {
            self.appendRow(createRow(app.localDictionary.organization, person.organization));
        }
        
        Ti.API.debug("checking address " + person.address.home);
        if (person.address.home) {
            self.appendRow(createRow(app.localDictionary.address, person.address.home));
        }
    };
    function createRow (label, value) {
        var _row, _rowOptions, _label, _value;
        _rowOptions = app.styles.directoryDetailRow;
        _rowOptions.data = value;
        _row = Titanium.UI.createTableViewRow(_rowOptions);
        _label = Titanium.UI.createLabel(app.styles.directoryDetailRowLabel);
        _label.text = label;
        _label.data = value;
        _row.add(_label);
        
        _value = Titanium.UI.createLabel(app.styles.directoryDetailRowValue);
        _value.text = value;
        _value.data = value;
        _row.add(_value);
        
        return _row;
    }
    onEmailSelect = function (e) {
        var _address;
        Ti.API.info("onEmailSelect()" + e.source.data);
        if(Ti.Platform.osname == 'iphone') {
            var emailDialog = Ti.UI.createEmailDialog({
                toRecipients: [e.source.data]
            });
            emailDialog.open();
        }
        else {
            Ti.Platform.openURL('mailto:' + e.source.data);
        }
    };
    
    onPhoneSelect = function (e) {
        Ti.Platform.openURL('tel:' + e.source.title);
    };
    
    return self;
};