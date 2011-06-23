/**
 * A detail view, usually a child of a window view.
 * @interface
 */
function IDetailView() {};
IDetailView.prototype.getDetailView = function () {};
IDetailView.prototype.render = function (viewModel) {};
IDetailView.prototype.hide = function () {};