var PersonDetailTableView = function (facade,opts) {
    var app = facade,
        self = Titanium.UI.createTableView(app.styles.directoryDetailAttributeTable),
        person,
        //Event Handlers
        onEmailSelect,
        onPhoneSelect,
        onMapSelect,
        emptyRow,
        isDataEmpty = false;
    
    self.update = function (p) {
        //Clear the previous data from the table.
        self.data = [];
        person = p;
        
        if (!person.email.home && !person.phone.home && !person.jobTitle && !person.organization && !person.address.home) {
            if(!emptyRow) {
                emptyRow = createRow({value: app.localDictionary.noContactData});
            }
            self.appendRow(emptyRow);
            isDataEmpty = true;
        }
        
        Ti.API.debug("checking user's email " + person.email.home);
        if (person.email.home) {
            var _emailRow = createRow({label: app.localDictionary.email, value: person.email.home, link: true});

            self.appendRow(_emailRow);
            _emailRow.addEventListener('click', onEmailSelect);
        }
        
        Ti.API.debug("checking phone " + person.phone.home);
        if (person.phone.home) {
            var _phoneRow = createRow({label: app.localDictionary.phone, value: person.phone.home, link: true });
            self.appendRow(_phoneRow);
            _phoneRow.addEventListener('click', onPhoneSelect);
        }
        
        Ti.API.debug("checking job " + person.jobTitle);
        if (person.jobTitle) {
            self.appendRow(createRow({label: app.localDictionary.title, value: person.jobTitle}));
        }
        
        Ti.API.debug("checking department " + person.department);
        if (person.department) {
            self.appendRow(createRow({label: app.localDictionary.department, value: person.department}));
        }
        
        Ti.API.debug("checking org " + person.organization);
        if (person.organization) {
            self.appendRow(createRow({label: app.localDictionary.organization, value: person.organization}));
        }
        
        Ti.API.debug("checking address " + person.address.home);
        if (person.address.home) {
            var _addressRow = createRow({label: app.localDictionary.address, value: person.address.home, link: true });
            self.appendRow(_addressRow);
            _addressRow.addEventListener('click', onMapSelect);
        }
        
        Ti.API.debug("checking url " + person.url);
        if (person.URL.home) {
            var _urlRow = createRow({label: app.localDictionary.url, value: person.URL.home, link: true});

            self.appendRow(_urlRow);
            _urlRow.addEventListener('click', onUrlSelect);
        }
        
    };
    function createRow (attributes) {
        var _row, _rowOptions, _label, _value, _valueOpts;
        //The only required param in the attributes object is value. "label" is optional but preferred.
        //The layout will change to expand the value text if there's no label with it.
        _rowOptions = app.styles.directoryDetailRow;
        
        if (!attributes.label) {
            _rowOptions.className = 'personDataNoLabel';
        }
        else {
            _label = Titanium.UI.createLabel(app.styles.directoryDetailRowLabel);
            _label.text = attributes.label;
            _label.data = attributes.value;
            
            _rowOptions.className = 'personData';
        }
        _rowOptions.data = attributes.value;
        _row = Titanium.UI.createTableViewRow(_rowOptions);        
        if (attributes.label) { 
            _row.add(_label);
            _valueOpts = app.styles.directoryDetailRowValue;
        }
        else {
            _valueOpts = app.styles.directoryDetailValueNoLabel;
        }
        
        _valueOpts.text = attributes.value;
        _valueOpts.data = attributes.value;
        if (attributes.link) { 
            Ti.API.debug("Creating a link label for " + attributes.value);
            _valueOpts.color = app.styles.directoryLinkLabel.color;
        }
        _value = Titanium.UI.createLabel(_valueOpts);
        _row.add(_value);
        
        return _row;
    }
    onEmailSelect = function (e) {
        var _address;
        Ti.API.info("onEmailSelect()" + e.source.data);
        if(device.isIOS()) {
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
        var url = 'tel:' + e.source.data.replace(/[^0-9]/g, '');
        Ti.API.info(url);
        Ti.Platform.openURL(url);
    };
    
    onMapSelect = function (e) {
        var url = 'http://maps.google.com/maps?q=' + e.source.data.replace('$', ' ');
        Ti.API.debug('Opening map url ' + url);
        Ti.Platform.openURL(url);
    };
    
    onUrlSelect = function (e) {
        Ti.Platform.openURL(e.source.data);
    };
    
    return self;
};