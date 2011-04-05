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
            phoneSection;
            
        self.data = [];
        person = p;
        Ti.API.info(person);
        
        Ti.API.debug("checking user's email");
        if (person.email.home) {
            emailSectionTitle = app.localDictionary.emailAddress;
            emailSection = Titanium.UI.createTableViewSection({
                headerTitle: emailSectionTitle
            });
                _row = Titanium.UI.createTableViewRow({
                    title: person.email.home
                });
                emailSection.add(_row);
                _row.addEventListener('click',onEmailSelect);
            newData.push(emailSection);
        }
        
        Ti.API.debug("checking phone");
        if (person.phone.home) {
            phoneSection = Titanium.UI.createTableViewSection({
                headerTitle: app.localDictionary.phoneNumber
            });
            phoneSection.add(Titanium.UI.createTableViewRow({
                title: person.phone.home
            }));
            newData.push(phoneSection);
        }
        
        if (person.jobTitle) {
            var titleSection = Titanium.UI.createTableViewSection({
                headerTitle: 'Title'
            });
            titleSection.add(Titanium.UI.createTableViewRow({
                title: person.jobTitle
            }));
            newData.push(titleSection);
        }
        
        if (person.organization) {
            var orgSection = Titanium.UI.createTableViewSection({
                headerTitle: 'Organization'
            });
            orgSection.add(Titanium.UI.createTableViewRow({
                title: person.phone.home
            }));
            newData.push(orgSection);
        }
        
        if (person.address.home) {
            var addressSection = Titanium.UI.createTableViewSection({
                headerTitle: 'Address'
            });
            addressSection.add(Titanium.UI.createTableViewRow({
                title: person.address.home
            }));
            newData.push(addressSection);
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
    
    onPhoneSelect = function (e) {
        Ti.Platform.openURL('tel:' + e.source.title);
    };
    
    self.construct();
    
    return self;
};