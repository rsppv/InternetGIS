 'use strict';
 
 /* Controllers */

var InternetGis = angular.module('InternetGis', []);

InternetGis.controller('MainCtrl', function ($scope) {

  /* Fields */
  var map;
  var autocomplete;
  var geocoder;
  var directionsDisplay;
  var directionsService;

  /* Properties */
  $scope.cities = [];

  /* Constructor */
  angular.element(document).ready(function(){
    initialize();
    //putTestPoints();
    setMapWidth();
    $(window).on('resize orientationChanged', setMapWidth); 
  });

  /* Methods */
  function initialize() {
    var mapOptions = {
        center: new google.maps.LatLng(50, 0),
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions); 

    var input = document.getElementById('city-search');
    var options = {types: ['(cities)']};
    autocomplete = new google.maps.places.Autocomplete(input, options);
    geocoder = new google.maps.Geocoder();
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();

    google.maps.event.addListener(autocomplete, 'place_changed', $scope.addCity);
  };

  $scope.addCity = function() {
    var place = autocomplete.getPlace();
    if (!place.geometry) {return;}

    directionsDisplay.setMap(null);
    showMarkers();

    var name = place.formatted_address;
    var location = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: location
    });

    var grepFunc = function(el, i) {
      if (el.name == name) {return true};
      return false;
    };

    if ($.grep($scope.cities, grepFunc).length == 0) {
      map.setCenter(location);
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
  };

  $scope.removeCity = function(index){
    directionsDisplay.setMap(null);
    showMarkers();
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
  };

  $scope.calculatePath = function(){
    if (checkConstraints()){

      var startPointLocation = $.grep($scope.cities, function(el){ return el.name == $scope.startPoint; })[0].location;
      var endPointLocation;
      if ($scope.backToStart) {
        endPointLocation = $.grep($scope.cities, function(el){ return el.name == $scope.startPoint; })[0].location;
      } else {
        endPointLocation = $.grep($scope.cities, function(el){ return el.name == $scope.endPoint; })[0].location;
      };

      

      var waypointsGrep = function(el, i) {
        if (el.name == $scope.startPoint){ return false; }
        if (!$scope.backToStart && el.name == $scope.endPoint) { return false; }
        return true;
      }

      var intermediateCities = $.grep($scope.cities, waypointsGrep);
      var waypts = [];
      $.each(intermediateCities, function(i, el){
        waypts.push({
          location: el.location
        });
      });

      var request = {
        origin: startPointLocation,
        destination: endPointLocation,
        waypoints: waypts,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
      };

      showLoadingAnimation();
      directionsService.route(request, function(response, status) {
        stopLoadingAnimation();
        if (status == google.maps.DirectionsStatus.OK) {
          hideMarkers();
          directionsDisplay.setMap(map);
          directionsDisplay.setDirections(response);
        } else {
          var error;
          if (status == google.maps.DirectionsStatus.ZERO_RESULTS)
            { error = "Не удалось проложить маршрут"; }
          else { error = status; }
          $("#b-calculate").notify(
            "Ошибка: "+ error,
            { position: "right top" }
          );
        }

      });

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
  };

  function setMapWidth() {
    var cpWidth = $("#control_panel").width();
    var mapWidth = $("body").innerWidth() - cpWidth - 40;
    $("#map_canvas").width(mapWidth);
  };

  function putTestPoints() {
    var testCities = ["Лисабон", "Москва", "Кейптаун", "Париж", "Осло"];
    $.each(testCities, function(i, el){
      geocoder.geocode({ 'address': el }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          var name = results[0].formatted_address;
          var location = results[0].geometry.location;
          var marker = new google.maps.Marker({
              map: map,
              position: location
          });
          var newCity = {'name': name, "location": location, "marker": marker};
          $scope.cities.push(newCity); 
          $scope.$apply();  
          $('#start-point-select option').eq(2).prop('selected', true);
          $('#end-point-select option').eq(3).prop('selected', true);
          $scope.startPoint = $('#start-point-select option').eq(2).val;
          $scope.endPoint = $('#end-point-select option').eq(3).val;
        }
      });
    });
  };

  function hideMarkers() {
    $.each($scope.cities, function(i, el){
      el.marker.setMap(null);
    });
  };

  function showMarkers() {
    $.each($scope.cities, function(i, el){
      el.marker.setMap(map);
    });
  };

  function showLoadingAnimation() {    
    $("#b-calculate").attr("disabled" ,"disabled");
    $("#b-calculate").text("Прокладываем маршрут...");
  }

  function stopLoadingAnimation() {    
    $("#b-calculate").removeAttr("disabled");
    $("#b-calculate").text("Найти оптимальный маршрут");
  }

});