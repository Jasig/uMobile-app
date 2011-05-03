var ApplicationFacade = function () {
    var facade = {};
    facade.models = {};
    facade.views = {};
    facade.controllers = {};

    facade.registerMember = function (name, member) {
        facade[name] = member;
    };
    
    //Controller passed as reference, with name as its key in facade.controllers.
    facade.registerController = function (name, controller) {
        facade.controllers[name] = controller;
    };
    
    facade.registerModel = function (name, model) {
        facade.models[name] = model;
    };
    
    facade.registerView = function (name, view) {
        facade.views[name] = view;
    };
    
    return facade;
};