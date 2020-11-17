// GOAL KEEP IT WORKING FIRST THEN TIDY!
const attribution = 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest</a>, Data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';

const tileUrl = 'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png';
var globalMess;
var highlight;
// GB default fields
let crd = {
     latitude: 54.7023545,
     longitude: -3.2765753
    };
var mymap = L.map('mapid').setView([crd.latitude, crd.longitude], 4);
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(mymap);
//GLOBALS ABOVE

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, failure);
  } else {
    getCountryCoords(crd);
    $('#demo').html("Geolocation not supported by this browser.");
  }
}

function success(pos) {
  let crd = pos.coords;
  $('#demo').html("Latitude: " + crd.latitude + "<br>Longitude: " + crd.longitude);
  getCountryCoords(crd);
}

function failure() {
  $('#demo').html("Latitude: " + crd.latitude + "<br>Longitude: " + crd.longitude);
  getCountryCoords(crd);
}

$.getJSON("countryBorders.geo.json", function(geo) {
  let json  = geo.features;

    json.sort(function(a, b){
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
   globalMess = geo;
   populateDropdownFromObjectLiteral('#test', geo);
});

function populateDropdownFromObjectLiteral(selector, geo) {
    let dropMenu = $(selector);
    const dropItems = geo.features.map(rest => {
            let listItem =$('<li/>');
            let row = $('<a/>');
            row.attr({
                // "href": "#",
                "class": "dropdown-item",
                "iso_a2": rest.properties.iso_a2,
		"iso_a3": rest.properties.iso_a3,
		"iso_n3": rest.properties.iso_n3
            });
         row.html(rest.properties.name);
         listItem.append(row);
         dropMenu.append(listItem);
	 // do something with rest.geometry.coordinates
    });
	//console.log(geo.features);
}
//suprise

//read result

// end

function getCountryCoords(crd) {
    let data = { lat: crd.latitude, lng: crd.longitude };
	console.log('start');
    getAPI(data).then(result => {
        let newcrd = {
	    latitude: result.geometry.lat,
	    longitude: result.geometry.lng
	};
	initializeMap(newcrd);
    });
}

//needs work to update nationally only!
function initializeMap(crd) {
    mymap.setView(new L.LatLng(crd.latitude, crd.longitude), 4);
}
//simple promise function needs improve later
async function getAPI(data) {
	let result;
	try {
		if (!data.iso_a2) {
		console.log('fire1');
		// promise 1
		result = await $.ajax({
			url: "libs/php/getCountryCode.php",
			type: 'POST',
			dataType: 'json',
			data: data
		});
                console.log(result['data'].trim());
		} else {
		    result = { data: data.iso_a2 };
		}
                // promise 2
		result2 = await $.ajax({
			url: "libs/php/getCountryCode.php",
			type: 'POST',
			dataType: 'json',
			data: {
			    iso_a2: result['data'].trim()
			}
		});
		console.log(result2);
		return result2['data'][0];
	} catch (error) {
		console.log(error);
	}
}
// end

//main
$('#test li a').click(function() {
console.log('hello world');
console.log($(this).attr("neo"));
}); //check document against working approach below!

$(document).on('click', '#test li a', function() {
    //globalName = $(this).attr("iso_a3"); 
    if (highlight) {
    mymap.removeLayer(highlight);
    }
    console.log('hello');
    console.log($(this).text());
    console.log($(this).attr("iso_a2"));
    let data = { iso_a2: $(this).attr("iso_a2") };
    testCoords(data);
    
   //test
   
    const dropItems = globalMess.features.map(rest => {
	if(rest.properties.iso_a2 == $(this).attr("iso_a2")) {
	 // do something with rest.geometry.coordinates
         // console.log(rest.geometry.coordinates);
        let states = {
            "type": "Feature",
            "properties": rest.properties,
            "geometry": rest.geometry
	}
	console.log(states);
	updateMap(states);
	}
    });
});

function updateMap(states) {
var myStyle = { "color": "#0000FF" };
highlight = L.geoJSON(states, { style: myStyle }).addTo(mymap);
}
/*
function updateMap(crd) {
    mymap.setView(new L.LatLng(crd.latitude, crd.longitude), 4);
}
*/

//  map.panTo(new L.LatLng(lat, lng));
//  map.setView(new L.LatLng(lat, lng), 8);
function testCoords(data) {
    console.log('start');
    getAPI(data).then(result => {
        let newcrd = {
	    latitude: result.geometry.lat,
	    longitude: result.geometry.lng
	};
	initializeMap(newcrd);
    });
}



// recommended approach to document ready!
$(function () {
    $('#preloader').hide();
    getLocation();
}); 


