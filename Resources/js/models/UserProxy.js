var UserProxy = function (facade) {
    var app = facade, init, _self = this, Config, Encryption;
    
    init = function () {
        Config = app.config;
        Encryption = app.GibberishAES;
    };
    
    this.saveCredentials = function (credentials) {
        var db, username, password;

        username = Encryption.enc(credentials.username, Config.ENCRYPTION_KEY);
        password = Encryption.enc(credentials.password, Config.ENCRYPTION_KEY);

        // open the database
        db = Ti.Database.open('umobile');

        // clear out any existing credentials to prevent the accumulation of duplicate rows
        db.execute('DELETE FROM prefs WHERE name="username" OR name="password"');

        // persist the new credentials
        db.execute(
            'INSERT INTO prefs (name, value) values ("username", ?)',
            username
        );
        db.execute(
            'INSERT INTO prefs (name, value) values ("password", ?)',
            password
        );

        // close the database
        db.close();
    };
    
    /**
     * Return the currently persisted credentials as a simple dictionary object.
     * If no credentials have yet been created, the username and password values
     * will each be null;
     */
    this.getCredentials = function () {
        var db, rows, credentials;

        // make sure the database has been initialized
        db = Ti.Database.install('umobile.sqlite','umobile');

        credentials = {
            username: '',
            password: ''
        };

        rows = db.execute('SELECT value from prefs where name="username"');
        if (rows.isValidRow()) {
            try { 
                credentials.username = Encryption.dec(rows.fieldByName('value'), Config.ENCRYPTION_KEY);
            } catch (e) {
                Ti.API.debug("Couldn't decrypt username");
            }
        }
        rows.close();

        rows = db.execute('SELECT value from prefs where name="password"');
        if (rows.isValidRow()) {
            (function(){
                try {
                    credentials.password = Encryption.dec(rows.fieldByName('value'), Config.ENCRYPTION_KEY);
                } catch (e) {
                    Ti.API.debug("Couldn't decrypt password");
                }            
            })();
        }
        rows.close();
        db.close();

        return credentials;
    };
    
    init();
};