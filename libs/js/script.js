//setup map
const BASE = (function initialize() {
    const dataLink = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
    const mapLink = '<a href="http://www.thunderforest.com">Thunderforest</a>';
    const attribution = 'Maps &copy; ' +mapLink+ ', Data &copy; ' +dataLink;
    const tileThemes = ['cycle', 'transport', 'landscape', 'outdoors', 'transport-dark',
	                'spinal-map', 'pioneer', 'mobile-atlas', 'neighbourhood'];
    const tiles = {};
    tileThemes.map(theme =>{
	let tile = 'https://tile.thunderforest.com/' + theme + '/{z}/{x}/{y}.png';
        tiles[theme] = L.tileLayer(tile, {attribution});
    });
    let lmap = L.map('mapid', {maxZoom: 18, minZoom: 3,
	                zoomControl: false, layers: tiles.cycle});                           
    L.control.zoom({position: 'bottomright'}).addTo(lmap);
    L.control.layers(tiles, null, {position: 'bottomleft'}).addTo(lmap);
    const coord = [54.7023545, -3.2765753];
    lmap.setView(new L.LatLng(coord[0], coord[1]), 4);   
    return {       
        lmap: lmap,
        coord: coord
    }
}());

function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, failure);
    } else {
      failure();
    }
}

function success(pos) {
    let crd = pos.coords;
    let data = { lat: crd.latitude, lng: crd.longitude };
    testAPI(data);
}
  
function failure() {
    let data = { lat: BASE.coord[0], lng: BASE.coord[1] };
    testAPI(data);
}

//a callback solution to global json(or just use BASE)
function readJsonFileToPopulate(file, callback, data) {
    let result;
    result = $.getJSON(file, function(geo) {
        jsonSortByName(geo.features);        
        return geo;
    });
    
    result.then(res => {
        if (typeof callback === "function") {
            callback(res, data);
        };
    });
}
//goes anywhere
$(document).on('click', '#test li a', function() {
    console.log($(this).text());
    let data = { iso_a2: $(this).attr("iso_a2"), index: $(this).attr("index")};
    plotBorders(data);
});
//let states = BASE.json.features[data.index];//instead of callback 
function plotBorders(data) {
    if (BASE.border) {
        BASE.lmap.removeLayer(BASE.border);
    }
    testAPI(data);
    readJsonFileToPopulate('countryBorders.geo.json', newOne, data);  
}
//some renaming is required
function newOne(res, data) {
    if(data.index) {	
    	let states = res.features[data.index];
	updateMap(states);
    } else {
        res.features.map((feature) => {
	        if (feature.properties.iso_a2 === data.iso_a2) {
	            let states = feature;
		        updateMap(states);
	        }
	    });       
    }
}

function updateMap(states) {
    var myStyle = { "color": "#0000FF" };
    BASE.border = L.geoJSON(states, { style: myStyle }).addTo(BASE.lmap);
    BASE.lmap.fitBounds(BASE.border.getBounds());//, {padding: [20 ,20]});
}

function testAPI(data) {
    let ajaxUrl = "libs/php/getCountryCode.php";
    let args = { url: ajaxUrl, type: 'POST', dataType: 'json', data: data };
    
    doAjax(args).then(result => {
    if (result) { 
        console.log(result);//this works
    }
    });
}

async function doAjax(args) {
    let result;
    let result2;
    try {
        if (!args.data.iso_a2) {
            result = await $.ajax(args);
            args.data = { iso_a2: result['data'].trim() }
            return plotBorders(args.data);
        } 

        result2 = await $.ajax(args);
        return result2;
	} catch (error) {
		console.log(error);
        }
}

function jsonSortByName(json) {
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

function populateCountryDropdown(geo) {
    let dropMenu = $('#test');

    geo.features.map((rest, index) => {
        let listItem =$('<li/>');
        let row = $('<a/>');
        row.attr({
            "class": "dropdown-item",
            "iso_a2": rest.properties.iso_a2,
		    "iso_a3": rest.properties.iso_a3,
		    "iso_n3": rest.properties.iso_n3,
		    "index": index
            });    
         row.html(rest.properties.name);
         listItem.append(row);
         dropMenu.append(listItem);
    });
}


$(function () {
    $('#preloader').hide();
    readJsonFileToPopulate('countryBorders.geo.json', populateCountryDropdown); 
    getLocation();
})