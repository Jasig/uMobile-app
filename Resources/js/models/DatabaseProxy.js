//
// This module isn't implemented yet, just starting to define the public methods for a good db proxy.
//

var DatabaseProxy = function (facade) {
    var app = facade, _self = this, init, database;
    
    init = function () {
        database = Ti.Database.install('umobile.sqlite','umobile');
    };
    
    this.createTable = function (createOpts) {
        
    };
    
    this.addRows = function (addOpts) {
        
    };
    
    this.getRows = function (queryOpts) {
        //Required: table, 
        //Optional: selColumns, matchColumn, id, limit, 
    };
    
    this.updateRows = function (queryOpts) {
        
    };
    
    this.deleteRows = function (deleteOpts) {
        
    };
    
    this.search = function (queryOpts) {
        //Required: table
        //Optional: 

    };
    
    init();
};