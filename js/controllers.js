 'use strict';
 
 /* Controllers */

var InternetGis = angular.module('InternetGis', []);

InternetGis.controller('MainCtrl', function ($scope) {

	angular.element(document).ready(function(){
		initialize();
	    setMapWidth();
	    $(window).on('resize orientationChanged', setMapWidth);		
	});

	$scope.cities = [    
		{'name': 'Томск' },
	    {'name': 'Новосибирск' },
	    {'name': 'Москва' }
  	];

  	$scope.addCity = function(){
  		if (!$scope.cityToAdd) { return };
  		var newCity = {'name': $scope.cityToAdd};
  		$scope.cities.push(newCity);
  	};

  	$scope.removeCity = function(){
  		
  	};

});