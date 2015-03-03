var geocoder;
var map;
var geocodeResult;

function initialize() {
    geocoder = new google.maps.Geocoder();
    var mapOptions = {
        center: new google.maps.LatLng(56.497303, 84.972582),
        zoom: 9,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);
}

function setMapWidth() {
  var cpWidth = $("#control_panel").width();
  var mapWidth = $("body").innerWidth() - cpWidth - 40;
  $("#map_canvas").width(mapWidth);
}

function codeAddress() {
  var address = document.getElementById('city-address').value;
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location
      });
    } else {
      geocodeResult = status;
    }
  });
}