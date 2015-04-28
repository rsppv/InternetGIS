 'use strict';

 /* Controllers */

 var InternetGis = angular.module('InternetGis', []);


 InternetGis.controller('MainCtrl', function($scope, $http) {

   /* Fields */
   var map;
   var ptp               = DeliveryCalculator.prototype;
   var calculator;
   var stPoint;          // Точка начала маршрута
   var finPoint;         // Точка конца маршрута
   var checkedCollection;// Точки интереса для построения маршрута, отобранные фильтром
   
   
   /* Properties */
   $scope.rubrics        = []; // список рубрик (типы точек интереса)
   $scope.checkedPoints  = []; // промежуточные точки для построения маршрута
   $scope.startPoint     = {
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
   angular.element(document).ready(function() {            // Ждем прогрузки документа
    ymaps.ready(initialize);                               // Ждем подгрузки модуля от Яндекс и запускаем инициализацию
    setMapWidth();                                         // Подгоняем размер блока с картой с учетом панели управления
    $(window).on('resize orientationChanged', setMapWidth);// перестроение при изменении свойств окна
   });

   /* Methods */
   function initialize() {
     /* Инициализация карты от 2ГИС */

     // DG.then(function () {
     //     map = DG.map('map', {
     //         center: [56.49, 84.97],
     //         zoom: 13,
     //         geoclicker: true
     //     });
     // });

     // Инициализация карты от Яндекс
     // с центром карты в Томске
     // с подключением контролов
     map = new ymaps.Map("map", {
       center: [56.49, 84.97],
       zoom: 12,
       controls: ["fullscreenControl", "searchControl", "routeEditor"]
     });

     checkedCollection = new ymaps.GeoObjectCollection();
     setMapWidth();
     // Для построения маршрута
     calculator = new DeliveryCalculator(map, map.getCenter());
   };

   function DeliveryCalculator(map, finish) {
     this._map = map;
     this._start = null;
     this._route = null;
     this._startBalloon;
     this._finishBalloon;

     // Добавление слушателя события на карте
     map.events.add('click', this._onClick, this);
   }

   // Обработчик события клика по карте
   ptp._onClick = function(e) {
     console.log("onclick", this._start);
     // Если точка А задана, ставим Б
     if (this._start) {
       this.setFinishPoint(e.get('coords'));
     } else {
       this.setStartPoint(e.get('coords'));
     }
   };

   // Обработчик события окончания перетаскивания начальной точки по карте
   ptp._onStartDragEnd = function(e) {
     console.log("dragStart", this._start);
     var coords = this._start.geometry.getCoordinates();
     this.geocode("start", coords);
   };

   // Обработчик события окончания перетаскивания конечной точки по карте
   ptp._onFinishDragEnd = function(e) {
     console.log("dragEnd", this._finish);
     var coords = this._finish.geometry.getCoordinates();
     this.geocode("finish", coords);
   };

   // Построение маршрута через промежуточные точки
   ptp.getDirection = function() {
     console.log("directions", this._start, $scope.startPoint);
     // Если маршрут уже построен, то удаляем
     if (this._route) {
       this._map.geoObjects.remove(this._route);
     }

     // Считаем маршрут только если точки А и Б заданы
     if (this._start && this._finish) {
       console.log("промежуточные т-ки 1", $scope.checkedPoints);

       var self          = this,
           start         = this._start.geometry.getCoordinates(), // получаем координаты точки А
           finish        = this._finish.geometry.getCoordinates(),// получаем координаты точки Б
           startBalloon  = this._startBalloon,                    // получаем начальный балун
           finishBalloon = this._finishBalloon,                   // получаем конечный балун
           allPoints     = $scope.checkedPoints.slice(0);         // копируем промеж точки

       // Добавляем точку А и Б в массив
       allPoints.unshift(start);
       allPoints.push(finish);

       console.log("Все точки маршрута \n", allPoints);

       // Строим маршрут по точкам
       ymaps.route(allPoints)
         .then(function(router) {
           self._route = router.getPaths();
           // настройки отображения маршрута
           self._route.options.set({
             strokeWidth: 5,
             strokeColor: '0000ffff',
             opacity: 0.5
           });
           // отображаем на карте
           self._map.geoObjects.add(self._route);
         });
       // подгоняем масштаб карты под маршрут  
       self._map.setBounds(self._map.geoObjects.getBounds());
     }
   };

   // установка точки А
   ptp.setStartPoint = function(position) {
     // пришли координаты
     console.log("setStPoint", position, this._start);
     // если она уже есть - меняем координаты
     if (this._start) {
       this._start.geometry.setCoordinates(position);
       //$scope.startPoint.coords = this._start.geometry.getCoordinates();
       console.log("setStPoint", position, this._start);
     } else { // если точки А нету - создаем перетаскиваемый маркер
       this._start = new ymaps.Placemark(position, {
         iconContent: 'А'
       }, {
         draggable: true
       });
       // Добавляем слушателя события по окончанию переноса точки
       this._start.events.add('dragend', this._onStartDragEnd, this);
       // отображаем
       this._map.geoObjects.add(this._start);
       //$scope.startPoint.coords = this._start.geometry.getCoordinates();
       console.log("setStPoint", position, this._start);
     }
     // вытаскиваем адрес для заполнения полей
     this.geocode("start", position);
   };

   // установка точки Б
   ptp.setFinishPoint = function(position) {
     // если она уже есть - меняем координаты
     if (this._finish) {
       this._finish.geometry.setCoordinates(position);
     } else { // если точки Б нету - создаем перетаскиваемый маркер
       this._finish = new ymaps.Placemark(position, {
         iconContent: 'Б'
       }, {
         draggable: true
       });
       // слушаем событие
       this._finish.events.add('dragend', this._onFinishDragEnd, this);
       // отображаем
       this._map.geoObjects.add(this._finish);
     }
     // вытаскиваем адрес точки Б
     if (this._start) {
       this.geocode("finish", position);
     }
   };

   // геокодируем координаты в адрес для заполнения форм
   ptp.geocode = function(str, point) {
     console.log("geocode", point, str, this._start);
     // обращаемся к сервису геокодирования
     ymaps.geocode(point).then(function(geocode) {
       // обрабатываем для точки А
       if (str == "start") {
         this._startBalloon = geocode.geoObjects.get(0) &&
           geocode.geoObjects.get(0).properties.get('balloonContentBody') || '';
         console.log(str + " " + this._startBalloon);
         stPoint = point;
         // обновляем поля в html с адресом
         $scope.startPoint.address = geocode.geoObjects.get(0).properties.get('text');
         $scope.$apply();
       // обрабатываем для точки Б
       } else {
         this._finishBalloon = geocode.geoObjects.get(0) &&
           geocode.geoObjects.get(0).properties.get('balloonContentBody') || '';
         console.log(str + " " + this._finishBalloon);
         finPoint = point;
         // обновляем поля в html с адресом
         $scope.endPoint.address = geocode.geoObjects.get(0).properties.get('text');
         $scope.$apply();
       }
       // строим маршрут
       this.getDirection();
     }, this);

   };


   // подгон размера дива с учетом панели
   function setMapWidth() {
     var cpWidth = $("#control_panel").width();
     var mapWidth = $("body").innerWidth() - cpWidth - 40;
     $("#map").width(mapWidth);
   };

   // добавляем рубрику (тип точки интереса) в список
   // список тот что справа
   $scope.addRubric = function() {
     if ($scope.newRubric == '') return;
     // если такой в списке нет - добавляем
     // иначе варнинг
     if ($scope.rubrics.indexOf($scope.newRubric) == -1) {
       $scope.rubrics.push($scope.newRubric);
       // getObjectsForRubric($scope.newRubric);
       $scope.newRubric = '';
     } else {
       $("#search-box").notify(
         "Уже в списке", {
           position: "bottom left"
         }
       );
     }
   };

   /* Удаляем рубрику из списка */
   $scope.removeRubric = function(index) {
     console.log($scope.rubrics.splice(index, 1));
     // console.log("Remained: ", $scope.rubrics);
     $scope.checkedPoints.splice(index, 1);
     // console.log($scope.checkedPoints);
   };

   var allResults = []; // для хранения промеж результатов для маршрута

   // находим объекты по всем рубрикам в списке
   $scope.getObjectsForRubricList = function() {
     // очищаем маркеры и массив прмеж точек
     checkedCollection.removeAll();
     $scope.checkedPoints = [];
     // получаем результат по каждой рубрике
     $scope.rubrics.forEach($scope.getObjectsForRubric);
   }

   // Через 2ГИС ищем 1 близлежащий объект к контрольным точкам (А и Б)
   $scope.getObjectsForRubric = function(rubric) {
     var region                  = "Томск";
     // копируем координаты А и Б
     var startPointCoords        = stPoint.slice(0); // было splice(0) - ошибка исправлена.
     var endPointCoords          = finPoint.slice(0); // было splice(0) - ошибка исправлена.
     
     // транформируем координаты, для 2ГИС
     startPointCoords.reverse();
     endPointCoords.reverse();

     // запрос для поиска объектов вокруг А
     var request1                = "http://catalog.api.2gis.ru/search?what=" +
           rubric + "&point=" +
           startPointCoords + "&radius=1000&sort=distance&version=1.3&key=";
     // запрос для поиска объектов вокруг Б
     var request2                = "http://catalog.api.2gis.ru/search?what=" +
           rubric + "&point=" +
           endPointCoords + "&radius=1000&sort=distance&version=1.3&key=";

     // асинхронный запрос для А, ждем результата и переходим внутрь
     $http.get(request1).success(function(data) {
         //console.log(request1);
         //console.log(rubric, "\n", data.result[0]);
         //var response = [];

         //результаты отсоритированы по расстоянию, берем ближний
         var obj = data.result[0];
         // обрабатываем JSON
         // сохраняем название адрес и координаты
         allResults.push({
           name: obj.name,
           address: obj.address,
           coords: [obj.lat, obj.lon],
           dist: obj.dist
         });

         // console.log("1 - ", allResults);
         // $scope.checkedPoints.push([obj.lat, obj.lon]);

         // запускаем асинхронный запрос для Б
         $http.get(request2).success(function(data2) {
           // console.log(request2);
           // console.log(rubric,"\n",data2.result[0]);
           var obj = data2.result[0];
           // ближайший результат сохраняем, там уже лучший результат от А
           allResults.push({
             name: obj.name,
             address: obj.address,
             coords: [obj.lat, obj.lon],
             dist: obj.dist
           });
           // выбираем лучший из них, из ближнего к А и ближнего к Б
           allResults.sort(function(a, b) {
             return a.dist - b.dist
           });
           // console.log("2 - ", allResults);
           $scope.checkedPoints.push(allResults[0].coords);

           //console.log("3 - ", allResults[0].coords);
           // отображаем одну лучшую метку для рубрики
           checkedCollection.add(new ymaps.Placemark(
             allResults[0].coords, {
               balloonContentBody: allResults[0].name
             }
           ));
           map.geoObjects.add(checkedCollection);
         });

       })
       .error(function(data, status, headers, config) {
         console.log(status, headers, config);
       });
   }


   // Отображение маркеров для переданных точек
   // Переданные точки как массив объектов
   function showPlacemarks(points) {
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

   // Очистка маркеров для промежуточных точек
   // Очистка массива промежуточных точек
   $scope.hideMarkers = function() {
     checkedCollection.removeAll();
     $scope.checkedPoints = [];
   };

 });