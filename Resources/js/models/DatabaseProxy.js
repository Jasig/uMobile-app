//
// This module isn't implemented yet, just starting to define the public methods for a good db proxy.
//

var DatabaseProxy = function (facade) {
    var app = facade, self = {}, init, database;
    
    init = function () {
        database = Ti.Database.install('umobile.sqlite','umobile');
    };
    
    self.createTable = function (createOpts) {
        
    };
    
    self.addRows = function (addOpts) {
        
    };
    
    self.getRows = function (queryOpts) {
        //Required: table, 
        //Optional: selColumns, matchColumn, id, limit, 
    };
    
    self.updateRows = function (queryOpts) {
        
    };
    
    self.deleteRows = function (deleteOpts) {
        
    };
    
    self.search = function (queryOpts) {
        //Required: table
        //Optional: 

    };
    
    return self;
};