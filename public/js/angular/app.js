imports = ['madison.dateFilters', 'madison.services', 'angular-md5', 'ui.bootstrap', 'ui.utils', 'ui.select2', 'ui.bootstrap.datetimepicker', 'ngAnimate', 'ngResource', 'ui.bootstrap.collapse'];

var app = angular.module('madisonApp', imports, function($interpolateProvider){
	$interpolateProvider.startSymbol('<%');
	$interpolateProvider.endSymbol('%>');
});

function getAnnotationService(){

	var elem = angular.element($('html'));
	var injector = elem.injector();
	annotationService = injector.get('annotationService');

	return annotationService;
}