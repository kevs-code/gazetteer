/*ugly semi pointless class*/
class MapGet {
    constructor(themes) {
      this._dataLink = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
      this._mapLink = '<a href="http://www.thunderforest.com">Thunderforest</a>';
      this._attribution = 'Maps &copy; ' +this._mapLink+ ', Data &copy; ' +this._dataLink;
     
      this._tileUrl = 'https://tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png'; 
      this._baseMaps = {};
      themes.map(theme =>{
	  let tile = 'https://tile.thunderforest.com/' + theme + '/{z}/{x}/{y}.png';
	  let attribution = this._attribution;
          this._baseMaps[theme] = L.tileLayer(tile, {attribution});
      });     

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
   get baseMaps() {
     return this._baseMaps;
   }
}

const themes = ['cycle', 'transport', 'landscape', 'outdoors', 'transport-dark', 'spinal-map', 'pioneer', 'mobile-atlas', 'neighbourhood'];
// messy code
// Map Creation Globals
const myCrd = new MapGet(themes);
const attribution = myCrd.attribution;
const baseMaps = myCrd.baseMaps;
let cycle = 'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png'; 
const defaultTile = L.tileLayer(cycle, { attribution });

//
var mymap = L.map('mapid', {
    center: [myCrd.crd.latitude, myCrd.crd.longitude],
    maxZoom: 18,
    Zoom: 4,
    minZoom: 3,
    zoomControl: false,
    layers: defaultTile
});

mymap.setView(new L.LatLng(myCrd.crd.latitude, myCrd.crd.longitude), 4);


L.control.zoom({
    position: 'bottomright'
}).addTo(mymap);

//L.control.layers(baseMaps, overlayMaps).addTo(map);
L.control.layers(baseMaps, null, {position: 'bottomleft'}).addTo(mymap);


function superScary(data) {    
    if (highlight) { // teardown
        mymap.removeLayer(highlight);
    }
    stinkyPolygons(data);
}

function stinkyPolygons(data) {
    testAPI(data);//standard call
    globalCountryBorders.features.map(rest => {
        if(rest.properties.iso_a2 == data.iso_a2) {
            let states = {
                "type": "Feature",
                "properties": rest.properties,
                "geometry": rest.geometry
            }
            let centroid = getCentroid(rest.geometry.coordinates, data.iso_a2);
            updateMap(states);
        }
    });
}

// Other Globals
var globalCountryBorders;
var highlight;
var marker1;

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
  testAPI(data);//first call
}

function failure() {
  console.log("failure");
  $('#demo').html("Latitude: " + myCrd.crd.latitude + "<br>Longitude: " + myCrd.crd.longitude);
  let data = { lat: myCrd.crd.latitude, lng: myCrd.crd.longitude };
  testAPI(data);//first call
}

/*rethink needed*/
function testAPI(data) {
    let args = { url: myCrd.ajaxUrl, type: 'POST', dataType: 'json', data: data };
    console.log('start');
    
    doAjax(args).then(result => {
    console.log(result);
    /*do something else
        let newcrd = {
	    latitude: result['data'][0].geometry.lat,
	    longitude: result['data'][0].geometry.lng
	    };
    mapSetView(newcrd);
    */
    });
}

function mapSetView(crd) {
    mymap.setView(new L.LatLng(crd.latitude, crd.longitude), 4);
}

async function doAjax(args) {
    let result;
    let result2;
    try {

        if (!args.data.iso_a2) {
            result = await $.ajax(args);
            args.data = { iso_a2: result['data'].trim() }
            return superScary(args.data);
        } 
        
        result2 = await $.ajax(args);
        return result2;
	} catch (error) {
		console.log(error);  //error.log
	}
}

function readJsonFileToPopulate(file) {
    $.getJSON(file, function(geo) {
        let json  = geo.features;
        jsonSortByName(json);
        globalCountryBorders = geo;  // Global
        populateCountryDropdown('#test', geo);
    });
}
function jsonSortByName(json) { // specific use case - meh!
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
    console.log('hello');
    console.log($(this).text());
    let data = { iso_a2: $(this).attr("iso_a2") };
    superScary(data);
});

// meh
var myIcon;
function getFlag(cid) {
let imgUrl = `http://www.countryflags.io/${cid}/shiny/64.png`;
myIcon = L.icon({
    iconUrl: imgUrl
});
}
//mmm meh
function updateMap(states) {
var myStyle = { "color": "#0000FF" };
highlight = L.geoJSON(states, { style: myStyle }).addTo(mymap);
mymap.fitBounds(highlight.getBounds());//, {padding: {20 ,20}});
}
//meh
function getCentroid(coord, smurf) {
    if (marker1) {
        mymap.removeLayer(marker1);
    }
    obj = (coord.length > 1) ? coord[0] : coord;
    let polygon = turf.helpers.polygon(obj);
    let centroid = turf.centroid(polygon);
    getFlag(smurf);
    marker1 = L.marker([centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]], {icon: myIcon} );
    marker1.addTo(mymap);

    return centroid;
}

$(function () {
    $('#preloader').hide();
    readJsonFileToPopulate('countryBorders.geo.json'); 
    getLocation();
}); 
