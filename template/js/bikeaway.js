//riga 219 cambira url immagine pin mappa

//funzione controllo dimensione finestra
function windowMobile() {
	var size = $(window).width();
	if(size<768) {
		return true;
	} else {
		return false;
	}
}
//variabile per timeout funzione di resize
var resizeAction;

//inizializzazione larghezza barra ricerca avanzata
function initLarghezzaSearch() {
	resizeLarghezzaSearch();
	$(window).resize(function() {clearTimeout(resizeAction);
															resizeAction = setTimeout(resizeLarghezzaSearch, 150);
															});
	//botton filtri avanzati
	$('#search-advanced-view a:nth-child(1)').click(visualizzaFiltriAvanzati);

}

//ridimensionamento ricerca avanzata
function resizeLarghezzaSearch() {
		var sao = $('#search-advanced-options');

		if(!windowMobile()){
			var larghezza = $('#search-field #search-field-group').outerWidth();
			larghezza += $('#search-field input[type="submit"]').outerWidth();
			larghezza += 40;
			sao.attr('style', 'width:'+larghezza+'px;'+sao.attr('style'));

		} else {
			sao.removeAttr('style');
		}
}

//set visibilità ed etichetta filtri avanzati
function visualizzaFiltriAvanzati() {
	var sao = $('#search-advanced-options');
	var a = $('#search-advanced-view a:nth-child(1)');
	var span = $('#search-advanced-view a:nth-child(1) span');

	if(sao.hasClass('hidden')) {
		sao.removeClass('hidden');
		span.removeClass('glyphicon-option-horizontal');
		span.addClass('glyphicon-trash');
		a.addClass('remove');
	} else {
		sao.addClass('hidden');
		span.removeClass('glyphicon-trash');
		span.addClass('glyphicon-option-horizontal');
		a.removeClass('remove');

		//svuotare i valori dei campi di input
		$("#search-advanced-options input[type='text']").val(null);
		$("#search-advanced-options select").val(0);
		$('#search-advanced-options input:checkbox:checked').prop('checked', false);

	}
}


//gestione cookie per preferenza velocità
function initCookie() {

	var cookieVel = $.cookie('velPref');

	if(cookieVel==null) {
		setVelocita();
	} else {
		setVelocita(cookieVel);
	}

	//imposto il bottone per il cambio
	$('#setVelocita').click(btnVelocita);
}

//cambio velocità preferenza
function btnVelocita() {
	var velocita = $('#velocita').val();

	if (!isNaN(velocita) && velocita > 0 && velocita < 100) {
		//1. disabilito i bottoni
		$('#velocita').attr('disabled', 'disabled');
		$('#setVelocita').attr('disabled', 'disabled');

		//2. visualizzo il messaggio
		$('#piede #preference').append('<p class="msg wait">ricalcolo</p>');
		$('#piede #preference p.msg.wait').hide().fadeIn();



		//3. imposto la velocita
		setVelocita(velocita);

		//4. imposto il cookie
		$.cookie('velPref', velocita, { expires: 36500 });

		//5. riabilito i pulsanti
		setTimeout(abilitaBtnPreferenze, 1500);
	} else {
		$('#velocita').attr('disabled', 'disabled');
		$('#setVelocita').attr('disabled', 'disabled');
		$('#piede #preference').append('<p class="msg error">valore non valido</p>');
		$('#piede #preference p.msg.error').hide().fadeIn().delay(1500).fadeOut(function() {	this.remove();
																																													$('#velocita').removeAttr('disabled');
																																													$('#setVelocita').removeAttr('disabled');

																																													//carico il cookie o il valore di default
																																													var velocitaSdt = $.cookie('velPref');

																																													if (velocitaSdt == null || isNaN(velocitaSdt)) {
																																														$('#velocita').val(8);
																																													} else {
																																															$('#velocita').val(velocitaSdt);
																																													}
																																												});

	}
}

// messaggio preferenza e abilitazione pulsanti
function abilitaBtnPreferenze() {
	$('#piede #preference p.msg').replaceWith('<p class="msg ok">salvato</p>');
	$('#piede #preference p.msg.ok').delay(1500).fadeOut(function() {
																				this.remove();
																				$('#velocita').removeAttr('disabled');
																				$('#setVelocita').removeAttr('disabled');
																			});
}

