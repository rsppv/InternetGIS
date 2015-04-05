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
  $scope.checkedPoints = [];
  $scope.startPoint = {
    coords: [],
    address: null,
    marker: null
  }
  $scope.endPoint = {
    coords: [],
    address: null,
    marker: null
  }

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
      zoom: 13,
      controls: ["fullscreenControl","searchControl","routeEditor"]
    });


    setMapWidth();

  };

  $scope.setStartPoint = function(){
    
      map.events.add('click', function (e) {
        $scope.startPoint.coords = e.get('coords');

        // Если метка уже создана – просто передвигаем ее
        if ($scope.startPoint.marker) {
          $scope.startPoint.marker.geometry.setCoordinates($scope.startPoint.coords);
        }
        // Если нет – создаем.
        else {
          $scope.startPoint.marker = createPlacemark($scope.startPoint.coords);
          map.geoObjects.add($scope.startPoint.marker);
          // Слушаем событие окончания перетаскивания на метке.
          $scope.startPoint.marker.events.add('dragend', function () {
              getAddress($scope.startPoint.marker.geometry.getCoordinates(), 0);
          });
        }

        $scope.startPoint.marker.properties.set('iconContent', 'поиск...');
        getAddress($scope.startPoint.coords, 0);      
      });      
    
  }

  $scope.setEndPoint = function() {
    map.events.add('click', function (e) {
      $scope.endPoint.coords = e.get('coords');

      // Если метка уже создана – просто передвигаем ее
      if ($scope.endPoint.marker) {
        $scope.endPoint.marker.geometry.setCoordinates($scope.endPoint.coords);
      }
      // Если нет – создаем.
      else {
        $scope.endPoint.marker = createPlacemark($scope.endPoint.coords);
        map.geoObjects.add($scope.endPoint.marker);
        // Слушаем событие окончания перетаскивания на метке.
        $scope.endPoint.marker.events.add('dragend', function () {
            getAddress($scope.endPoint.marker.geometry.getCoordinates(),1);
        });
      }

      $scope.endPoint.marker.properties.set('iconContent', 'поиск...');
      getAddress($scope.endPoint.coords, 1);      
    }); 
  }

  // Определяем адрес по координатам (обратное геокодирование)
  function getAddress(coords, pointNumber) {
      ymaps.geocode(coords).then(function (res) {
          var firstGeoObject = res.geoObjects.get(0);
            if (pointNumber == 0) 
              fillStartPoint(firstGeoObject.properties.get('text'));
            else
              fillEndPoint(firstGeoObject.properties.get('text'));
      });
  }

  function fillStartPoint(address){
    $scope.startPoint.address = address;
    $scope.$apply();
    $scope.startPoint.marker.properties
      .set({
          iconContent: "A",
          balloonContent: address
      }); 
  }

  function fillEndPoint(address){
    $scope.endPoint.address = address;
    $scope.$apply();
    $scope.endPoint.marker.properties
      .set({
          iconContent: "Б",
          balloonContent: address
      }); 
  }

  // Создание метки
  function createPlacemark(coords) {
      return new ymaps.Placemark(coords, {
          iconContent: 'поиск...'
      }, {
          preset: 'islands#circleIcon',
          draggable: true
      });
  }

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

  $scope.getObjectsForRubric = function(rubric){
    var region = "Томск";
    var request = "http://catalog.api.2gis.ru/search?what="+
      rubric+"&where="+
      region+"&version=1.3&key=1234567890&page=5&pagesize=5";


    $http.get(request).success(
      function(data, status, headers, config) {
        console.log(request);
        // console.log(rubric,"\n",data);
        var response = [];
        data.result.forEach(function(obj) {
          response.push({
            name : obj.name,
            address : obj.address,
            coords : [obj.lat, obj.lon]
          });
        });
        
        showPlacemarks(response);
    })
    .error(function(data, status, headers, config){
      console.log(status, headers, config);
    });
  }

  function showPlacemarks(points){
    var myCollection = new ymaps.GeoObjectCollection();
    
    // Заполняем коллекцию данными.
    for (var i = 0, l = points.length; i < l; i++) {
        var point = points[i];
        myCollection.add(new ymaps.Placemark(
            point.coords, {
                balloonContentBody: point.name
            }
        ));
    }
    // Добавляем коллекцию меток на карту.
    map.geoObjects.add(myCollection);

  };

  $scope.startPointChanged = function(){
    if ($scope.startPoint == $scope.endPoint) {
      $scope.endPoint = null;
    };
  };

  $scope.calculatePath = function(){
    
    var multiRoute = new ymaps.multiRouter.MultiRoute({
        // Описание опорных точек мультимаршрута.
        referencePoints: [
            [56.45614, 84.9503],
            [56.47363, 85.01499]
        ],
        // Параметры маршрутизации.
        params: {
            // Ограничение на максимальное количество маршрутов, возвращаемое маршрутизатором.
            results: 2
        }
    }, {
        // Автоматически устанавливать границы карты так, чтобы маршрут был виден целиком.
        boundsAutoApply: true
    });
    map.geoObjects.add(multiRoute);
    /*if (checkConstraints()){

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

    }*/
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