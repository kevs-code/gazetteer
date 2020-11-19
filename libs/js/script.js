// GOALS: ADD THEMES, API RESPONSE MODAL DETAILS, USE CENTROID OR RETURN COORDS VALUE TO PLACE COUNTRTFLAG.io with L.marker return to cleaner code

// SETTING INITIAL VIEW BY CURRENT country LOCATION NEEDS changing from mapSetView to polygon mapfitBounds like the rest

// AS - IDEA TO ADD AREA, THEN BUBBLESORT AND CLUSTER ZOOM LEVEL BEFORE CALLING mapSetView ALREADY DONE BETTER BY MAPFIT BOUNDS

class MapGet {
    constructor(tileStyle = 'cycle') {
      this._dataLink = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
      this._mapLink = '<a href="http://www.thunderforest.com">Thunderforest</a>';
      this._attribution = 'Maps &copy; ' +this._mapLink+ ', Data &copy; ' +this._dataLink;
      this._tileUrl = 'https://tile.thunderforest.com/' + tileStyle + '/{z}/{x}/{y}.png';
      this._latitude = 54.7023545;
      this._longitude = -3.2765753;
      this._ajaxUrl = "libs/php/getCountryCode.php";
    } 
    get tileUrl() {
      return this._tileUrl;
    }
    get attribution() {
      return this._attribution;
    }

    get ajaxUrl() {
      return this._ajaxUrl;
    }
    get crd() {  
      return {
          latitude: this._latitude,
          longitude: this._longitude
      }
    }
}

/* THEMES
cycle
transport
Landscape
outdoors
transport-dark
spinal-map
pioneer
mobile-atlas
neighbourhood
*/

/* THIS WILL FIX MAP CONTROLS

var map = L.map('map', {
    maxZoom: 20,
    minZoom: 6,
    zoomControl: false
});

L.control.zoom({
    position: 'bottomright'
}).addTo(map);

*/

/*use turf.js to get area and control map zoom not required now add polygon to initial country instead of setview, choose centroid instead for map saves pan time rest of testCoords good for getting opencage api return still*/

// Map Creation Globals
const myCrd = new MapGet('mobile-atlas');
const attribution = myCrd.attribution;
console.log(attribution);
var mymap = L.map('mapid').setView([myCrd.crd.latitude, myCrd.crd.longitude], 4);
const tiles = L.tileLayer(myCrd.tileUrl, { attribution });
tiles.addTo(mymap);

// Other Globals
var globalCountryBorders;
var highlight;

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, failure);
  } else {
    failure();
  }
}

function success(pos) {
  let crd = pos.coords;
  $('#demo').html("Latitude: " + crd.latitude + "<br>Longitude: " + crd.longitude);
  let data = { lat: crd.latitude, lng: crd.longitude };
  testCoords(data);
}

function failure() {
  console.log("failure");
  $('#demo').html("Latitude: " + myCrd.crd.latitude + "<br>Longitude: " + myCrd.crd.longitude);
  let data = { lat: myCrd.crd.latitude, lng: myCrd.crd.longitude };
  testCoords(data);
}


function testCoords(data) {
    let args = { url: myCrd.ajaxUrl, type: 'POST', dataType: 'json', data: data };
    console.log('start');
    doAjax(args).then(result => {
        let newcrd = {
	    latitude: result.geometry.lat,
	    longitude: result.geometry.lng
	};
	mapSetView(newcrd);
    });
}

async function doAjax(args) {
    let result;
    let result2;
    try {

        if (!args.data.iso_a2) {
            result = await $.ajax(args);
            args.data = { iso_a2: result['data'].trim() }
        } 
        
        result2 = await $.ajax(args);
        console.log(result2);  //return result2 removes specifice use case
        return result2['data'][0];
	} catch (error) {
		console.log(error);  //error.log
	}
}


function mapSetView(crd) {
    mymap.setView(new L.LatLng(crd.latitude, crd.longitude), 4);
}

function readJsonFileToPopulate(file) {
    $.getJSON(file, function(geo) {
        let json  = geo.features;
        jsonSortByName(json);
	console.log(geo); // need data again
        globalCountryBorders = geo;  // Global
        populateCountryDropdown('#test', geo);
    });
}
//investigate merge sort neumann etc
function jsonSortByName(json) { // specific use case
    json.sort(function(a, b){//bubble sort
        var nameA = a.properties.name.toUpperCase();
        var nameB = b.properties.name.toUpperCase();
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    });
};

function populateCountryDropdown(selector, geo) {
    let dropMenu = $(selector);
    geo.features.map(rest => {
        let listItem =$('<li/>');
        let row = $('<a/>');
        row.attr({
            "class": "dropdown-item",
            "iso_a2": rest.properties.iso_a2,
		    "iso_a3": rest.properties.iso_a3,
		    "iso_n3": rest.properties.iso_n3
            });
         row.html(rest.properties.name);
         listItem.append(row);
         dropMenu.append(listItem);
    });
}

$(document).on('click', '#test li a', function() {
    if (highlight) { // teardown
    mymap.removeLayer(highlight);
    }
    console.log('hello');
    console.log($(this).text());
    let data = { iso_a2: $(this).attr("iso_a2") };
    //testCoords(data);//still needed for api right!
    // reinventing the wheel not needed as mapfitbounds does better than this with zoom by area, bubble sort, and cluster would.

    //get newPolygon belongs in a function
    globalCountryBorders.features.map(rest => {
	if(rest.properties.iso_a2 == $(this).attr("iso_a2")) {
            let states = {
                "type": "Feature",
                "properties": rest.properties,
                "geometry": rest.geometry
	    }
            console.log(rest.geometry.coordinates);
	    let area = getAreaBasic(rest.geometry.coordinates);
            console.log(area);
	    
	    console.log(states);
	    updateMap(states);
	}
    });
});

/* this will add flags ...
<img src="https://www.countryflags.io/{iso_a2}/{option}/64.png">
option = flat or shiny
var marker1 = L.marker([single_coord_pair], {icon: blackIcon});
var marker2 = L.marker([single_coord_pair], {icon: img src=country.io});

marker1.addTo(map)

or ... featureGroup extends layergroup look at doc

var featureGroup = L.featureGroup([marker1, marker2 ...]).addTo(map);
*/ 




function updateMap(states) {
var myStyle = { "color": "#0000FF" };
highlight = L.geoJSON(states, { style: myStyle }).addTo(mymap);
//seen the light
mymap.fitBounds(highlight.getBounds());//, {padding: {20 ,20}});
}

// this is the wrong way to go try map.fitBounds();
function getAreaBasic(coord) {
    let areaSum = 0;
    if (coord.length > 1) {
        coord.map(region => {
	    let polygon = turf.helpers.polygon(region);
	    areaSum += turf.area(polygon);
        });
	return Math.round(areaSum/ 10 ** 6);// polygon draw size km**2
    } else {
        let polygon = turf.helpers.polygon(coord);
        return Math.round(turf.area(polygon)/ 10 ** 6);
    }
}
//above maybe useful for centroid instead?
$(function () {
    $('#preloader').hide();
    readJsonFileToPopulate('countryBorders.geo.json'); 
    getLocation();
}); 