//funzione per impostare e calcolare il tempo del percorso in base della velocità
function setVelocita(vel) {
	var velocitaDaUsare = 0;
	if ((isNaN(vel) || vel==null) || vel<1 || vel> 99)   {
		//velocità di default
		velocitaDaUsare = 8;
	} else {
		//velocità carcata da cookie
		velocitaDaUsare = vel;

	}

	//funzione di calcolo della velocità
	var campi = $('.row.dettagli .col-md-6:nth-child(2) strong, #dettagli #tempo strong');
	var lunghezza = $('.lunghezza strong');

	for (var i = 0; i<lunghezza.length; i++) {
		var secondi = (parseInt($(lunghezza[i]).text())/velocitaDaUsare)*60*60;


		 var hours   = Math.floor(secondi / 3600);
		var minutes = Math.floor((secondi - (hours * 3600)) / 60);
		var seconds = Math.ceil(secondi - (hours * 3600) - (minutes * 60));

		if(hours<10) {hours = '0'+hours};
		if(minutes<10) {minutes = '0'+minutes};
		if (seconds<10) {seconds = '0'+seconds};

		$(campi[i]).text(hours+":"+minutes+":"+seconds);
	}

	//imposto le preferenze con il numero corretto
	$('#velocita').val(velocitaDaUsare);

}

//gestione mappa home
var mapHome;

//posizione verona centro
var latDefault = 45.43838419999999;
var lngDefault = 10.991621500000065;

