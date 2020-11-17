// GOAL TIDY!
// CAN I MAKE THIS CLASS USEFUL?
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

/*
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
const myCrd = new MapGet('mobile-atlas');
const attribution = myCrd.attribution;
console.log(attribution);
var mymap = L.map('mapid').setView([myCrd.crd.latitude, myCrd.crd.longitude], 4);
const tiles = L.tileLayer(myCrd.tileUrl, { attribution });

tiles.addTo(mymap);

//globals for reference
var globalMess;// obj.properties.name sorted countryBorders.geo.json.features obj
var highlight;// highlight = L.geoJSON(states, { style: myStyle }).addTo(mymap);



//THIS LOOKS LIKE A CLASS
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, failure);
  } else {
    $('#demo').html("Geolocation not supported by this browser.");
    let data = { lat: myCrd.crd.latitude, lng: myCrd.crd.longitude };
    testCoords(data);//or just call failure();
  }
}

function success(pos) {
  let crd = pos.coords;
  $('#demo').html("Latitude: " + crd.latitude + "<br>Longitude: " + crd.longitude);
  let data = { lat: crd.latitude, lng: crd.longitude };
  testCoords(data);
}

function failure() {
  $('#demo').html("Latitude: " + crd.latitude + "<br>Longitude: " + crd.longitude);
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
	initializeMap(newcrd);
    });
}
//needs work to update nationally only!
function initializeMap(crd) {
    mymap.setView(new L.LatLng(crd.latitude, crd.longitude), 4);
}

//SO DOES THIS
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
   globalMess = geo;//could try xom
   populateDropdownFromObjectLiteral('#test', geo);
});

function populateDropdownFromObjectLiteral(selector, geo) {
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

async function doAjax(args) {
    let result;
    let result2;
    try {
        if (!args.data.iso_a2) {
            result = await $.ajax(args);
            args.data = { iso_a2: result['data'].trim() }
        } 
        
        result2 = await $.ajax(args);
        console.log(result2);  
        return result2['data'][0];
	} catch (error) {
		console.log(error);//error.log
	}
}

$(document).on('click', '#test li a', function() {
    if (highlight) {
    mymap.removeLayer(highlight);
    }
    console.log('hello');
    console.log($(this).text());
    console.log($(this).attr("iso_a2"));
    let data = { iso_a2: $(this).attr("iso_a2") };
    testCoords(data);
   //test 
   const dropItems = globalMess.features.map(rest => {//is dropItems live still instead
	if(rest.properties.iso_a2 == $(this).attr("iso_a2")) {
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

// recommended approach to document ready!
$(function () {
    $('#preloader').hide();
    getLocation();
}); 


