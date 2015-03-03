 'use strict';
 
 /* Controllers */

var InternetGis = angular.module('InternetGis', []);

InternetGis.controller('MainCtrl', function ($scope) {

  var geocoder;
  var map;

  function initialize() {
      geocoder = new google.maps.Geocoder();
      var mapOptions = {
          center: new google.maps.LatLng(56.497303, 84.972582),
          zoom: 9,
          mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(document.getElementById("map_canvas"),
          mapOptions); 

      var input = document.getElementById('city-search');
      var options = {
        types: ['(cities)'],
        componentRestrictions: {country: 'ru'} };
      var autocomplete = new google.maps.places.Autocomplete(input, options);
  }

  function setMapWidth() {
    var cpWidth = $("#control_panel").width();
    var mapWidth = $("body").innerWidth() - cpWidth - 40;
    $("#map_canvas").width(mapWidth);
  }

  /* Initialization */
  angular.element(document).ready(function(){
    initialize();
    setMapWidth();
    $(window).on('resize orientationChanged', setMapWidth); 
  });


  /* Properties */
  $scope.cities = [];


  /* Methods */

  $scope.addCity = function(){
    if (!$scope.newCityName) { return };
    
    geocoder.geocode( { 'address': $scope.newCityName}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {

        map.setCenter(results[0].geometry.location);
        var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
        });


        var name = results[0].formatted_address;
        var location = results[0].geometry;

        var newCity = {'name': name, "location": location};
        $scope.cities.push(newCity);
        $scope.newCityName = null; 
        $scope.$apply();
      } else {        
        $("#city-search").notify("Ошибка: " + status, { position: "bottom"});
      }
    });
  };

  $scope.removeCity = function(index){
    $scope.cities.splice(index, 1);
  };

});