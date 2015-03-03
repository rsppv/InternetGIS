function initialize() {
    var mapOptions = {
        center: new google.maps.LatLng(56.497303, 84.972582),
        zoom: 9,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);
}

function setMapWidth() {
	var cpWidth = $("#control_panel").width();
	var mapWidth = $("body").innerWidth() - cpWidth - 40;
	$("#map_canvas").width(mapWidth);
}