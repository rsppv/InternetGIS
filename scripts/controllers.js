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
  var ptp = DeliveryCalculator.prototype;
  var calculator;
  var stPoint;
  var finPoint;
  var checkedCollection;


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

    checkedCollection = new ymaps.GeoObjectCollection();
    setMapWidth();
    calculator = new DeliveryCalculator(map, map.getCenter());
  };

  function DeliveryCalculator(map, finish) {
    this._map = map;
    this._start = null;
    this._route = null;
    this._startBalloon;
    this._finishBalloon;

    map.events.add('click', this._onClick, this);
  }

  ptp._onClick= function (e) {
    console.log("onclick", this._start);
    if (this._start) {
        this.setFinishPoint(e.get('coords'));
    } else {
        this.setStartPoint(e.get('coords'));
    }
  };

  ptp._onStartDragEnd = function (e) {
    console.log("dragStart", this._start);
      var coords = this._start.geometry.getCoordinates();
      this.geocode("start", coords);
  };

  ptp._onFinishDragEnd = function (e) {
    console.log("dragEnd", this._finish);
      var coords = this._finish.geometry.getCoordinates();
      this.geocode("finish", coords);
  };

  ptp.getDirection = function () {
    console.log("directions", this._start, $scope.startPoint);
      if(this._route) {
          this._map.geoObjects.remove(this._route);
      }
      
      if (this._start && this._finish) {
          console.log("промежуточные т-ки 1", $scope.checkedPoints);
          var self = this,
              start = this._start.geometry.getCoordinates(),
              finish = this._finish.geometry.getCoordinates(),
              startBalloon = this._startBalloon,
              finishBalloon = this._finishBalloon,
              allPoints = $scope.checkedPoints.slice(0);
              // console.log("промежуточные т-ки 2", $scope.checkedPoints);
              allPoints.unshift(start);
              // console.log("промежуточные т-ки 3", start, $scope.checkedPoints);
              allPoints.push(finish);
              // console.log("промежуточные т-ки 4", finish, $scope.checkedPoints);
              console.log("Все точки после", allPoints);
          
          ymaps.route(allPoints)
            .then(function (router) {
              self._route = router.getPaths();
              self._route.options.set({ 
                strokeWidth: 5, 
                strokeColor: '0000ffff', 
                opacity: 0.5
              });
              self._map.geoObjects.add(self._route);
            });
          self._map.setBounds(self._map.geoObjects.getBounds());          
      }
  };

  ptp.setStartPoint = function (position) {
    console.log("setStPoint", position, this._start);
      if(this._start) {
          this._start.geometry.setCoordinates(position);
          //$scope.startPoint.coords = this._start.geometry.getCoordinates();
          console.log("setStPoint", position,this._start);
      }
      else {
          this._start = new ymaps.Placemark(position, { iconContent: 'А' }, { draggable: true });
          this._start.events.add('dragend', this._onStartDragEnd, this);
          this._map.geoObjects.add(this._start);
          //$scope.startPoint.coords = this._start.geometry.getCoordinates();
          console.log("setStPoint", position,this._start);
      }
      this.geocode("start", position);
  };

  ptp.setFinishPoint = function (position) {
      if(this._finish) {
          this._finish.geometry.setCoordinates(position);
      }
      else {
          this._finish = new ymaps.Placemark(position, { iconContent: 'Б' }, { draggable: true });
          this._finish.events.add('dragend', this._onFinishDragEnd, this);
          this._map.geoObjects.add(this._finish);
      }
      if (this._start) {
          this.geocode("finish", position);
      }
  };

  ptp.geocode = function (str, point) {
    console.log("geocode", point, str, this._start);
      ymaps.geocode(point).then(function(geocode) {
          if (str == "start") {
              this._startBalloon = geocode.geoObjects.get(0) &&
                  geocode.geoObjects.get(0).properties.get('balloonContentBody') || '';
              console.log(str + " " + this._startBalloon);
              stPoint = point;
              $scope.startPoint.address = geocode.geoObjects.get(0).properties.get('text');
              $scope.$apply();
          } else {
              this._finishBalloon = geocode.geoObjects.get(0) &&
                  geocode.geoObjects.get(0).properties.get('balloonContentBody') || '';
              console.log(str + " " + this._finishBalloon);
              finPoint = point;
              $scope.endPoint.address = geocode.geoObjects.get(0).properties.get('text');
              $scope.$apply();              
          }
          this.getDirection();
      }, this);

  };

  // $scope.setStartPoint = function(){
    
  //     map.events.add('click', function (e) {
  //       $scope.startPoint.coords = e.get('coords');

  //       // Если метка уже создана – просто передвигаем ее
  //       if ($scope.startPoint.marker) {
  //         $scope.startPoint.marker.geometry.setCoordinates($scope.startPoint.coords);
  //       }
  //       // Если нет – создаем.
  //       else {
  //         $scope.startPoint.marker = createPlacemark($scope.startPoint.coords);
  //         map.geoObjects.add($scope.startPoint.marker);
  //         // Слушаем событие окончания перетаскивания на метке.
  //         $scope.startPoint.marker.events.add('dragend', function () {
  //             getAddress($scope.startPoint.marker.geometry.getCoordinates(), 0);
  //         });
  //       }

  //       $scope.startPoint.marker.properties.set('iconContent', 'поиск...');
  //       getAddress($scope.startPoint.coords, 0);      
  //     });      
    
  // }

  // $scope.setEndPoint = function() {
  //   map.events.add('click', function (e) {
  //     $scope.endPoint.coords = e.get('coords');

  //     // Если метка уже создана – просто передвигаем ее
  //     if ($scope.endPoint.marker) {
  //       $scope.endPoint.marker.geometry.setCoordinates($scope.endPoint.coords);
  //     }
  //     // Если нет – создаем.
  //     else {
  //       $scope.endPoint.marker = createPlacemark($scope.endPoint.coords);
  //       map.geoObjects.add($scope.endPoint.marker);
  //       // Слушаем событие окончания перетаскивания на метке.
  //       $scope.endPoint.marker.events.add('dragend', function () {
  //           getAddress($scope.endPoint.marker.geometry.getCoordinates(),1);
  //       });
  //     }

  //     $scope.endPoint.marker.properties.set('iconContent', 'поиск...');
  //     getAddress($scope.endPoint.coords, 1);      
  //   }); 
  // }

  // Определяем адрес по координатам (обратное геокодирование)
  // function getAddress(coords, pointNumber) {
  //     ymaps.geocode(coords).then(function (res) {
  //         var firstGeoObject = res.geoObjects.get(0);
  //           if (pointNumber == 0) 
  //             fillStartPoint(firstGeoObject.properties.get('text'));
  //           else
  //             fillEndPoint(firstGeoObject.properties.get('text'));
  //     });
  // }

  // function fillStartPoint(address){
  //   $scope.startPoint.address = address;
  //   $scope.$apply();
  //   $scope.startPoint.marker.properties
  //     .set({
  //         iconContent: "A",
  //         balloonContent: address
  //     }); 
  // }

  // function fillEndPoint(address){
  //   $scope.endPoint.address = address;
  //   $scope.$apply();
  //   $scope.endPoint.marker.properties
  //     .set({
  //         iconContent: "Б",
  //         balloonContent: address
  //     }); 
  // }

  // // Создание метки
  // function createPlacemark(coords) {
  //     return new ymaps.Placemark(coords, {
  //         iconContent: 'поиск...'
  //     }, {
  //         preset: 'islands#circleIcon',
  //         draggable: true
  //     });
  // }

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
    $scope.checkedPoints.splice(index,1);
    console.log($scope.checkedPoints);
  };

  var allResults = [];

  $scope.getObjectsForRubricList = function(){
    $scope.rubrics.forEach($scope.getObjectsForRubric);
      
  }

  $scope.getObjectsForRubric = function(rubric){
    var region = "Томск";
    var startPointCoords = stPoint.slice(0); // было splice(0) - возможно из-за этого ошибка.
    startPointCoords.reverse();

    var endPointCoords = finPoint.slice(0); // было splice(0) - возможно из-за этого ошибка.
    endPointCoords.reverse();

    var request1 = "http://catalog.api.2gis.ru/search?what="+
      rubric+"&point="+
      startPointCoords+"&radius=1000&sort=distance&version=1.3&key=";
    var request2 = "http://catalog.api.2gis.ru/search?what="+
      rubric+"&point="+
      endPointCoords+"&radius=1000&sort=distance&version=1.3&key=";

      console.log("0 - ", allResults);

    $http.get(request1).success(function(data) {
      console.log(request1);
      console.log(rubric,"\n",data.result[0]);
       // var response = [];
      var obj = data.result[0];
              
      allResults.push({
        name : obj.name,
        address : obj.address,
        coords : [obj.lat, obj.lon],
        dist : obj.dist
      });
      console.log("1 - ", allResults);
      
      // $scope.checkedPoints.push([obj.lat, obj.lon]);
      $http.get(request2).success(function(data2) {
        // console.log(request2);
        // console.log(rubric,"\n",data2.result[0]);
         // var response = [];
        var obj = data2.result[0];
                
        allResults.push({
          name : obj.name,
          address : obj.address,
          coords : [obj.lat, obj.lon],
          dist : obj.dist
        });

        allResults.sort(function (a, b) { return a.dist-b.dist});
        // console.log("2 - ", allResults);
        $scope.checkedPoints.push(allResults[0].coords);
        console.log("3 - ", allResults[0].coords);
        
        checkedCollection.add(new ymaps.Placemark(
            allResults[0].coords, {
                balloonContentBody: allResults[0].name
            }
        ));
        map.geoObjects.add(checkedCollection);
      });
              checkedCollection.add(new ymaps.Placemark(
            allResults[0].coords, {
                balloonContentBody: allResults[0].name
            }
        ));
        map.geoObjects.add(checkedCollection);
    })
    .error(function(data, status, headers, config){
      console.log(status, headers, config);
    });

    
        
        // $scope.checkedPoints.push([obj.lat, obj.lon]);
        
        // data.result.forEach(function(obj) {
        //   response.push({
        //     name : obj.name,
        //     address : obj.address,
        //     coords : [obj.lat, obj.lon]
        //   });
        //   $scope.checkedPoints.push([obj.lat, obj.lon]);
        // });
        

  }



  function showPlacemarks(points){
    console.log("showPlacemarks", points)
    // Заполняем коллекцию данными.
    for (var i = 0, l = points.length; i < l; i++) {
        var point = points[i];
        checkedCollection.add(new ymaps.Placemark(
            point.coords, {
                balloonContentBody: point.name
            }
        ));
    }
    // Добавляем коллекцию меток на карту.
    map.geoObjects.add(checkedCollection);

  };

  $scope.startPointChanged = function(){
    if ($scope.startPoint == $scope.endPoint) {
      $scope.endPoint = null;
    };
  };

  $scope.calculatePath = function(){

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

  $scope.hideMarkers =  function () {
    checkedCollection.removeAll();
    $scope.checkedPoints = [];
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