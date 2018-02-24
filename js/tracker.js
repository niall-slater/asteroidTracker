var asteroidData;
var todaysList;

var url = "https://api.nasa.gov/neo/rest/v1/feed/today?detailed=true&api_key="
var orl = "https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key="

var APIkey = "pstzZjbvMv1XaKd63Y4A8cvXgteLarNjCmjs0OKF";

var canvasWidth = document.getElementById("canvas").width;
var canvasHeight = document.getElementById("canvas").height;


var earthRadius = convertKmToPixels(6371);
var earthX;
var earthY;

var sunRadius = earthRadius * 109/12;

var canvas;
var ctx;

getAsteroids();

function getAsteroids() {
	
	httpGetAsync(url + APIkey, function(result) {
		
		asteroidList = result;
		drawObjects();
	});
}


function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function drawObjects() {
	
	canvas = document.getElementById("canvas");
	
	ctx = canvas.getContext("2d");
	
	asteroidData = JSON.parse(asteroidList);
	todaysList = asteroidData.near_earth_objects[getDate()];
	console.log(todaysList);
    
	earthX = canvasWidth/2 - earthRadius;
	earthY = canvasHeight/2 - earthRadius;
	drawObject(earthX, earthY, earthRadius, 'blue');
	drawObject(earthX + convertAUToPixels(1), earthY, earthRadius * 2, 'yellow');
	
	drawAsteroids();
}

function drawObject(x, y, r, color) {
	
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI, false);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.lineWidth = .25;
	ctx.strokeStyle = '#fff';
	ctx.stroke();
}

function drawAsteroids() {
	
	for (var i = 0; i < todaysList.length; i++) {
		var asteroid = todaysList[i];
		var dist_aphelion = asteroid.orbital_data.aphelion_distance;
		var dist_perihelion = asteroid.orbital_data.perihelion_distance;
		roughPerihelion = convertAUToPixels(dist_perihelion);
		roughAphelion = convertAUToPixels(dist_aphelion);
		drawObject(earthX + roughPerihelion, earthY, earthRadius * (asteroid.estimated_diameter.kilometers.estimated_diameter_max/2), '#a07039');
	}
}

function getDate() {
    
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0, so add 1
    var yyyy = today.getFullYear();

    if(dd < 10) {
        dd = '0' + dd
    } 

    if(mm < 10) {
        mm = '0' + mm
    } 

    today = yyyy + "-" + mm + "-" + dd;
    return today;

}
	
function convertKmToPixels(km) {
	//Convert a distance in kilometres to a consistent distance in pixels that will fit on the canvas.
	
	var ratio = 637.1;	//this puts earth's radius (6371km) at 10 pixels
	
	var scaleMultiplier = 1;
	
	return km * 1/ratio * scaleMultiplier;
}
	
function convertAUToPixels(au) {
	//We're drawing the sun 200 pixels to the right of earth to help visualise the
	//orbits of asteroids, so for the time being 200px = 1AU. Sizes not to scale, though.
		
	var ratio = 1/200;	//this puts 1 AU at 200 pixels
	
	return au * 1/ratio;
}