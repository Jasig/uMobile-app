var PersonDetailTableView = function (facade,opts) {
    var self = Titanium.UI.createTableView(),
        app = facade,
        person,
        //Event Handlers
        onEmailSelect;
    self.construct = function () {
        self.top = opts.top || 0;
        self.backgroundColor = app.UPM.GLOBAL_STYLES.tableBackgroundColor;
        if (Titanium.Platform.osname === 'iphone') {
            self.style = Titanium.UI.iPhone.TableViewStyle.GROUPED;
        }  
    };
    
    self.update = function (p) {
        var newData = [],
            emailSection,
            emailSectionTitle,
            phoneSection,
            usernameSection;
            
        self.data = [];
        person = p;
        
        Ti.API.debug("checking user's email");
        if (person.email && person.email.length > 0) {
            if(person.email.length > 1) {
                emailSectionTitle = app.localDictionary.emailAddresses;
            }
            else {
                emailSectionTitle = app.localDictionary.emailAddress;
            }
            emailSection = Titanium.UI.createTableViewSection({
                headerTitle: emailSectionTitle
            });
            for (var e=0,eLength=person.email.length; e<eLength; e++) {
                _row = Titanium.UI.createTableViewRow({
                    title: person.email[e]
                });
                emailSection.add(_row);
                _row.addEventListener('click',onEmailSelect);
                
            }
            newData.push(emailSection);
        }
        
        Ti.API.debug("checking phone");
        if (person.phone) {
            phoneSection = Titanium.UI.createTableViewSection({
                headerTitle: app.localDictionary.phoneNumber
            });
            phoneSection.add(Titanium.UI.createTableViewRow({
                title: person.phone
            }));
            newData.push(phoneSection);
        }
        
        Ti.API.debug("checking username");
        if (person.username) {
            usernameSection = Titanium.UI.createTableViewSection({
                headerTitle: app.localDictionary.username
            });
            usernameSection.add(Titanium.UI.createTableViewRow({
                title: person.username
                // title: 'username'
            }));
            newData.push(usernameSection);
        }
        
        self.data = newData;
    };
    
    onEmailSelect = function (e) {
        if(Ti.Platform.osname == 'iphone') {
            var emailDialog = Ti.UI.createEmailDialog({
                toRecipients: [e.source.title]
            });
            emailDialog.open();
        }
        else {
            Ti.Platform.openURL('mailto:' + e.source.title);            
        }
    };
    self.construct();
    
    return self;
};