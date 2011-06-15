var PersonDetailTableView = function (facade) {
    var app = facade, init, LocalDictionary, Styles, 
        self = Titanium.UI.createTableView(app.styles.directoryDetailAttributeTable),
        person,
        //Event Handlers
        onEmailSelect,
        onPhoneSelect,
        onMapSelect,
        emptyRow,
        isDataEmpty = false;
    init = function () {
        //Declare pointers to facade members
        LocalDictionary = app.localDictionary;
        Styles = app.styles;
        Device = app.models.deviceProxy;
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
    };
    
    self.update = function (p) {
        //Clear the previous data from the table.
        self.data = [];
        person = p;
        
        if (!person.email.home && !person.phone.home && !person.jobTitle && !person.organization && !person.address.home) {
            if(!emptyRow) {
                emptyRow = createRow({value: LocalDictionary.noContactData});
            }
            self.appendRow(emptyRow);
            isDataEmpty = true;
        }
        
        Ti.API.debug("checking user's email " + person.email.home);
        if (person.email.home) {
            var _emailRow = createRow({label: LocalDictionary.email, value: person.email.home, link: true});

            self.appendRow(_emailRow);
            _emailRow.addEventListener('click', onEmailSelect);
        }
        
        Ti.API.debug("checking phone " + person.phone.home);
        if (person.phone.home) {
            var _phoneRow = createRow({label: LocalDictionary.phone, value: person.phone.home, link: true });
            self.appendRow(_phoneRow);
            _phoneRow.addEventListener('click', onPhoneSelect);
        }
        
        Ti.API.debug("checking job " + person.jobTitle);
        if (person.jobTitle) {
            self.appendRow(createRow({label: LocalDictionary.title, value: person.jobTitle}));
        }
        
        Ti.API.debug("checking department " + person.department);
        if (person.department) {
            self.appendRow(createRow({label: LocalDictionary.department, value: person.department}));
        }
        
        Ti.API.debug("checking org " + person.organization);
        if (person.organization) {
            self.appendRow(createRow({label: LocalDictionary.organization, value: person.organization}));
        }
        
        Ti.API.debug("checking address " + person.address.home);
        if (person.address.home) {
            var _addressRow = createRow({label: LocalDictionary.address, value: person.address.home, link: true });
            self.appendRow(_addressRow);
            _addressRow.addEventListener('click', onMapSelect);
        }
        
        Ti.API.debug("checking url " + person.url);
        if (person.URL.home) {
            var _urlRow = createRow({label: LocalDictionary.url, value: person.URL.home, link: true});

            self.appendRow(_urlRow);
            _urlRow.addEventListener('click', onUrlSelect);
        }
        
    };
    function createRow (attributes) {
        var _row, _rowOptions, _label, _value, _valueOpts;
        //The only required param in the attributes object is value. "label" is optional but preferred.
        //The layout will change to expand the value text if there's no label with it.
        _rowOptions = Styles.directoryDetailRow.clone();
        
        if (!attributes.label) {
            _rowOptions.className = 'personDataNoLabel';
        }
        else {
            _label = Titanium.UI.createLabel(Styles.directoryDetailRowLabel);
            _label.text = attributes.label;
            _label.data = attributes.value;
            
            _rowOptions.className = 'personData';
        }
        _rowOptions.data = attributes.value;
        _row = Titanium.UI.createTableViewRow(_rowOptions);        
        if (attributes.label) { 
            _row.add(_label);
            _valueOpts = Styles.directoryDetailRowValue.clone();
        }
        else {
            _valueOpts = Styles.directoryDetailValueNoLabel.clone();
        }
        
        _valueOpts.text = attributes.value;
        _valueOpts.data = attributes.value;
        if (attributes.link) { 
            Ti.API.debug("Creating a link label for " + attributes.value);
            _valueOpts.color = Styles.directoryLinkLabel.color;
        }
        _value = Titanium.UI.createLabel(_valueOpts);
        _row.add(_value);
        
        return _row;
    }
    onEmailSelect = function (e) {
        var _address;
        Ti.API.info("onEmailSelect()" + e.source.data);
        if(Device.isIOS()) {
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
    
    init();
    
    return self;
};