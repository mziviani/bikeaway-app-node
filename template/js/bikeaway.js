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
var infoWindowOpen = null;

//memorizzare il centro della mappa per il resize;
var centroMappa = null;

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
																									var bounds = new google.maps.LatLngBounds();

																									$.each(data, function(key,val) {
																										addMarkerNoLabel(mapHome,val['coordinates'][0][0],val['coordinates'][0][1], val['scheda'],val['categoria'][0]['title'], val['_id'],val['categoria'][0]['_id'])
																										bounds.extend(new google.maps.LatLng(val['coordinates'][0][0],val['coordinates'][0][1]));
																									})

																									//autozoom mappa
 																								 mapHome.fitBounds(bounds);

																								 //mermorizzo il centro della centroMappa
																								 centroMappa = mapHome.getCenter();

																								 //imposto lazione di ricentraggio della mappa in caso di resize
																								addEventCentroMappa()

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


		 function addMarker(map,lat,lng,nometappa, type,n) {
			 var img = pinMarker(type);


			 var marker = new google.maps.Marker({
					 position: {lat: lat, lng: lng},
					 map: map,
					 label: {text: " ", color:'white'},
					 icon: img,
					 clickable: true
				 });

				 marker.label.text = n

				 var infowindow = new google.maps.InfoWindow({
						content: '<h6 class="titlemap">'+nometappa+'</h6><p class="tagsmap"><a href="#" onclick="apriCommentidaTappa(event,'+n+')"><img src="/images/triangolo.png" alt="vai ai commenti"/> Commenta</a></p>'
  				});

					marker.addListener('click', function() {
 																				 //chiudo eventuali finestre aperte
 																							if (infoWindowOpen) {
 																								infoWindowOpen.close();
 																						 }
 																	 infowindow.open(map, marker);
 																	 infoWindowOpen = infowindow;
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
				var infowindow = new google.maps.InfoWindow({
					content: '<h6 class="titlemap"><a href="/'+catId+'/'+schedaId+'">'+scheda['title']+'</a></h6><p class="textmap">Lunghezza <strong>'+scheda['lunghezza']+' Km</strong></p><p class="textmap">Difficoltà '+difficoltaHTML+'</p><p class="textmap">Strada <strong>'+scheda['strada']+'</strong></p><p class="textmap">Pendenza <strong>'+scheda['pendenza']+'%</strong></p><p class="tagsmap"><a href="/'+ catId+'"><span class="glyphicon glyphicon-tags" aria-hidden="true"></span> '+titleCat+'</a></p>'
				 });

			 marker.addListener('click', function() {
																			 //chiudo eventuali finestre aperte
																						if (infoWindowOpen) {
																							infoWindowOpen.close();
																					 }
																 infowindow.open(map, marker);
																 infoWindowOpen = infowindow;
															 });


		}






		 /********* category map *****/
		 function initMapCategory() {
			var idcategory = window.location.pathname;
			var search = window.location.search;
			 idcategory = idcategory.replace("/","");

			 var url = '/private/api/json/category/'+idcategory

			 if(idcategory == "cerca") {
				 	url = "/private/api/json/cerca/"+search
			 }


			 mapHome = new google.maps.Map(document.getElementById('map'), {
																		 center: {lat: latDefault, lng: lngDefault},
																		 zoom: 15,
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


																	 $.getJSON(url)
																						 .done(function(data) {

																								 if(data['error']==true) {
																									 $("#map").hide()
																									 return;
																								 }

																								 var bounds = new google.maps.LatLngBounds();


																								 $.each(data, function(key,val) {
																									 addMarkerNoLabel(mapHome,val['coordinates'][0][0],val['coordinates'][0][1], val['scheda'],val['categoria'][0]['title'], val['_id'],val['categoria'][0]['_id'])
																									 bounds.extend(new google.maps.LatLng(val['coordinates'][0][0],val['coordinates'][0][1]));

																								 })

																								 //con un solo risultato non faccio l'autozoom
																								 if (data.length > 1) {
																								 //autozoom mappa
																									mapHome.fitBounds(bounds);
																								} else {
																									mapHome.setCenter(new google.maps.LatLng(data[0]['coordinates'][0][0],data[0]['coordinates'][0][1]))
																								}
																								 //mermorizzo il centro della centroMappa
																								 centroMappa = mapHome.getCenter();

																								 //imposto lazione di ricentraggio della mappa in caso di resize
																							 	addEventCentroMappa()

																						 })
																						 .fail(function(data) {
																								 //in caso di errore nascondo la mappa
																								 $("#map").hide()
																						 })



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

			//azione per l'invio del campiCommento
			$('#commenti #areaInserimento input[value="inserisci"]').click(inserisciCommento)

		}

		function campiCommento(e) {
			e.preventDefault();
			$('#commenti #areaInserimento').slideToggle();
		}

		function inserisciCommento(e) {
			var form = $("form")

			//verifico la validità del form tramite funzioni browser
			if(form[0].checkValidity() === false) {
      		return ;
    	}

			e.preventDefault()

			var url = (window.location.pathname).split("/")
			var idPercorso = url[url.length-1];

			var autore = $("#commenti #areaInserimento #nome").val();
			var mail = $("#commenti #areaInserimento #email").val();
			var commento = $("#commenti #areaInserimento #commento").val();
			var tappa = $("#commenti #areaInserimento #typec").val();

			//disabilito il pulsante
			$("#areaInserimento form input[type='submit']").attr('disabled','disabled');

			//attivo il messaggio di attesa
			$('#areaInserimento form').append('<div class="col-md-12"><p class="msg wait">Inserimento in corso</p></div>');
			$('#areaInserimento form p.msg').hide().fadeIn();

			$.post("/private/api/json/commento/upload", {_idPercorso: idPercorso, autore: autore, mail: mail, commento: commento, tappa: tappa}, "json" )
						.done(function(data) {
								var result = JSON.parse(data)
								var txt
								var classe

								switch(result.code) {
									case 1:
										txt = "I dati inseriti non sono validi.";
										classe ="error";
									break;
									case 2:
										txt = "Ci dispiace ma per noi il tuo messaggio è SPAM.";
										classe ="error";
									break;
									case 3:
										txt = "Grazie, il messaggio è stato inserito correttamente.";
										classe ="ok";
									break;
									default:
										txt = "Abbiamo riscontrato un errore. Cercheremo di risolverlo il prima possibile.";
										classe ="error";
								}

									chiusuraCommenti(classe,txt, function() {
										//aggiornare la paginazione + inserire il commento
										if (result.code==3) {
											allComments.unshift({"data": new Date(Date.now()), "autore": autore, "commento": commento, "tappa":tappa})
										}

										//imposto la visualizzazione su tutti
										$('#commentType').val(-1).change();

									})





						})
						.fail(function(data) {
								chiusuraCommenti("error", "Abbiamo riscontrato un errore. Cercheremo di risolverlo il prima possibile.",null);
						})


		}

function chiusuraCommenti(classe, txt, callback) {
	$('#areaInserimento form p.msg').replaceWith('<p class="msg '+classe+'">'+txt+'</p>');
	$('#commenti #areaInserimento').delay(1500).slideToggle();
	$('#areaInserimento form p.msg').delay(1500).fadeOut(function() {
																				this.remove();
																				//abilito il pulsante
																				$("#areaInserimento form input[type='submit']").removeAttr('disabled');

																				//pulisco i campi
																				var autore = $("#commenti #areaInserimento #nome").val("");
																				var mail = $("#commenti #areaInserimento #email").val("");
																				var commento = $("#commenti #areaInserimento #commento").val("");
																				var tappa = $("#commenti #areaInserimento #typec").val(0);

																				callback()
																				});


}

function apriCommentidaTappa(e,n) {
	e.preventDefault();

	//scrollTo areaInserimento
	$('html, body').animate({
			 scrollTop:  $('#commenti header').offset().top
	 }, 500);

	$('#commenti #areaInserimento').slideDown();
	$('#commenti #areaInserimento #typec').val(n);

}


var directionsDisplay;
var directionsService;
var allComments;
var paginazioneObj;

function initMapScheda() {
	var url = window.location.pathname ;


	//carico i dati della schedaId
	$.getJSON('/private/api/json'+url)
						.done(function(data) {

								if(data['error']==true) {
									$("#map").hide()
									return;
								}

								directionsDisplay = new google.maps.DirectionsRenderer();
								directionsService = new google.maps.DirectionsService();

								mapHome = new google.maps.Map(document.getElementById('map'), {
																							center: {lat: data[0]['coordinates'][0][0], lng: data[0]['coordinates'][0][1]},
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

								//bounds per autozoom
								var bounds = new google.maps.LatLngBounds();

								var wayout = []
								var tappa = 1;

								$.each(data[0]['coordinates'], function(key,value) {


									if (data[0]['scheda']['tappe'][key][0] == true) {
										addMarker(mapHome,value[0],value[1],data[0]['scheda']['tappe'][key][1],2,tappa);
										bounds.extend(new google.maps.LatLng(value[0],value[1]));

										wayout.push({
																location: new google.maps.LatLng({lat: value[0], lng: value[1]}),
																stopover: true

																})

										tappa++;
									} else  {


										wayout.push({
																location: new google.maps.LatLng({lat: value[0], lng: value[1]}),
																stopover: false
																})
									}

									})

										//autozoom
										 mapHome.fitBounds(bounds);

										 //inizializzo il percorso
										 directionsDisplay.setMap(mapHome);

										 var start = wayout[0]['location'];
									 	var end =wayout[wayout.length-1]['location'];

									 	var request = {
									 		 origin: start,
									 		 destination: end,
									 		 travelMode: 'WALKING', //DRIVING
									 		 unitSystem: google.maps.UnitSystem.METRIC,
									 		 waypoints: wayout,
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

													flightPath.addListener("click", function(event) {

																																					var infowindow = new google.maps.InfoWindow({
																																																											 content: "<h6 class=\"titlemap\"><strong>Segnalazione</strong></h6><p class=\"textmap\"><a href=\"#\" onclick=\"insertAvviso(1,"+event.latLng.lat()+","+event.latLng.lng()+")\"><img src=\"/images/strada-dissestata.png\" alt=\"strada dissestata\" /> Strada dissestata</a><br/><a href=\"#\" onclick=\"insertAvviso(2,"+event.latLng.lat()+","+event.latLng.lng()+")\"><img src=\"/images/traffico.png\" alt=\"traffico\" /> Zona trafficata</a><br/><a href=\"#\" onclick=\"insertAvviso(3,"+event.latLng.lat()+","+event.latLng.lng()+")\"><img src=\"/images/chiuso-per-lavori.png\" alt=\"chiuso per lavori\" /> Chiuso per lavori</a><br/><a href=\"#\" onclick=\"insertAvviso(4,"+event.latLng.lat()+","+event.latLng.lng()+")\"><img src=\"/images/pericolo.png\" alt=\"strada pericolo\" /> Pericolo</a><br/><a href=\"#\" onclick=\"insertAvviso(5,"+event.latLng.lat()+","+event.latLng.lng()+")\"><img src=\"/images/errore-mappa.png\" alt=\"errore mappa\" /> Errore mappa</a><p>"
																																																										 });
																																					if (infoWindowOpen) {
																																						infoWindowOpen.close()
																																					}
																																					infowindow.setPosition(event.latLng)
																																					infowindow.open(mapHome);

																																					infoWindowOpen = infowindow

																																		})



													//mermorizzo il centro della centroMappa
													centroMappa = mapHome.getCenter();

													//imposto lazione di ricentraggio della mappa in caso di resize
												 addEventCentroMappa()

									    }
									});





						})
						.fail(function(data) {
								//in caso di errore nascondo la mappa
								$("#map").hide()
						})


		var slagPercorso = url.split("/")
		//carico i dati dei commenti
		$.getJSON("/private/api/json/commenti/"+slagPercorso[2])
							.done(function(data) {

									var listaCommenti = $("#listacommenti")


									if(data['error']==true || data['commenti']==0) {
										listaCommenti.append('<article class="col-sm-9 corpo-commento"><p><strong>Nessun commento inserito</strong></p></article>');
										return
									}

									//metto i commenti in una variabile globale
									allComments = data;

									//attivaizone della paginazione
									var containerPag = $('#paginazione');
									var dataContainer = $('#listacommenti');


									containerPag.pagination({
									    dataSource: allComments,
											pageSize: 10,
											callback: function(data, pagination) {
																														 // template method of yourself
																														 var html = formattazioneCommento2(data);
																														 dataContainer.html(html);
																												 }
									});


									paginazioneObj = containerPag

									//filtro commenti
									$('#commenti #menu1 select').change(filtraCommentiChange);

									//verifico l'altezza del contenitore dei commenti e lo imposto come altezza minima
									dataContainer.css('min-height',dataContainer.height());
									var listacommenti = $("#listacommenti");
									containerPag.css('min-height',containerPag.height());




							})

		//alert(flightPath.getPath())
		//result.routes[0].overview_path -> da usare per caricare fontanelle, bar e ristoranti
		//result.routes[0].legs[0].distance.value -> calcolare la distanza dei vari segmenti
}

function filtraCommentiChange(e) {

	var dd = $(e.target);
	var scelta = parseInt(dd.val());

	var containerPag = $('#paginazione');
	var dataContainer = $('#listacommenti');
	var articoli =$("#listacommenti article")
	dataContainer.fadeOut(100, function() {

																//nascondo tutti i commenti e poi li distruggo
																articoli.remove()

																//distruggo la vecchia paginazione
																paginazioneObj.pagination('destroy')


																//pulisco la sorgetnte dati di paginazione
																var result = [];
																$.each(allComments,function(key,value) {
																		if (scelta==value['tappa'] || scelta == -1) {
																			result.push(value)
																		}
																})

																if (result.length>0) {
																		containerPag.pagination({
																				dataSource: result,
																				pageSize: 10,
																				callback: function(data, pagination) {
																																							 // template method of yourself
																																							 var html = formattazioneCommento2(data);
																																							 dataContainer.html(html);
																																					 },
																		});

																		//salvo nel globale la nuova paginazioneObj
																		paginazioneObj = containerPag
																} else {
																		dataContainer.append('<article class="col-sm-9 corpo-commento"><p>Nessun commento per la <strong>tappa '+scelta+	'</strong></p></article>')

																}

															 dataContainer.fadeIn(100);
			})

}

function formattazioneCommento2(data) {
	var html = "";

	$.each(data, function(key,value) {
			html+=formattazioneCommento(value['data'],value['autore'],value['commento'],value['tappa'])
	})

	return html
}

function formattazioneCommento(data,autore,commento,tappa) {
	var html = "";
	var d = new Date(data);

	html += '<article class="col-sm-9 corpo-commento">';

	if (tappa > 0) {
		html += '<div class="tappa">'+tappa+'</div>'
	}

	html += '<p>'+d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear()+' | <strong>'+autore+'</strong><br/>'+commento+'</p>'

	html += '</article>';

	return html;
}

function insertAvviso(n, lat, long) {
	//1 Strada dissestata
	//2 Zona trafficata
	//3 chiuso per lavori
	//4 Pericolo
	//5 Errore centro

	alert("pericolo" + n + "\n" + "coordinate -> " + lat +", " + long)
	infoWindowOpen.close()
}
function setCentroMappa() {
	mapHome.setCenter(centroMappa)
}

function addEventCentroMappa() {
	$(window).resize(function() {clearTimeout(resizeAction);
														 resizeAction = setTimeout(setCentroMappa, 150);
														 });
}
