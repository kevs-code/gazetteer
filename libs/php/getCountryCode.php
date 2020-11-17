<?php

	$executionStartTime = microtime(true) / 1000;
        if($_REQUEST['lat']) {
	$url='http://api.geonames.org/countryCode?lat=' . $_REQUEST['lat'] . '&lng=' .  $_REQUEST['lng'] . '&username=placeholder=full';
	} else {
        $url='https://api.opencagedata.com/geocode/v1/json?countrycode=' . $_REQUEST['iso_a2'] . '&q=' . $_REQUEST['iso_a2'] . '&pretty=1&key=placeholder';
        }
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

	curl_close($ch);

	//$decode = json_decode($result,true);	

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "mission saved";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	if($_REQUEST['lat']) {
	$output['data'] = $result;
	} else {
	$decode = json_decode($result,true);
	$output['data'] = $decode['results'];
	}

	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>
