 'use strict';

 /* Controllers */

var InternetGis = angular.module('InternetGis', []);


InternetGis.controller('MainCtrl', function ($scope, $http) {

  /* Fields */
  var map;
  var autocomplete;
  var geocoder;
  var directionsDisplay;
  var directionsService;



  /* Properties */
  $scope.rubrics = [];

  /* Constructor */
  angular.element(document).ready(function(){
    ymaps.ready(initialize);
    //putTestPoints();
    setMapWidth();
    $(window).on('resize orientationChanged', setMapWidth);
  });

  /* Methods */
  function initialize() {
    // DG.then(function () {
    //     map = DG.map('map', {
    //         center: [56.49, 84.97],
    //         zoom: 13,
    //         geoclicker: true
    //     });
    // });
    map = new ymaps.Map("map", {
      center: [56.49, 84.97],
      zoom: 13
    });


    setMapWidth();
    
    var input         = document.getElementById('rubric-search');
    // var options       = {types: ['(rubrics)']};
    // geocoder          = new google.maps.Geocoder();
    // directionsService = new google.maps.DirectionsService();
    // directionsDisplay = new google.maps.DirectionsRenderer();
  };

  function setMapWidth() {
    var cpWidth = $("#control_panel").width();
    var mapWidth = $("body").innerWidth() - cpWidth - 40;
    $("#map").width(mapWidth);
  };

  $scope.addRubric = function() {
    if ($scope.newRubric == '') return;
    if ($scope.rubrics.indexOf($scope.newRubric) == -1) {
      $scope.rubrics.push($scope.newRubric);
      // getObjectsForRubric($scope.newRubric);
      $scope.newRubric = '';
    }
    else {
      $("#search-box").notify(
        "Уже в списке", 
        { position:"bottom left" }
      );
    } 
  };

  $scope.removeRubric = function(index){
    console.log($scope.rubrics.splice(index, 1));
    console.log("Remained: ", $scope.rubrics);
  };

  $scope.getObjectsForRubricList = function(){
    $scope.rubrics.forEach(getObjectsForRubric);
  }

  function getObjectsForRubric(rubric){
    var region = "Томск";
    var request = "http://catalog.api.2gis.ru/search?what="+
      rubric+"&where="+
      region+"&version=1.3&key=1234567890&page=1&pagesize=10";

    console.log(request);

    $http.get(request).success(
      function(data, status, headers, config) {

        console.log(rubric,"\n",data);
    })
    .error(function(data, status, headers, config){
      console.log(status, headers, config);
    });
  }

  $scope.showRubric = function(index){
    map.setCenter($scope.rubrics[index].marker.position);
  };

  $scope.startPointChanged = function(){
    if ($scope.startPoint == $scope.endPoint) {
      $scope.endPoint = null;
    };
  };

  $scope.calculatePath = function(){
    if (checkConstraints()){

      var startPointLocation = $.grep($scope.rubrics, function(el){ return el.name == $scope.startPoint; })[0].location;
      var endPointLocation;
      if ($scope.backToStart) {
        endPointLocation = $.grep($scope.rubrics, function(el){ return el.name == $scope.startPoint; })[0].location;
      } else {
        endPointLocation = $.grep($scope.rubrics, function(el){ return el.name == $scope.endPoint; })[0].location;
      };

      

      var waypointsGrep = function(el, i) {
        if (el.name == $scope.startPoint){ return false; }
        if (!$scope.backToStart && el.name == $scope.endPoint) { return false; }
        return true;
      }

      var intermediateRubrics = $.grep($scope.rubrics, waypointsGrep);
      var waypts = [];
      $.each(intermediateRubrics, function(i, el){
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
    if ($scope.rubrics.length < 2) {
      $("#rubrics-list").notify(
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

  function putTestPoints() {
    var testRubrics = ["Лисабон", "Москва", "Кейптаун", "Париж", "Осло"];
    $.each(testRubrics, function(i, el){
      geocoder.geocode({ 'address': el }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          var name = results[0].formatted_address;
          var location = results[0].geometry.location;
          var marker = new google.maps.Marker({
              map: map,
              position: location
          });
          var newRubric = {'name': name, "location": location, "marker": marker};
          $scope.rubrics.push(newRubric); 
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
    $.each($scope.rubrics, function(i, el){
      el.marker.setMap(null);
    });
  };

  function showMarkers() {
    $.each($scope.rubrics, function(i, el){
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