//finestra aperta
var infowindow = null;


		 function initMapHome() {
				if (navigator.geolocation) {
				     navigator.geolocation.getCurrentPosition(setLatLngDefault, fallbackMap);
				} else {
					setMapHome();
				}
		 }

		function setLatLngDefault(position) {
			 latDefault = position.coords.latitude;
			 lngDefault = position.coords.longitude;
			 setMapHome();
		 }

		 function fallbackMap() {
			 setMapHome();
			}

		 function setMapHome() {
			 mapHome = new google.maps.Map(document.getElementById('map'), {
																			center: {lat: latDefault, lng: lngDefault},
																			zoom: 13,
																			streetViewControl: false,
																			fullscreenControl: false,
																			mapTypeControl: false,
																			styles: 	[
																									   {
																									     featureType: "poi.business",
																									     stylers: [
																									      { visibility: "off" }
																									     ]
																										 },
																										 {
																									     featureType: "poi.sports_complex",
																									     stylers: [
																									      { visibility: "off" }
																									     ]
																										 }

																									]

																		});




																		//marker esempi chiamata ajax
																		$.getJSON('/private/api/json/all/')
																							.done(function(data) {
																									if(data['error']==true) {
																										$("#map").hide()
																										return;
																									}
																									$.each(data, function(key,val) {
																										addMarkerNoLabel(mapHome,val['coordinates'][0][0],val['coordinates'][0][1], val['scheda'],val['categoria'][0]['title'], val['_id'],val['categoria'][0]['_id'])
																									})
																							})
																							.fail(function(data) {
																									//in caso di errore nascondo la mappa
																									$("#map").hide()
																							})






		 }
		 function pinMarker(type) {
			 var img
			 switch (type) {
			 case 1:
					 img='pinstar.png'
				 break;
				case 2:
							img='pinTappa.png'
				break;
			 default:
					 img='pinhome.png'
			}
			var url = 'http://localhost:8080/images/'+img;
			return url;
		 }



		 function addMarker(map,label,lat,lng, type, titolo, diff, strada, pendenza, cat, schedaId, catId ) {
			 var img = pinMarker(type);

			 var marker = new google.maps.Marker({
					 position: {lat: lat, lng: lng},
					 map: map,
					 label: {text:label, color:'white'},
					 icon: img,
					 clickable: true
				 });
				  infowindow = new google.maps.InfoWindow({
    	 			content: '<h6 class="titlemap"><a href="/'+catId+'/'+schedaId+'">'+titolo+'</a></h6><p class="textmap">Difficoltà <span class="full"></span><span class="full"></span><span></span></p><p class="textmap">Strada <strong>'+strada+'</strong></p><p class="textmap">Pendenza <strong>'+pendenza+'%</strong></p><p class="tagsmap"><span class="glyphicon glyphicon-tags" aria-hidden="true"></span> '+cat+'</p>'
  				});

				marker.addListener('click', function() {
																			//chiudo eventuali finestre aperte
																					 if (infowindow) {
																						 infowindow.close();
																					}
	    														infowindow.open(map, marker);
	  														});



		 }
		 function addMarkerNoLabel(map,lat,lng,scheda, titleCat,schedaId, catId) {


			 var img = pinMarker(type);

			var marker = new google.maps.Marker({
					position: {lat: lat, lng: lng},
					map: map,
					icon: img,
					clickable: true
				});

			var difficoltaHTML = "";
			for (var i = 1; i<=3;i++) {
					if (i<=scheda['difficolta']) {
						difficoltaHTML +="<span class=\"full\"></span>"
					} else {
						difficoltaHTML += "<span></span>"
					}
			}
				 infowindow = new google.maps.InfoWindow({
					content: '<h6 class="titlemap"><a href="/'+catId+'/'+schedaId+'">'+scheda['title']+'</a></h6><p class="textmap">Lunghezza <strong>'+scheda['lunghezza']+' Km</strong></p><p class="textmap">Difficoltà '+difficoltaHTML+'</p><p class="textmap">Strada <strong>'+scheda['strada']+'</strong></p><p class="textmap">Pendenza <strong>'+scheda['pendenza']+'%</strong></p><p class="tagsmap"><span class="glyphicon glyphicon-tags" aria-hidden="true"></span> '+titleCat+'</p>'
				 });

			 marker.addListener('click', function() {
																			 //chiudo eventuali finestre aperte
																						if (infowindow) {
																							infowindow.close();
																					 }

																 infowindow.open(map, marker);
															 });


		}






		 /********* category map *****/
		 function initMapCategory() {
			 var idcategory = window.location.pathname;
			 idcategory = idcategory.replace("/","");


			 mapHome = new google.maps.Map(document.getElementById('map'), {
																		 center: {lat: latDefault, lng: lngDefault},
																		 zoom: 12,
																		 streetViewControl: false,
																		 fullscreenControl: false,
																		 mapTypeControl: false,
																		 styles: 	[
																										{
																											featureType: "poi.business",
																											stylers: [
																											 { visibility: "off" }
																											]
																										},
																										{
																											featureType: "poi.sports_complex",
																											stylers: [
																											 { visibility: "off" }
																											]
																										}

																								 ]

																	 });


																	 $.getJSON('/private/api/json/category/'+idcategory)
																						 .done(function(data) {

																								 if(data['error']==true) {
																									 $("#map").hide()
																									 return;
																								 }

																								 $.each(data, function(key,val) {
																									 addMarkerNoLabel(mapHome,val['coordinates'][0][0],val['coordinates'][0][1], val['scheda'],val['categoria'][0]['title'], val['_id'],val['categoria'][0]['_id'])
																								 })


																								 //var bounds = new google.maps.LatLngBounds();

																								 $.each(data, function(key,val) {
																									 //bounds.extend(new google.maps.LatLng(val['coordinates'][0][0],val['coordinates'][0][1]);
																								 })
																								// mapHome.fitBounds(bounds);

																						 })
																						 .fail(function(data) {
																								 //in caso di errore nascondo la mappa
																								 $("#map").hide()
																						 })

																	//test
																	/* addMarkerNoLabel(mapHome,45.43838419999999,10.991621500000065,0)
																	 addMarkerNoLabel(mapHome,44.5,10.99163,0)
																	 addMarkerNoLabel(mapHome,45.42,9.98,0)
																	 addMarkerNoLabel(mapHome,45.5,11,0)
																	 addMarkerNoLabel(mapHome,45.6,10.8,0)
																	 addMarkerNoLabel(mapHome,45.3,12,0)
																	addMarkerNoLabel(mapHome,48,12,0)

																		var bounds = new google.maps.LatLngBounds();

																		bounds.extend(new google.maps.LatLng(45.43838419999999, 10.991621500000065));
																		bounds.extend(new google.maps.LatLng(44.5, 10.99163));
																		bounds.extend(new google.maps.LatLng(45.42, 9.98));
																		bounds.extend(new google.maps.LatLng(45.5, 11));
																		bounds.extend(new google.maps.LatLng(45.6, 10.8));
																		bounds.extend(new google.maps.LatLng(45.3, 12));
																		bounds.extend(new google.maps.LatLng(48, 12));
																		mapHome.fitBounds(bounds);*/

		 }

		function initCategory() {
			var btnfiltri = $('#filter button');
			var order = $('#order #orderInput');

			btnfiltri.click(attivaFiltri);
			order.change(attivaOrdinamento);
		}

		function attivaOrdinamento() {
			alert("creare la funzione di ordinamento 1. disabilitare pulsanti 2. disabilitare visualizzazione 3. ordinare 4. riabilitare")
		}

		function attivaFiltri() {
			var queryRaw = window.location.search.substring(1);
			var queryObj = null;

			var inputLung = $("#lung");
			var inputPend = $("#pend");
			var selectStrada = $("#type");
			var selectDifficolta = $("#diff");
			var inputCheckbox = $("#filter input[type='checkbox']");

			if (queryRaw.length>0 && queryRaw.indexOf("=")>-1) {
					queryObj = $.parseJSON('{"' + decodeURI(queryRaw).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
			}
			if(queryObj!= null) {

				if (queryObj.lung != inputLung.val() && inputLung.val().trim() != '') {
						queryObj.lung =inputLung.val().trim();
				} else if ((inputLung.val().trim() == '' || inputLung.val() == null) && queryObj.lung != null) {
					delete queryObj.lung;
				}

				if (queryObj.pend != inputPend.val() && inputPend.val().trim() != '') {
						queryObj.pend =inputPend.val().trim();
				} else if ((inputPend.val().trim() == '' || inputPend.val() == null) && queryObj.pend != null) {
					delete queryObj.pend;
				}

				if (queryObj.type != selectStrada.val()) {
						queryObj.type =selectStrada.val().trim();
				}

				if (queryObj.diff != selectDifficolta.val()) {
						queryObj.diff =selectDifficolta.val().trim();
				}


				switch (inputCheckbox[0].checked) {
					case true:
							queryObj.vicino=1;
						break;
					case false:
						queryObj.vicino=0;
					break;
				}

				switch (inputCheckbox[1].checked) {
					case true:
							queryObj.bambini=1;
						break;
					case false:
						queryObj.bambini=0;
					break;
				}




			} else {

				queryObj = new Object();

				if (inputLung.val().trim().length>0) {
						queryObj.lung = inputLung.val().trim();
				}

				if (inputPend.val().trim().length>0) {
						queryObj.pend = inputPend.val().trim();
				}
					queryObj.type = selectStrada.val();
					queryObj.diff = selectDifficolta.val();

				if (inputCheckbox[1].checked) {
					queryObj.bambini = 1;
				} else {
					queryObj.bambini = 0;
				}

				if (inputCheckbox[0].checked) {
					queryObj.vicino = 1;
				}	else {
					queryObj.vicino = 0;
				}
			}


			//cambio url
			window.history.pushState({}, window.document.title, "?"+$.param(queryObj));
		}

//******* scheda *******//
		function initScheda() {
			$('#commenti #menu2 a').click(campiCommento);
			//nascondo i campi input
			$('#commenti #areaInserimento').hide();
			//filtro commenti
			$('#commenti #menu1 select').change(filtraCommentiChange);

		}

		function campiCommento(e) {
			e.preventDefault();
			$('#commenti #areaInserimento').slideToggle();
		}

		function filtraCommentiChange(e) {


			var dd = $(e.target);
			var scelta = parseInt(dd.val());

			var commenti = $('#commenti .corpo-commento');
			var commentiTappe = $('#commenti .corpo-commento div.tappa').parents('article.corpo-commento');
			var commentiGenerali = commenti.not(commentiTappe);



			if(scelta==-1) {
				commenti.delay(200).fadeIn(200);
			} else if (scelta==0) {
				commentiTappe.fadeOut(100);
				commentiGenerali.delay(200).fadeIn(200);
			} else {
				commentiGenerali.fadeOut(100);
				commentiTappe.fadeOut(100)
				commentiTappe.each(function() {
																				if ($(this).children("div.tappa").text()==scelta) {
																						$(this).delay(200).fadeIn(200);
																				} else {
																						$(this).fadeOut(100);
																				}

													});
			}
}

var directionsDisplay;
var directionsService;

function initMapScheda() {
	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsService = new google.maps.DirectionsService();

	mapHome = new google.maps.Map(document.getElementById('map'), {
																center: {lat: latDefault, lng: lngDefault},
																zoom: 12,
																streetViewControl: false,
																fullscreenControl: false,
																mapTypeControl: false,
																styles: 	[
																							 {
																								 featureType: "poi.business",
																								 stylers: [
																									{ visibility: "off" }
																								 ]
																							 },
																							 {
																								 featureType: "poi.sports_complex",
																								 stylers: [
																									{ visibility: "off" }
																								 ]
																							 }

																						]

															});
	//layer bici
	var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(mapHome);

	//inserimento pin sponsor
	addMarker(mapHome,'1',45.43838419999999,10.991621500000065,1);



	//inizializzo il percorso
	directionsDisplay.setMap(mapHome);

	var start = new google.maps.LatLng({lat: 45.435480013105355, lng: 10.980502367019653});
	var end = new google.maps.LatLng({lat: 45.438521466560076, lng: 10.9962241569519043});
	var request = {
		 origin: start,
		 destination: end,
		 travelMode: 'WALKING', //DRIVING
		 unitSystem: google.maps.UnitSystem.METRIC,
		 waypoints: [
								 {
									 location: new google.maps.LatLng({lat: 45.43273955326644, lng: 10.984225273132324}),
									 stopover: false
								 },{
									 location: new google.maps.LatLng({lat: 45.434900311545114, lng: 10.98756194114685}),
									 stopover: true
								 },{
									 location: new google.maps.LatLng({lat: 45.43685019312067, lng: 10.990909337997437}),
									 stopover: false
								 },{
									 location: new google.maps.LatLng({lat: 45.4359543099525335 , lng: 10.993773937225342}),
									 stopover: false
								 },{
									 location: new google.maps.LatLng({lat: 45.435766097395025, lng: 10.994642972946167}),
									 stopover: false
								 }],
			optimizeWaypoints: false,
			provideRouteAlternatives: false,
			avoidHighways: true,
			avoidTolls: true
	 };

	 directionsService.route(request, function(result, status) {
		 //fare uno switch con gli altri status
	  if (status == 'OK') {
			directionsDisplay.setOptions( {
																			suppressMarkers: true,
																			polylineOptions: {strokeColor: '#ffb839',strokeWeight:'6',strokeOpacity: 0.7, clickable: true}

																			}

																		 );
      //directionsDisplay.setDirections(result);
			addMarker(mapHome,'1',45.435480013105355,10.980502367019653,2);

			//test polyline
			var pol = result.routes[0].overview_polyline

			var flightPath = new google.maps.Polyline({
          path: google.maps.geometry.encoding.decodePath(pol),
          geodesic: true,
          strokeColor: '#ffb839',
          strokeOpacity: 0.7,
          strokeWeight: 7
        });

        flightPath.setMap(mapHome);

				flightPath.addListener("click", function() {alert("click su poliline")})

				//var bounds = new google.maps.LatLngBounds();

				//bounds.extend(flightPath.getPath());
				//mapHome.fitBounds(bounds);

				//alert(flightPath.getPath())

    }


		//result.routes[0].overview_path -> da usare per caricare fontanelle, bar e ristoranti
		//result.routes[0].legs[0].distance.value -> calcolare la distanza dei vari segmenti

  });

}


//  map = new google.maps.Map(document.getElementById('map'), mapOptions);
