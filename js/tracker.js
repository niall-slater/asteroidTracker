var asteroidData;
var todaysList;

var asteroidObjects = [];

var url = "https://api.nasa.gov/neo/rest/v1/feed/today?detailed=true&api_key="

//This shouldn't really be public but I think we'll -probably- be okay
var APIkey = "pstzZjbvMv1XaKd63Y4A8cvXgteLarNjCmjs0OKF";

var canvasWidth = document.getElementById("canvas").width;
var canvasHeight = document.getElementById("canvas").height;

var earthRadius = convertKmToPixels(6371);	//6371 is the earth's radius in kilometres
var earthX;
var earthY;

var sunRadius = earthRadius * 109/12;	//Turns out the Sun's pretty big. Never mind.
var pixelsPerAU = 400;

var canvas;
var ctx;

getAsteroids();

function getAsteroids() {
	
	httpGetAsync(url + APIkey, function(result) {
		
		//Grab NASA's list of today's near-earth objects
		asteroidList = result;
		drawMap();
	});
}


function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
	
	//True for asynchronous, false for synchronous
    xmlHttp.open("GET", theUrl, true);
    xmlHttp.send(null);
}

function drawMap() {
	
	canvas = document.getElementById("canvas");
	
	ctx = canvas.getContext("2d");
	
	asteroidData = JSON.parse(asteroidList);
	todaysList = asteroidData.near_earth_objects[getDate()];
	console.log(todaysList);
    
	earthX = canvasWidth/2 - earthRadius;
	earthY = canvasHeight/2 - earthRadius;
	drawObject(earthX, earthY, earthRadius, '#0045ff');
	
	//Draw the sun off to one side to help compare distance (but not size)
	drawObject(earthX + convertAUToPixels(1), earthY, earthRadius * 4, 'rgb(255, 196, 0)');
	
	drawAsteroids();
}

function drawObject(x, y, r, color) {
	
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI, false);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
	ctx.stroke();
}

function drawAsteroids() {
	
	for (var i = 0; i < todaysList.length; i++) {
		
		var asteroid = todaysList[i];
		asteroidObjects[i] = asteroid;
		
		/*
		The aphelion is the highest point in an object's orbit, and
		the perihelion is the lowest point. We can roughly visualise
		an object's position relative to earth in 2D space by sticking
		it one perihelion's distance away.
		*/
		
		var dist_aphelion = asteroid.orbital_data.aphelion_distance;
		var dist_perihelion = asteroid.orbital_data.perihelion_distance;
		
		roughPerihelion = convertAUToPixels(dist_perihelion);
		roughAphelion = convertAUToPixels(dist_aphelion);
		
		//Rotate them all evenly around the Earth to space them out:	
		var rotation = (i / todaysList.length) * 360;	
		var vector = rotate(earthX, earthY, roughPerihelion, roughPerihelion, rotation);		
		var asteroidX = vector[0];
		var asteroidY = vector[1];
		
		//Label asteroids with their names
		var name = asteroid.name;
		var diameter = asteroid.estimated_diameter.kilometers.estimated_diameter_max;
		var hazardous = asteroid.is_potentially_hazardous_asteroid;
		if (hazardous) {
			hazardous = "Potentially hazardous";
		} else {
			hazardous = "Not hazardous";
		}
		var miss = asteroid.close_approach_data[0].miss_distance.lunar;
		
		ctx.font = "10px Arial";
		
		var gradient = ctx.createLinearGradient(0,0,canvas.width,0);
		gradient.addColorStop("0","#3cc43c");
		gradient.addColorStop("1","#cbffc7");
		
		var textOffsetX = 64;
		var textOffsetY = 64;
		// Fill with gradient
		ctx.fillStyle = gradient;

		//Canvas doesn't have multi-line rendering?? GOTTA DO EVERYTHING MYSELF I GUESS		
		var lineHeight = 16;
		ctx.fillText(name, asteroidX - textOffsetX, asteroidY - textOffsetY);
		ctx.fillText(Math.round(diameter*1000) + "m wide", asteroidX - textOffsetX, asteroidY - textOffsetY + lineHeight);
		ctx.fillText(hazardous, asteroidX - textOffsetX, asteroidY - textOffsetY + lineHeight * 2);
		ctx.fillText("Miss by " + Math.round(miss) + " moons", asteroidX - textOffsetX, asteroidY - textOffsetY + lineHeight * 3);
		
		ctx.beginPath();
		ctx.strokeStyle = "rgba(10, 255, 0, 0.57)"
		ctx.setLineDash([4, 2]);
		ctx.lineWidth = 2;
		ctx.moveTo(asteroidX - 4, asteroidY - 1);
		ctx.lineTo(asteroidX - 32, asteroidY - 12);
		ctx.stroke();
		
		ctx.setLineDash([0]);
		
		var asteroidScaleMultiplier = 5;
		
		//Draw asteroid last, so it's on top of the lines.
		drawObject(asteroidX, asteroidY, diameter * asteroidScaleMultiplier, 'rgba(181, 122, 53, 1)');
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
	
	//This just sizes the planets up and down
	var scaleMultiplier = 2;
	
	return km * 1/ratio * scaleMultiplier;
}
	
function convertAUToPixels(au) {
	//We're drawing the sun 200 pixels to the right of earth to help visualise the
	//orbits of asteroids, so for the time being 200px = 1AU. Sizes not to scale, though.
		
	var ratio = 1/pixelsPerAU;	//this puts 1 AU at 200 pixels
	
	return au * 1/ratio;
}

function rotate(cx, cy, x, y, angle) {
	
	//Rotate a point around another point in 2D space, by an angle (given in degrees)
	var radians = (Math.PI / 180) * angle,
		cos = Math.cos(radians),
		sin = Math.sin(radians),
		nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
		ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
	return [nx, ny];
}