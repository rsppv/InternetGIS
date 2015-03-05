 'use strict';
 
 /* Controllers */

var InternetGis = angular.module('InternetGis', []);

InternetGis.controller('MainCtrl', function ($scope) {

  /* Initialization */
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

      google.maps.event.addListener(autocomplete, 'place_changed', function() {
        var place = autocomplete.getPlace();
        if (!place.geometry) {return;}


        var name = place.formatted_address;
        var location = place.geometry;
        var marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });
        map.setCenter(place.geometry.location);

        var grepFunc = function(el, i) {
          if (el.name == name) {return true};
          return false;
        };

        if ($.grep($scope.cities, grepFunc).length == 0) {
          var newCity = {'name': name, "location": location, "marker": marker};
          $scope.cities.push(newCity);          
        } else {
          $("#search-box").notify(
            "Эта точка уже добавлена", 
            { position:"bottom left" }
          );
        }

        place = null;
        $scope.newCityName = null;
        $scope.$apply();  

      });
  }

  function setMapWidth() {
    var cpWidth = $("#control_panel").width();
    var mapWidth = $("body").innerWidth() - cpWidth - 40;
    $("#map_canvas").width(mapWidth);
  }

  /* Constructor */
  angular.element(document).ready(function(){
    initialize();
    setMapWidth();
    $(window).on('resize orientationChanged', setMapWidth); 
  });


  /* Properties */
  $scope.cities = [];


  /* Methods */
  $scope.removeCity = function(index){
    $scope.cities[index].marker.setMap(null);
    $scope.cities.splice(index, 1);
  };

  $scope.showCity = function(index){
    map.setCenter($scope.cities[index].marker.position);
  };

  $scope.startPointChanged = function(){
    if ($scope.startPoint == $scope.endPoint) {
      $scope.endPoint = null;
    };
  }


  $scope.calculatePath = function(){
    if (checkConstraints()){
      var grepFunc = function(el, i) {
        if (el.name == $scope.startPoint){ return false; }
        if (!$scope.backToStart && el.name == $scope.endPoint) { return false; }
        return true;
      }

      var intermediateCities = $.grep($scope.cities,grepFunc);
      var intermediateCitiesString = "";
      $.each(intermediateCities, function(i, el){
        intermediateCitiesString += el.name + "\r\n";
      });

      var dest;
      if ($scope.backToStart) {
        dest = "и обратно";        
      } else {
        dest = "в\r\n"+$scope.endPoint;
      };

      alert("Тут будет поиск оптимального маршрута из\r\n"
        +$scope.startPoint+ "\r\n" + dest +
        "\r\nпроходя следующие точки:\r\n" + intermediateCitiesString);
    }
  };

  function checkConstraints(){
    var result = true;
    if ($scope.cities.length < 2) {
      $("#cities-list").notify(
        "Добавьте 2 и более города в список",
        { position: "right top" }
        );
      result = false;      
    };

    if (!$scope.startPoint) {
      $("#start-point-select").notify(
        "Выберите начальную точку маршрута",
        { position: "right top" }
        );
      result = false; 
    }

    if (!$scope.backToStart && !$scope.endPoint) {
      $("#end-point-select").notify(
        "Выберите конечную точку маршрута",
        { position: "right top" }
        );
      result = false; 
    }


    return result;
  }

});