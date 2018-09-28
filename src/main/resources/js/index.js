"use strict";
var ppmds = window.ppmds || {};
window.ppmds.home = (function () {
	var ol3Map, savedStudyLayer, newStudyLayer, cityPolygonLayer, countryPolygonLayer, timeout, lastQuery, maxFeatureCount, currentResolution, searchControl, menuProjets, contextmenu, selectSingleClick,
		iris, mySwiper, cityPolygonFeature,
		cityPolygonStyle = new ol.style.Style({
			fill: new ol.style.Fill({
				color: 'rgba(82, 97, 111, 0.1)'
			}),
			stroke: new ol.style.Stroke({
				color: 'rgba(82, 97, 111, 0.8)',
				width: 1
			}),
			zIndex: 2
		}),
		cityPolygonShadow = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: [0, 0, 127, 0.15],
				width: 8
			}),
			zIndex: 1
		}),
		textFill = new ol.style.Fill({
			color: '#fff'
		}),
		textStroke = new ol.style.Stroke({
			color: 'rgba(0, 0, 0, 0.6)',
			width: 3
		}),
		onGoingStudyStyle = new ol.style.Style({
			image: new ol.style.Icon({
				scale: .2,
				src: 'img/home-unselected.png'
			})
		}),
		newStudyStyle = new ol.style.Style({
			image: new ol.style.Icon({
				scale: .2,
				src: 'img/new-unselected.png'
			})
		}),
		completedStudyStyle = new ol.style.Style({
			image: new ol.style.Icon({
				scale: .2,
				src: 'img/terminated-unselected.png'
			})
		}),
		// archivedStudyStyle = new ol.style.Style({
		// 	display: 'none'
		// }),
		onGoingSelectedStudyStyle = new ol.style.Style({
			image: new ol.style.Icon({
				scale: .2,
				src: 'img/home-selected.png'
			})
		}),
		newSelectedStudyStyle = new ol.style.Style({
			image: new ol.style.Icon({
				scale: .2,
				src: 'img/new-selected.png'
			})
		}),
		completedSelectedStudyStyle = new ol.style.Style({
			image: new ol.style.Icon({
				scale: .2,
				src: 'img/terminated-selected.png'
			})
		}),
		// archivedSelectedStudyStyle = new ol.style.Style({
		// 	display: 'none'
		// }),
		blue_outline = new ol.style.Style({
			image: new ol.style.Circle({
				radius: 15,
				fill: new ol.style.Fill({
					color: 'rgba(82, 97, 111, 0.58)'
				}),
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 3
				}),
				text: new ol.style.Text({
					text: '1',
					fill: textFill,
					stroke: textStroke
				})
			})
		}),
		red_outline = new ol.style.Style({
			image: new ol.style.Circle({
				radius: 15,
				fill: new ol.style.Fill({
					color: 'rgba(82, 97, 111, 0.58)'
				}),
				stroke: new ol.style.Stroke({
					color: 'red',
					width: 3
				}),
				text: new ol.style.Text({
					text: '1',
					fill: textFill,
					stroke: textStroke
				})
			})
		}),
		savedStudySource = new ol.source.Vector(),
		newStudySource = new ol.source.Vector(),
		newStudyFeature,
		matchMedia,
		customer = {},
		products = [],
		individualForm = false,
		purchasers =[],
		individual = {},
		company = {},
		selectedPurchaser = -1,
		invoiceData = {},
		notifications = 0,
		productId,
		productLicenseCount = 1,
		tenant = {},
		servicesMap = new Map(),
		selectedStudyFeature,
		selectedStudyLayer,
		selectedStudyStatus = 'all',
		operations,
		sharedWithUsers = new Set(),
		attachments = [],
		ownersList = [],
		ownersMap = new Map(),
		statusColors = new Map(),
		popupOverlay,
		popupOverlayQuestion,
		loading = 0,
		loaded = 0,
		projectAddress,
		projectOwner,
		projectName,
		selectedCluster,
		selectedClusterFeatueIndex = 0,
		clusterLoopIndex = 0,
		projectSearchMatchingCoord,
		purchaserDialog = 1;
	return {
		initHome: initHome,
		getSelectedStudyCoordinates: getSelectedStudyCoordinates,
		getSelectedStudy: getSelectedStudy,
		getSelectedPurchaser : getSelectedPurchaser,
		isStudyModified: isStudyModified,
		getSelectedStudyTaxData: getSelectedStudyTaxData,
		getConnectionAwareXmlHttpRequest: getConnectionAwareXmlHttpRequest,
		loadMainFragment: loadMainFragment,
		removeMainServiceUI: removeMainServiceUI,
		showLoadingAnimation: showLoadingAnimation,
		stopLoadingAnimation: stopLoadingAnimation,
		showFullLoadingAnimation: showFullLoadingAnimation,
		stopFullLoadingAnimation: stopFullLoadingAnimation,
		showDialogMessage: showDialogMessage,
		showPurchaserUi: showPurchaserUi,
		hideContextualMenu: hideContextualMenu,
		loadService: loadService,
		checkIfAddOnActive: checkIfAddOnActive
	}

	function initHome() {
		showFullLoadingAnimation();
		initCustomerSettings();
		getInvoiceData();
		servicesMap = new Map(), // is it normal ? looks like it's been here for a while
			smoothScroll();
		initEvents();
		initContent();
		renderMenuProjets();
		renderOverlayProjets();

		// set operations status colors
		statusColors.set("ONGOING", "#11a1b9");
		statusColors.set("COMPLETED", "#c42960");
		// statusColors.set("ARCHIVES", "none");

		/**************************************************************************/
		if (matchMedia) {
			var mq = window.matchMedia("(max-width: 900px)");
			mq.addListener(WidthChange);
			WidthChange(mq);
		}
		var osm = new ol.source.OSM({
			/*url: 'http://osm25.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
			url: 'http://tile-{a-c}.openstreetmap.fr/hot/{z}/{x}/{y}.png'*/
			url: 'http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'

		});
		osm.on('tileloadstart', function () {
			addLoading();
		});

		osm.on('tileloadend', function () {
			addLoaded();
		});
		osm.on('tileloaderror', function () {
			addLoaded();
		});

		ol3Map = new ol.Map({
			layers: [
				new ol.layer.Tile({
					source: osm,
					preload: 12
				})
			],
			target: 'map',
			view: new ol.View({
				center: [289879.25688252057, 5842610.61529703],
				zoom: 6.201938479720461,
				minZoom: 3,
				maxZoom: 19
			}),
			controls: []
		});
		ol3Map.addControl(new ol.control.Zoom({
			zoomInTipLabel: I18N_ZOOM_IN_TOOLTIP,
			zoomOutTipLabel: I18N_ZOOM_OUT_TOOLTIP
		}));
		ol3Map.addControl(new ol.control.ScaleLine());
		ol3Map.on('moveend', selectProjectSearchMatch);
		/*		searchControl = new ol.control.Control({
					element: document.getElementById('search'),
					position: 'left'
				});
				ol3Map.addControl(searchControl);*/
		/*menuProjets = new ol.control.Control({
			element: document.getElementById('menu-projets'),
			position: 'left'
		});
		ol3Map.addControl(menuProjets);*/
		ol3Map.getViewport().style.cursor = "-webkit-grab";
		ol3Map.getViewport().style.position = "static";
		addCountryPolygonLayer();
		addCityPolygonLayer();
		addNewStudyLayer();
		loadSavedStudy();
		getGeolocation();
		browseTax();

		/**************************************************************************/
		/*loadService('real-estate-simulator');*/

		$('img').bind("contextmenu", function (e) {
			return false;
		});
		$('img').on('mousedown', function (e) {
			e.preventDefault();
		});
		window.addEventListener('scroll', function (e) {
			if ($('body').scrollTop() > $('#map-section').height()) {
				document.getElementsByTagName('header')[0].classList.add('header-background');
			} else {
				document.getElementsByTagName('header')[0].classList.remove('header-background');
			}
		});
		initPopup();
		initPopupQuestion();
		projectAddress = document.getElementById('project-address');
		projectOwner = document.getElementById('project-owner');
		projectName = document.getElementById('project-name');
		document.getElementById('swipe-left').addEventListener('click', function () {
			clusterLoopIndex--;
			updatePopupContent();
			var studies = [];
			if (selectedCluster) {
				studies = getSelectedStudyCluster();
			} else {
				studies.push(getSelectedStudy());
			}
			selectedClusterFeatueIndex = ((studies.length + 1) * clusterLoopIndex) % studies.length;
			landSelectionChangedCallBack(displayContextualMenuSideBar, studies[selectedClusterFeatueIndex]);
			var serviceMenu = document.getElementById('service-menu-content');
			if (serviceMenu.style.display == "block") {
				loadMenuFragment(serviceMenu, null, serviceMenu.firstChild.id.replace('-menu', ''));
			}
		});
		document.getElementById('swipe-right').addEventListener('click', function () {
			clusterLoopIndex++;
			updatePopupContent();
			var studies = [];
			if (selectedCluster) {
				studies = getSelectedStudyCluster();
			} else {
				studies.push(getSelectedStudy());
			}
			selectedClusterFeatueIndex = ((studies.length + 1) * clusterLoopIndex) % studies.length;
			landSelectionChangedCallBack(displayContextualMenuSideBar, studies[selectedClusterFeatueIndex]);
			var serviceMenu = document.getElementById('service-menu-content');
			if (serviceMenu.style.display == "block") {
				loadMenuFragment(serviceMenu, null, serviceMenu.firstChild.id.replace('-menu', ''));
			}
		});
	}


	function flyToLocation(coord, zoomLevel) {
		var view = ol3Map.getView();
		view.setZoom(zoomLevel);
		view.setCenter(coord);
		var duration = 1000;

		if (view.getZoom() < zoomLevel) {
			view.animate({
				zoom: 10,
				duration: duration,
				center: coord
			}, {
				zoom: zoomLevel,
				duration: duration,
				center: coord
			});
		} else {
			view.setCenter(coord);
		}
	}

	function getGeolocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(successGeolocationCallback);
		}
	}

	function successGeolocationCallback(position) {
		var coord = [parseFloat(position.coords.longitude), parseFloat(position.coords.latitude)];
		var projection = ol3Map.getView().getProjection();
		var projectionCoord = ol.proj.transform(coord, 'EPSG:4326', projection);
		flyToLocation(projectionCoord, 10);
	}

	function initPopup() {
		var container = document.getElementById('popup');
		var closer = document.getElementById('popup-closer');
		popupOverlay = new ol.Overlay({
			element: container,
			autoPan: true,
			autoPanAnimation: {
				duration: 250
			}
		});
		closer.onclick = function () {
			popupOverlay.setPosition(undefined);
			closer.blur();
			return false;
		};
		ol3Map.addOverlay(popupOverlay);
	}

	function initPopupQuestion() {
		var container = document.getElementById('popup-question');
		var closer = document.getElementById('popup-closer-question');
		var validate = document.getElementById('popup-validate-question');
		var overlayNewProject = document.getElementById('overlay-new-project');
		var backArrow = document.getElementById('blue-information-back');

		popupOverlayQuestion = new ol.Overlay({
			element: container,
			autoPan: true,
			autoPanAnimation: {
				duration: 250
			}
		});
		closer.onclick = function () {
			popupOverlayQuestion.setPosition(undefined);
			closer.blur();
			return false;
		};
		validate.onclick = function () {
			overlayNewProject.style.display = 'flex';
			hidePopupQuestion();
		}
		backArrow.onclick = function () {
			overlayNewProject.style.display = 'none';
		}
		ol3Map.addOverlay(popupOverlayQuestion);
	}

	function hidePopup() {
		popupOverlay.setPosition(undefined);
	}

	function hidePopupQuestion() {
		popupOverlayQuestion.setPosition(undefined);
	}

	function showPopup() {
		var coord;
		clusterLoopIndex = 0;
		if (selectedCluster) {
			coord = selectedCluster.getGeometry().getCoordinates();
			let studies = getSelectedStudyCluster();
			landSelectionChangedCallBack(displayContextualMenuSideBar, studies[0]);
		} else {
			coord = selectedStudyFeature.getGeometry().getCoordinates();
		}
		updatePopupContent();
		popupOverlay.setPosition(coord);
	}

	function showPopupQuestion() {

		var coord;
		clusterLoopIndex = 0;
		if (selectedCluster) {
			coord = selectedCluster.getGeometry().getCoordinates();
			let studies = getSelectedStudyCluster();
			landSelectionChangedCallBack(displayContextualMenuSideBar, studies[0]);
		} else {
			coord = selectedStudyFeature.getGeometry().getCoordinates();
		}
		//updatePopupContentQuestion();


		popupOverlayQuestion.setPosition(coord);
	}

	function updatePopupContent() {
		var studies = [],
			index = 0;
		if (selectedCluster) {
			studies = getSelectedStudyCluster();
			var index = ((studies.length + 1) * clusterLoopIndex) % studies.length;
		} else {
			studies.push(getSelectedStudy());
		}
		if (studies.length < 2) {
			document.getElementById('swipe-left').style.display = "none";
			document.getElementById('swipe-right').style.display = "none";
			document.getElementById('popup-footer').style.display = "none";
			document.getElementById('popup').classList.add('popup-without-swiper');
		} else {
			document.getElementById('swipe-left').style.display = "block";
			document.getElementById('swipe-right').style.display = "block";
			document.getElementById('popup-footer').style.display = "block";
			document.getElementById('popup').classList.remove('popup-without-swiper');
		}
		projectAddress.textContent = studies[index].address;
		projectName.textContent = studies[index].name;
		projectOwner.textContent = ownersMap.get(studies[index].id);
		document.getElementById('popup-footer').textContent = index + 1 + ' / ' + studies.length;
	}

	function addLoading() {
		if (loading === 0) {
			show();
		}
		++loading;
		update();
	}

	/**
	 * Increment the count of loaded tiles.
	 */
	function addLoaded() {
		setTimeout(function () {
			++loaded;
			update();
		}, 100);
	}

	/**
	 * Update the progress bar.
	 */
	function update() {
		var progress = document.getElementById('map-progress-bar');
		var width = (loaded / loading * 25).toFixed(1) + '%';
		progress.style.width = width;
		progress.textContent = (loaded / loading * 100).toFixed(0) + '%';
		if (loading === loaded) {
			loading = 0;
			loaded = 0;
			setTimeout(function () {
				hide();
			}, 500);
		}
	}

	/**
	 * Show the progress bar.
	 */
	function show() {
		var progress = document.getElementById('map-progress-bar');
		progress.style.visibility = 'visible';
	}

	/**
	 * Hide the progress bar.
	 */
	function hide() {
		var progress = document.getElementById('map-progress-bar');
		if (loading === loaded) {
			progress.style.visibility = 'hidden';
			progress.style.width = 0;
		}
	}


	function loadSavedStudy() {
		var LoadStudyRequest = getConnectionAwareXmlHttpRequest('GET', '/lands', function (responseText) {
			operations = JSON.parse(responseText);
			if (operations && operations.length > 0) {
				savedStudySource = new ol.source.Vector();
				operations.forEach(operation => {
					savedStudySource.addFeatures((new ol.format.GeoJSON()).readFeatures(operation, {
						featureProjection: 'EPSG:3857'
					}));
					if (!ownersList.find(function (owner) {
							return owner.name === operation.owner;
						})) {
						ownersList.push({
							"name": operation.owner
						});
					}
					ownersMap.set(operation.features[0].properties.id, operation.owner);
				});
			}
			addSavedStudyLayer();
			initSelectInteraction();
			initSearch();
			initSearchFilters();
		});
		LoadStudyRequest.setRequestHeader("Accept", "application/json");
		LoadStudyRequest.send();
	}

	function saveStudy() {
		var properties = getSelectedStudy();
		updateSelectedStudy(properties);
		updateSelectedStudyOverlay(properties);
		var saveRequest = getConnectionAwareXmlHttpRequest('POST', '/lands', function (responseText) {
			operations = JSON.parse(responseText);
			if (operations && operations.length > 0) {
				if (selectedStudyLayer == newStudyLayer) {
					newStudySource.clear();
					newStudyFeature = null;
				}
				savedStudySource.clear();
				operations.forEach(operation => {
					savedStudySource.addFeatures((new ol.format.GeoJSON()).readFeatures(operation, {
						featureProjection: 'EPSG:3857'
					}));
					ownersMap.set(operation.features[0].properties.id, operation.owner);
				});
				var featureStyled = false;
				savedStudySource.forEachFeature(function (feature) {
					if (!featureStyled && isSelectedStudy(feature)) {
						feature.setStyle(onGoingSelectedStudyStyle);
						selectedStudyFeature = feature;
						featureStyled = true;
					}
				});
				selectedStudyLayer = savedStudyLayer;
				clearFilters();
			}

			if (properties.status !== 'ARCHIVED') {
				showLoadingAnimation("contextual-menu");
				showDialogMessage("profil", "success", I18N_SAVE_SUCCESS_MESSAGE);
				stopLoadingAnimation("contextual-menu");
			} else {
				showLoadingAnimation("contextual-menu");
				showDialogMessage("profil", "success", I18N_DELETE_SUCCESS_MESSAGE);
				stopLoadingAnimation("contextual-menu");
			}
		});
		saveRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		saveRequest.setRequestHeader("Accept", "application/json;charset=UTF-8");
		var coordinates = new ol.proj.transform(selectedStudyFeature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');

		var landFeature = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: coordinates
			},
			properties: properties
		}
		saveRequest.send(JSON.stringify(landFeature));
	}

	function matchStudyByName(name) {
		var featureStyled = false;
		var matchingFeature = null;
		savedStudySource.forEachFeature(function (feature) {
			if (!featureStyled) {
				let study = getSelectedStudy(feature);
				if (study.name == name) {
					matchingFeature = feature;
				}
			}
		});
		if (matchingFeature) {
			var geometry = matchingFeature.getGeometry();
			projectSearchMatchingCoord = geometry.getCoordinates();
			flyTo(projectSearchMatchingCoord, 19);
		}
	}

	function selectProjectSearchMatch() {
		if (projectSearchMatchingCoord) {
			selectOrCreateLand(ol3Map.getPixelFromCoordinate(projectSearchMatchingCoord), projectSearchMatchingCoord, null);
			projectSearchMatchingCoord = null;
		}
	}

	function shareStudy() {
		var selectedStudy = getSelectedStudy();
		if (selectedStudy.id && selectedStudy.id != "") {
			var shareRequest = getConnectionAwareXmlHttpRequest('POST', '/shares');
			var share = {
				landId: selectedStudy.id,
				users: Array.from(sharedWithUsers)
			}
			shareRequest.send(JSON.stringify(share));
		}
	}

	function reloadSelectedFeature(geojson) {
		savedStudySource.removeFeature(selectedStudyFeature);
		let updatedFeature = (new ol.format.GeoJSON()).readFeature(JSON.parse(geojson), {
			featureProjection: 'EPSG:3857'
		})
		savedStudySource.addFeature(updatedFeature);
		updatedFeature.setStyle(selectedStudyFeature.getStyle());
		selectedStudyFeature = updatedFeature;
	}

	function viewport() {
		var e = window,
			a = 'inner';
		if (!('innerWidth' in window)) {
			a = 'client';
			e = document.documentElement || document.body;
		}
		return e[a + 'Width'];
	}

	function initSwiper() {
		mySwiper = new Swiper('.swiper-container', {
			direction: 'horizontal',
			spaceBetween: 30,
			slidesPerView: 'auto',
			centeredSlides: false,
			keyboardControl: true,
			mousewheelControl: true,
			resistance: false,
			pagination: '.swiper-pagination',
			paginationClickable: true,
			nextButton: '.swiper-button-next',
			prevButton: '.swiper-button-prev',
			preventClicksPropagation: false,
			preventClicks: false,
			slidesOffsetBefore: 50,
			slidesOffsetAfter: 50
		});
	}

	// media query change
	function WidthChange(mq) {
		var boxScenes = Array.from(document.getElementsByClassName("box-scene"));
		if (mq.matches) {
			boxScenes.forEach(boxScene => {
				boxScene.classList.remove("box-scene-hover");
				activateClickHandler(boxScene);
			});
		} else {
			boxScenes.forEach(boxScene => {
				boxScene.classList.remove("click-event");
				boxScene.classList.add("box-scene");
				boxScene.classList.add("box-scene-hover");
				deactivateClickHandler(boxScene);
			});
		}
	}

	function activateClickHandler(boxScene) {
		boxScene.addEventListener('click', rotateOnClick);
	}

	function deactivateClickHandler(boxScene) {
		boxScene.removeEventListener('click', rotateOnClick);
	}

	function rotateOnClick() {
		if (!this.classList.contains('click-event')) {
			if ($('.click-event')) {
				$('.click-event').removeClass('click-event');
			}
			this.classList.add('click-event');
		} else {
			this.classList.remove('click-event');
		}
	}

	function initSelectInteraction() {
		ol3Map.on('singleclick', function (evt) {
			selectOrCreateLand(evt.pixel, evt.coordinate);
		});

		/*var translate = new ol.interaction.Translate({
			features: selectedStudyFeature
		});
		ol3Map.addInteraction(translate);*/
	}

	function defaultLandForm(defaultValue) {
		document.getElementById("menu-land-address").value = defaultValue ? defaultValue : '';
		document.getElementById('menu-land-name').value = '';
		document.getElementById('menu-land-area').value = '';
	}

	function defaultOverlayLandForm(defaultValue) {
		document.getElementById("overlay-land-address").value = defaultValue ? defaultValue : '';
		document.getElementById('overlay-land-name').value = '';
		document.getElementById('overlay-land-area').value = '';
	}

	function selectOrCreateLand(pixel, coord, geoJsonFeature) {
		popupOverlay.setPosition(undefined);
		var previousSelectedStudy = window.ppmds.home.getSelectedStudy();
		var selected = false;
		selectedCluster = null;
		ol3Map.forEachFeatureAtPixel(pixel, function (feature, layer) {
			selected = true;
			var features = feature.get('features');
			if (features && features.length == 1 && layer == savedStudyLayer) {
				if (selectedStudyFeature && selectedStudyLayer == newStudyLayer) {
					selectedStudyFeature.setStyle(newStudyStyle);
				} else if (selectedStudyFeature) {
					let selectedStudy = getSelectedStudy();
					if (selectedStudy.status == 'COMPLETED') {
						selectedStudyFeature.setStyle(completedStudyStyle);
					} else {
						selectedStudyFeature.setStyle(onGoingStudyStyle);

					}
				}
				selectedStudyFeature = feature;
				selectedStudyLayer = savedStudyLayer;
				let selectedStudy = getSelectedStudy();
				if (selectedStudy.status == 'COMPLETED') {
					selectedStudyFeature.setStyle(completedSelectedStudyStyle);
				} else {
					selectedStudyFeature.setStyle(onGoingSelectedStudyStyle);
				}
				landSelectionChangedCallBack(displayContextualMenuSideBar);
			} else if (features && features.length > 1 && layer == savedStudyLayer) {
				selectedStudyFeature = null;
				selectedCluster = feature;
				selectedStudyLayer = savedStudyLayer;
			} else if (layer == newStudyLayer) {
				if (selectedStudyFeature && selectedStudyLayer == newStudyLayer) {
					selectedStudyFeature.setStyle(newStudyStyle);
				} else if (selectedStudyFeature) {
					let selectedStudy = getSelectedStudy();
					if (selectedStudy.status == 'COMPLETED') {
						selectedStudyFeature.setStyle(completedStudyStyle);
					} else {
						selectedStudyFeature.setStyle(onGoingStudyStyle);
						showPopupQuestion();
						menuCircleUnselectedProject();
                        enableHoverMsgCreateOrSelect();
					}
					selectedStudyLayer.changed();
				}
				selectedStudyFeature = feature;
				selectedStudyFeature.setStyle(newSelectedStudyStyle);
				selectedStudyLayer = newStudyLayer;
			}
		}, {
			layerFilter: function (layer) {
				return layer != cityPolygonLayer && layer != countryPolygonLayer ? true : false;
			},
			hitTolerance: 10
		});

		if (!selected) {
			if (selectedStudyFeature && selectedStudyLayer == savedStudyLayer) {
				let selectedStudy = getSelectedStudy();
				if (selectedStudy.status == 'COMPLETED') {
					selectedStudyFeature.setStyle(completedStudyStyle);
				} else {
					selectedStudyFeature.setStyle(onGoingStudyStyle);
				}
			}
			selectedStudyFeature = createLand(coord);
			selectedStudyFeature.setStyle(newSelectedStudyStyle);
			selectedStudyLayer = newStudyLayer;
			if (!geoJsonFeature) {
				var coordinates = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
				reverseGeocode(selectedStudyFeature, coordinates[0], coordinates[1]);
			} else {
				initNewStudyFeature(geoJsonFeature);
				landSelectionChangedCallBack(displayContextualMenuSideBar);
				var serviceMenu = document.getElementById('service-menu-content');
				if (serviceMenu.style.display == "block") {
					loadMenuFragment(serviceMenu, null, serviceMenu.firstChild.id.replace('-menu', ''));
				}
			}
		} else if (selectedStudyFeature || (selectedCluster && ol3Map.getView().getZoom() == 19)) {
			let currentSelectedStudy = window.ppmds.home.getSelectedStudy();
			var serviceMenu = document.getElementById('service-menu-content');
			if (previousSelectedStudy) {
				if (currentSelectedStudy.id != previousSelectedStudy.id || currentSelectedStudy.address != previousSelectedStudy.address) {
					var serviceMenu = document.getElementById('service-menu-content');
					if (serviceMenu.style.display == "block") {
						loadMenuFragment(serviceMenu, null, serviceMenu.firstChild.id.replace('-menu', ''));
					}
				}
			}
			if (selectedStudyLayer == savedStudyLayer) {
				showPopup();
				menuCircleSelectedProject();
                hidePopupQuestion();
                disableHoverMsgCreateOrSelect();
                checkSubscriptionCircleMenu(products);
			}
		}
		if (selectedCluster) ol3Map.getView().setZoom(ol3Map.getView().getZoom() + 3);
		ol3Map.getView().setCenter(coord);
	}

	function landSelectionChangedCallBack(callFunction, study) {
		updateContextualMenu(study);
		updateOverlayProject(study);
		if (callFunction) callFunction();
		loadSharedWithUsers(study);
		var attachmentMenu = document.getElementById('sidebar-file');
		clearContent(attachmentMenu);
		loadAttachments(study);
	}

	function updateContextualMenu(study) {
		var selectedStudy = study ? study : getSelectedStudy();
		document.getElementById("menu-land-address").value = selectedStudy.address;
		document.getElementById('menu-land-name').value = selectedStudy.name;
		document.getElementById('menu-land-area').value = selectedStudy.landArea;
		document.getElementById('menu-land-status').value = selectedStudy.status;
		document.getElementById('menu-land-name-title').textContent = selectedStudy.name ? selectedStudy.name : "Nouveau projet";
		var btnSave = document.getElementById('menu-land-submit');
		if (selectedStudy.source !== "DS" && customer.subscriptions) {
			btnSave.style.display = "none";
		} else {
			btnSave.style.display = "block";
		}
	}

	function updateOverlayProject(study) {
		var selectedStudy = study ? study : getSelectedStudy();
		document.getElementById("overlay-land-address").value = selectedStudy.address;
		document.getElementById('overlay-land-name').value = selectedStudy.name;
		document.getElementById('overlay-land-area').value = selectedStudy.landArea;
		document.getElementById('overlay-land-status').value = selectedStudy.status;

		var btnSave = document.getElementById('overlay-land-submit');
		if (selectedStudy.source !== "DS" && customer.subscriptions) {
			btnSave.style.display = "none";
		} else {
			btnSave.style.display = "block";
		}
	}

	function loadSharedWithUsers(study) {
		var selectedStudy = study ? study : getSelectedStudy();
		if (selectedStudy.id && selectedStudy.id != "") {
			var sharedWIthUsersRequest = getConnectionAwareXmlHttpRequest('GET', '/shares?landId=' + encodeURIComponent(selectedStudy.id), function (responseText) {
				sharedWithUsers = new Set(JSON.parse(responseText));
				highlightUsers();
			});
			sharedWIthUsersRequest.setRequestHeader("Accept", "application/json");
			sharedWIthUsersRequest.send();
		}
	}

	function highlightUsers() {
		clearHighlightedUsers();
		sharedWithUsers.forEach(sharedWithUser => {
			if (sharedWithUser != customer.mail) {
				let userItem = document.getElementById(sharedWithUser + '-user-id');
				userItem.classList.add('selected');
			}
		});
	}

	function clearHighlightedUsers() {
		var userList = document.getElementById('user-list');
		var userItems = userList.getElementsByTagName("li");
		for (var i = 0; i < userItems.length; i++) {
			userItems[i].classList.remove('selected');
		}
	}

	function removeMarker(obj) {
		newStudySource.removeFeature(obj.data.marker);
	}

	function createLand(coord) {
		if (!newStudyFeature) {
			newStudyFeature = new ol.Feature({
				type: 'removable',
				geometry: new ol.geom.Point(coord)
			});
			newStudySource.addFeature(newStudyFeature);
		} else newStudyFeature.getGeometry().setCoordinates(coord);
		newStudyFeature.setStyle(newStudyStyle);
		return newStudyFeature;
	}


	function reverseGeocode(newStudyFeature, longitude, latitude) {
		var addr_query = "";
		addr_query = "lon=" + longitude + "&lat=" + latitude;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'https://api-adresse.data.gouv.fr/reverse/?' + addr_query);
		xhr.addEventListener('readystatechange', function () {
			if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.features.length > 0) {
					/*if (!isInsideCity(response.features[0])) highlightCity(response.features[0].properties.city, response.features[0].geometry.coordinates, false);*/
					defaultLandForm();
					defaultOverlayLandForm();
					initNewStudyFeature(response.features[0]);
				} else {
					clearHighlight();
					defaultLandForm(I18N_LAND_FORM_DATA_NA);
					defaultOverlayLandForm(I18N_LAND_FORM_DATA_NA);
					initNewStudyFeature();
				}
				landSelectionChangedCallBack(displayContextualMenuSideBar);
				stopLoadingAnimation('contextual-menu');
				var serviceMenu = document.getElementById('service-menu-content');
				if (serviceMenu.style.display == "block") {
					loadMenuFragment(serviceMenu, null, serviceMenu.firstChild.id.replace('-menu', ''));
				}
			}
		});
		xhr.send(null);
	}

	function initNewStudyFeature(geoJsonFeature) {
		showPopupQuestion();
		menuCircleUnselectedProject();
        enableHoverMsgCreateOrSelect();
		var postcode, city;
		postcode = geoJsonFeature ? geoJsonFeature.properties.postcode : '';
		city = geoJsonFeature ? geoJsonFeature.properties.city : '';
		var name = document.getElementById('menu-land-name').value ? document.getElementById('menu-land-name').value : '';
		var landArea = document.getElementById('menu-land-area').value ? document.getElementById('menu-land-area').value : '';
		var feature = {
			name: name,
			landArea: landArea,
			address: geoJsonFeature ? geoJsonFeature.properties.label : '',
			postcode: postcode,
			city: city,
			taxes: getNewStudyCountryTax()
		}
		newStudyFeature.properties = {};
		newStudyFeature.properties.features = [];
		newStudyFeature.properties.features.push(feature);
	}

	function isInsideCity(feature) {
		var isInside = false;
		if (newStudyFeature && newStudyFeature.properties &&
			newStudyFeature.properties.features && newStudyFeature.properties.features.length > 0) {
			isInside = newStudyFeature.properties.features[0].city == (feature.properties ? feature.properties.city : feature.getProperties().features[0].get('city'));
		}
		return isInside;
	}

	function getNewStudyCountryTax() {
		var tax = [0];
		var countryFeatures = countryPolygonLayer.getSource().getFeatures();
		for (var i = 0; i < countryFeatures.length; i++) {
			if (newStudyFeature && ol.extent.containsCoordinate(countryFeatures[i].getGeometry().getExtent(), newStudyFeature.getGeometry().getCoordinates())) {
				return countryFeatures[i].getProperties().taxes;
			}
		}
		return tax;
	}

	function addCountryPolygonLayer() {
		countryPolygonLayer = new ol.layer.Vector({
			source: new ol.source.Vector(),
			style: []
		});
		ol3Map.addLayer(countryPolygonLayer);
	}

	function addCityPolygonLayer() {
		cityPolygonLayer = new ol.layer.Vector({
			source: new ol.source.Vector(),
			style: [cityPolygonShadow, cityPolygonStyle]
		});
		ol3Map.addLayer(cityPolygonLayer);
	}

	function addNewStudyLayer() {
		newStudyLayer = new ol.layer.Vector({
			source: newStudySource,
			style: newStudyStyle
		});
		ol3Map.addLayer(newStudyLayer);
	}

	function addSavedStudyLayer() {
		savedStudyLayer = new ol.layer.Vector({
			source: new ol.source.Cluster({
				distance: 40,
				source: savedStudySource
			}),
			style: savedStudyStyleFunction
		});
		ol3Map.addLayer(savedStudyLayer);
	}

	function savedStudyStyleFunction(feature, resolution) {
		if (resolution != currentResolution) {
			calculateClusterInfo(resolution);
			currentResolution = resolution;
		}
		var style;
		var size = feature.get('features').length;
		if (size > 1) {
			var clusterFeaturesColors = [];
			feature.get('features').forEach(feature => {
				clusterFeaturesColors.push($.Color(statusColors.get(feature.getProperties().status)));
			})
			var colorCluster = Color_mixer.mix(clusterFeaturesColors)._rgba;
			style = new ol.style.Style({
				image: new ol.style.Circle({
					radius: 40,
					fill: new ol.style.Fill({
						color: [colorCluster[0], colorCluster[1], colorCluster[2], Math.min(0.8, 0.4 + (size / maxFeatureCount))]
					})
				}),
				text: new ol.style.Text({
					text: size.toString(),
					fill: textFill,
					stroke: textStroke
				})
			});
		} else {
			if (selectedStudyLayer == savedStudyLayer && selectedStudyFeature && feature.getProperties().features[0].get('id') == (selectedStudyFeature.getProperties().id ? selectedStudyFeature.getProperties().id : selectedStudyFeature.getProperties().features[0].get('id'))) {
				let selectedStudy = getSelectedStudy();
				if (selectedStudy.status == 'COMPLETED') {
					style = completedSelectedStudyStyle;
				} else {
					style = onGoingSelectedStudyStyle;
				}
			} else {
				if (feature.getProperties().features[0].get('status') == 'COMPLETED') {
					style = completedStudyStyle;
				} else {
					style = onGoingStudyStyle;
				}
			}
		}
		return style;
	}

	function calculateClusterInfo(resolution) {
		maxFeatureCount = 0;
		var features = savedStudyLayer.getSource().getFeatures();
		var feature, radius;
		for (var i = features.length - 1; i >= 0; --i) {
			feature = features[i];
			var originalFeatures = feature.get('features');
			maxFeatureCount = Math.max(maxFeatureCount, originalFeatures.length);
		}
	}

	function isSelectedStudy(study) {
		var result = true;
		if (selectedStudyFeature && selectedStudyLayer == savedStudyLayer) {
			result = result && (study.getProperties().id == (selectedStudyFeature.getProperties().id ? selectedStudyFeature.getProperties().id : selectedStudyFeature.getProperties().features[0].get('id')));
		} else if (selectedStudyFeature && selectedStudyLayer == newStudyLayer &&
			selectedStudyFeature.properties && selectedStudyFeature.properties.features &&
			selectedStudyFeature.properties.features.length > 0) {
			result = result && (study.getProperties().name == selectedStudyFeature.properties.features[0].name);
			result = result && (study.getProperties().landArea == selectedStudyFeature.properties.features[0].landArea);
			result = result && (study.getProperties().address == selectedStudyFeature.properties.features[0].address);
			result = result && (study.getProperties().postcode == selectedStudyFeature.properties.features[0].postcode);
			result = result && (study.getProperties().city == selectedStudyFeature.properties.features[0].city);
		}
		return result;
	}

	function updateSelectedStudy(selectedStudy) {
		selectedStudy.name = document.getElementById('menu-land-name').value;
		selectedStudy.landArea = document.getElementById('menu-land-area').value;
		selectedStudy.status = document.getElementById('menu-land-status').value;
		updateSelectedStudyFeature(selectedStudy.taxes);
	}

	function updateSelectedStudyOverlay(selectedStudy) {
		selectedStudy.name = document.getElementById('overlay-land-name').value;
		selectedStudy.landArea = document.getElementById('overlay-land-area').value;
		selectedStudy.status = document.getElementById('overlay-land-status').value;
		updateSelectedStudyFeatureOverlay(selectedStudy.taxes);
	}

	function updateSelectedStudyFeature(taxesValue) {
		if (selectedStudyFeature && selectedStudyLayer == savedStudyLayer &&
			selectedStudyFeature.getProperties() && selectedStudyFeature.getProperties().features &&
			selectedStudyFeature.getProperties().features.length > 0) {
			selectedStudyFeature.getProperties().features[0].set('name', document.getElementById('menu-land-name').value);
			selectedStudyFeature.getProperties().features[0].set('landArea', document.getElementById('menu-land-area').value);
			selectedStudyFeature.getProperties().features[0].set('status', document.getElementById('menu-land-status').value);
			selectedStudyFeature.getProperties().taxes = taxesValue;
		} else if (selectedStudyFeature && selectedStudyLayer == savedStudyLayer &&
			selectedStudyFeature.getProperties()) {
			selectedStudyFeature.getProperties().name = document.getElementById('menu-land-name').value;
			selectedStudyFeature.getProperties().landArea = document.getElementById('menu-land-area').value;
			selectedStudyFeature.getProperties().status = document.getElementById('menu-land-status').value;
			selectedStudyFeature.getProperties().taxes = taxesValue;
		} else if (selectedStudyFeature && selectedStudyLayer == newStudyLayer &&
			selectedStudyFeature.properties && selectedStudyFeature.properties.features &&
			selectedStudyFeature.properties.features.length > 0) {
			selectedStudyFeature.properties.features[0].name = document.getElementById('menu-land-name').value;
			selectedStudyFeature.properties.features[0].landArea = document.getElementById('menu-land-area').value;
			selectedStudyFeature.properties.features[0].status = document.getElementById('menu-land-status').status;
			selectedStudyFeature.properties.features[0].taxes = taxesValue;
		}
	}

	function updateSelectedStudyFeatureOverlay(taxesValue) {
		if (selectedStudyFeature && selectedStudyLayer == savedStudyLayer &&
			selectedStudyFeature.getProperties() && selectedStudyFeature.getProperties().features &&
			selectedStudyFeature.getProperties().features.length > 0) {
			selectedStudyFeature.getProperties().features[0].set('name', document.getElementById('overlay-land-name').value);
			selectedStudyFeature.getProperties().features[0].set('landArea', document.getElementById('overlay-land-area').value);
			selectedStudyFeature.getProperties().features[0].set('status', document.getElementById('overlay-land-status').value);
			selectedStudyFeature.getProperties().taxes = taxesValue;
		} else if (selectedStudyFeature && selectedStudyLayer == savedStudyLayer &&
			selectedStudyFeature.getProperties()) {
			selectedStudyFeature.getProperties().name = document.getElementById('overlay-land-name').value;
			selectedStudyFeature.getProperties().landArea = document.getElementById('overlay-land-area').value;
			selectedStudyFeature.getProperties().status = document.getElementById('overlay-land-status').value;
			selectedStudyFeature.getProperties().taxes = taxesValue;
		} else if (selectedStudyFeature && selectedStudyLayer == newStudyLayer &&
			selectedStudyFeature.properties && selectedStudyFeature.properties.features &&
			selectedStudyFeature.properties.features.length > 0) {
			selectedStudyFeature.properties.features[0].name = document.getElementById('overlay-land-name').value;
			selectedStudyFeature.properties.features[0].landArea = document.getElementById('overlay-land-area').value;
			selectedStudyFeature.properties.features[0].status = document.getElementById('overlay-land-status').status;
			selectedStudyFeature.properties.features[0].taxes = taxesValue;
		}
	}

	function initSearch() {
		var inputTextAddress = document.getElementById('search-address-input');
		inputTextAddress.addEventListener('keyup', query, false);
		inputTextAddress.addEventListener('input', handleValue, false);
		var inputTextProject = document.getElementById('search-project-input');
		inputTextProject.addEventListener('input', function (event) {
			clearGeoSearchResults();
			var value = event.target.value.trim();
			var resetButton = document.getElementById('geocoder-reset');
			if (value.length) {
				resetButton.style.display = "inline";
				createSearchProjectResultList(value);
			} else {
				resetButton.style.display = "none";
				clearGeoSearchResults();
			}
		});
		document.getElementById('geocoder-reset').addEventListener('click', reset, false);
	}

	function query(event) {
		var value = event.target.value.trim();
		var hit = event.key ? event.key === 'Enter' : event.which ? event.which === 13 : event.keyCode ? event.keyCode === 13 : false;

		if (hit) {
			event.preventDefault();
			search(value);
		}
	}

	function handleValue(event) {
		var value = event.target.value.trim();
		var resetButton = document.getElementById('geocoder-reset');
		if (value.length) {
			resetButton.style.display = "inline";
			if (value !== lastQuery) {
				lastQuery = value;
				timeout && clearTimeout(timeout);
				timeout = setTimeout(() => {
					if (value.length >= 2) {
						search(value);
					}
				}, 200);
			}
		} else {
			resetButton.style.display = "none";
			clearGeoSearchResults();
		}
	}

	function search(value) {
		//if(lastQuery==value && document.getElementById("geocoder-result").firstChild) return;
		lastQuery = value;
		clearGeoSearchResults();
		var resetButton = document.getElementById('geocoder-reset');
		resetButton.setAttribute('class', 'geocoder-reset-animation');
		var banoRequest = new XMLHttpRequest();
		banoRequest.open('GET', 'https://api-adresse.data.gouv.fr/search/?q=' + value);
		banoRequest.setRequestHeader("Accept", "application/json");
		banoRequest.addEventListener('readystatechange', function () {
			if (banoRequest.readyState === XMLHttpRequest.DONE && banoRequest.status === 200) {
				var results = JSON.parse(banoRequest.responseText);
				if (results) createSearchResultList(results);
			}
			resetButton.removeAttribute('class');
		});
		banoRequest.send();
	}

	function createSearchResultList(results) {
		var ul = document.getElementById('geocoder-result');
		results.features.forEach(geoJsonFeature => {
			var anchorElt = document.createElement('a');
			var iElt = document.createElement('i');
			iElt.setAttribute('class', 'fa fa-map-marker');
			anchorElt.appendChild(iElt);
			addAddress(anchorElt, geoJsonFeature);
			var li = document.createElement('li');
			li.appendChild(anchorElt);
			li.addEventListener('click', evt => {
				evt.preventDefault();
				clearGeoSearchResults();
				var spanElts = Array.from(li.getElementsByTagName('span'));
				var value = '';
				spanElts.forEach(span => {
					value += span.textContent
				});
				document.getElementById('search-address-input').value = value;
				var coord = [parseFloat(geoJsonFeature.geometry.coordinates[0]), parseFloat(geoJsonFeature.geometry.coordinates[1])];
				var projection = ol3Map.getView().getProjection();
				var projectionCoord = ol.proj.transform(coord, 'EPSG:4326', projection);
				selectOrCreateLand(ol3Map.getPixelFromCoordinate(projectionCoord), projectionCoord, geoJsonFeature);
				/*highlightCity(geoJsonFeature.properties.city, geoJsonFeature.geometry.coordinates, true);*/
				flyTo(projectionCoord, 19);
			}, false);
			ul.appendChild(li);
		});
	}

	function createSearchProjectResultList(value) {
		var ul = document.getElementById('geocoder-result');
		var value = value.toUpperCase();
		var filteredOperations = operations.filter(function (operation) {
			return (operation.features[0].properties.name.toUpperCase().indexOf(value) > -1);
		});
		filteredOperations.forEach(operation => {
			var anchorElt = document.createElement('a');
			var spanElt = document.createElement('span');
			spanElt.textContent = operation.features[0].properties.name;
			var iElt = document.createElement('i');
			iElt.setAttribute('class', 'fa fa-map-marker');
			anchorElt.appendChild(iElt);
			anchorElt.appendChild(spanElt);
			var li = document.createElement('li');
			li.appendChild(anchorElt);
			li.addEventListener('click', evt => {
				evt.preventDefault();
				var value = spanElt.textContent;
				document.getElementById('search-project-input').value = value;
				matchStudyByName(spanElt.textContent);
				clearGeoSearchResults();
			}, false);
			ul.appendChild(li);
		});
	}

	function clearHighlight() {
		cityPolygonLayer.getSource().clear();
		cityPolygonFeature = null;
	}

	function highlightCity(city, coordinates, fly) {
		clearHighlight();
		var geoRequest = new XMLHttpRequest();
		geoRequest.open('GET', 'https://nominatim.openstreetmap.org/search/' + city + '? format=json&limit=1&polygon_geojson=1');
		geoRequest.setRequestHeader("Accept", "application/json");
		geoRequest.addEventListener('readystatechange', function () {
			if (geoRequest.readyState === XMLHttpRequest.DONE && geoRequest.status === 200) {
				var results = JSON.parse(geoRequest.responseText);
				if (results && results.length > 0 && results[0].geojson) {
					var geojson = results[0].geojson;
					var projection = ol3Map.getView().getProjection();
					var polygon;
					if (geojson.type == 'Polygon') {
						polygon = new ol.geom.Polygon(geojson.coordinates);
					} else if (geojson.type == 'MultiPolygon') {
						polygon = new ol.geom.MultiPolygon(geojson.coordinates);
					}
					if (polygon) {
						polygon.transform('EPSG:4326', projection);
						cityPolygonFeature = new ol.Feature(polygon);
						cityPolygonLayer.getSource().addFeature(cityPolygonFeature);
					}
				}
			}
		});
		geoRequest.send();
		if (fly == true) {
			var coord = [parseFloat(coordinates[0]), parseFloat(coordinates[1])];
			var projection = ol3Map.getView().getProjection();
			var projectionCoord = ol.proj.transform(coord, 'EPSG:4326', projection);
			flyTo(projectionCoord, 19);
		}
	}

	function flyTo(coord, zoomLevel) {
		var view = ol3Map.getView();
		view.setZoom(zoomLevel);
		view.setCenter(coord);
		displayContextualMenuSideBar();
		var duration = 1000;

		if (view.getZoom() < zoomLevel) {
			view.animate({
				zoom: 10,
				duration: duration,
				center: coord
			}, {
				zoom: zoomLevel,
				duration: duration,
				center: coord
			});
		} else {
			view.setCenter(coord);
		}
	}

	function addAddress(anchorElt, feature) {
		var details = [];
		var types = {
			street: 'rue',
			locality: 'lieu-dit',
			hamlet: 'hameau',
			village: 'village',
			commune: 'commune'
		};
		var title = document.createElement('span');
		var detailsContainer = document.createElement('span');
		title.setAttribute('class', 'geocoder-road');
		title.innerHTML = feature.properties.name;
		if (types[feature.properties.type]) title.innerHTML += ' (' + types[feature.properties.type] + ')';
		title.innerHTML += ' ' + feature.properties.postcode;
		if (feature.properties.city && feature.properties.city !== feature.properties.name) {
			details.push(' ' + feature.properties.city + ' - ');
		} else {
			detailsContainer.innerHTML += ' - ';
		}
		if (feature.properties.context) details.push(feature.properties.context);
		detailsContainer.innerHTML += details.join(' ');
		anchorElt.appendChild(title);
		anchorElt.appendChild(detailsContainer);
	}

	function htmlEscape(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	function reset(event) {
		var inputAddressText = document.getElementById('search-address-input');
		inputAddressText.focus();
		var inputProjectText = document.getElementById('search-project-input');
		inputProjectText.focus();
		inputAddressText.value = '';
		inputProjectText.value = '';
		lastQuery = '';
		document.getElementById('geocoder-reset').style.display = "none";
		clearGeoSearchResults();
	}

	function clearGeoSearchResults() {
		var ul = document.getElementById('geocoder-result');
		while (ul.hasChildNodes()) {
			ul.removeChild(ul.lastChild);
		}
	}

	function smoothScroll() {
		$('.js-scroll-to').on('click', function (e) {
			var page = $(this).attr('href');
			var speed = 1000;
			$('html, body').animate({
				scrollTop: $(page).offset().top - 70
			}, speed);
			return false;
		});
	}

	function initSearchFilters() {
		createOwnerList();
		initSearchEvents();
	}

	function showFilterList(filterId) {
		var filter = document.getElementById(filterId);
		filter.classList.add('search-filter-active');
	}

	function hideFilterList(filterId) {
		var filter = document.getElementById(filterId);
		filter.classList.remove('search-filter-active');
		if (filterId == 'search-filter-owner') {
			clearOwnerList();
		}
	}

	function createOwnerList() {
		var ul = document.getElementById('search-filter-owner-list');
		var itemEltAll = document.createElement('li');
		var iconEltAll = document.createElement('i');
		iconEltAll.setAttribute('class', 'fa fa-user');
		iconEltAll.setAttribute('aria-hidden', 'true');
		iconEltAll.style.color = 'inherit';
		var spanEltAll = document.createElement('span');
		spanEltAll.textContent = 'Tous';
		itemEltAll.appendChild(iconEltAll);
		itemEltAll.appendChild(spanEltAll);
		ul.appendChild(itemEltAll);
		itemEltAll.addEventListener('click', function () {
			var input = document.getElementById('search-filter-owner-input');
			input.value = spanEltAll.textContent;
			var icon = document.getElementById('search-filter-owner-icon');
			icon.style.color = 'rgb(132, 146, 150)';
			filterFeatures();
		});
		ownersList.forEach(owner => {
			var itemElt = document.createElement('li');
			itemElt.setAttribute('data-option', owner.name);
			var iconElt = document.createElement('i');
			iconElt.setAttribute('class', 'fa fa-user');
			iconElt.setAttribute('aria-hidden', 'true');
			var spanElt = document.createElement('span');
			itemElt.addEventListener("click", function () {
				var previousActiveItem = document.getElementsByClassName('search-filter-owner-active')[0];
				if (typeof (previousActiveItem) !== 'undefined') {
					var previousActiveItemIcon = previousActiveItem.getElementsByTagName('i')[0];
					previousActiveItemIcon.classList.remove('fa-dot-circle-o');
					previousActiveItemIcon.classList.add('fa-user');
					previousActiveItem.classList.remove('search-filter-owner-active');
				}
				itemElt.classList.add('search-filter-owner-active');
				iconElt.classList.remove('fa-user');
				iconElt.classList.add('fa-dot-circle-o');
				var input = document.getElementById('search-filter-owner-input');
				input.value = owner.name;
				var icon = document.getElementById('search-filter-owner-icon');
				icon.classList.remove('fa-user-o');
				icon.classList.add('fa-user');
				icon.style.color = '#60c7d8';
				hideFilterList('search-filter-owner');
				filterFeatures();
			});
			spanElt.textContent = owner.name;
			itemElt.appendChild(iconElt);
			itemElt.appendChild(spanElt);
			ul.appendChild(itemElt);
		});
	}

	function searchOwner(input, ulId) {
		var filter, ul, li, span, i;
		var filter = input.value.toUpperCase();
		var ul = document.getElementById(ulId);
		var li = ul.getElementsByTagName("li");
		for (i = 0; i < li.length; i++) {
			span = li[i].getElementsByTagName("span")[0];
			if (span.innerHTML.toUpperCase().indexOf(filter) > -1) {
				li[i].style.display = "";
			} else {
				li[i].style.display = "none";
			}
		}
	}

	function clearOwnerList() {
		var ul = document.getElementById('search-filter-owner-list');
		var li = ul.getElementsByTagName("li");
		for (var i = 0; i < li.length; i++) {
			li[i].style.display = "";
		}
		clearOwnerListValue();
	}

	function clearOwnerListValue() {
		var input = document.getElementById('search-filter-owner-input');
		if (input.value == '') {
			var previousActiveItem = document.getElementsByClassName('search-filter-owner-active')[0];
			if (typeof (previousActiveItem) !== 'undefined') {
				previousActiveItem.getElementsByTagName('i')[0].classList.remove('fa-dot-circle-o');
				previousActiveItem.getElementsByTagName('i')[0].classList.add('fa-user');
				previousActiveItem.classList.remove('search-filter-owner-active');
			}
			document.getElementById('search-filter-owner-input').value = '';
			var icon = document.getElementById('search-filter-owner-icon');
			icon.classList.remove('fa-user');
			icon.classList.add('fa-user-o');
			icon.style.color = 'inherit';
		}
	}

	function clearFilterList(filter) {
		var iconFilter = document.getElementById('search-filter-' + filter + '-icon');
		var spanFilter = document.getElementById('search-filter-' + filter + '-span');
		var previousActiveItem = document.getElementsByClassName('search-filter-' + filter + '-active')[0];
		iconFilter.classList.remove('fa-circle');
		iconFilter.classList.add('fa-circle-o');
		iconFilter.style.color = 'inherit';
		if (filter == 'status') {
			spanFilter.textContent = 'Statut';
		} else if (filter == 'source') {
			spanFilter.textContent = 'Source';
		}
		spanFilter.setAttribute('data-selected', 'all');
		if (typeof (previousActiveItem) !== 'undefined') {
			var previousActiveItemIcon = previousActiveItem.getElementsByTagName('i')[0];
			if (previousActiveItem.getAttribute('data-option') !== 'all') {
				previousActiveItemIcon.classList.remove('fa-dot-circle-o');
				previousActiveItemIcon.classList.add('fa-circle');
			}
			previousActiveItem.classList.remove('search-filter-' + filter + '-active');
		}
	}

	function clearFilters() {
		clearFilterList('source');
		clearFilterList('status');
		document.getElementById('search-filter-owner-input').value = '';
		clearOwnerList();
		document.getElementById('search-project-input').value = '';
	}

	function selectSearchFilter(filter, filterId) {
		var itemElt = document.getElementById(filterId);
		var option = itemElt.getAttribute('data-option');
		var iconElt = document.getElementById(filterId).getElementsByTagName('i')[0];
		var spanFilter = document.getElementById(filter + '-span');
		var icon = document.getElementById(filter + '-icon');
		var previousActiveItem = document.getElementsByClassName(filter + '-active')[0];
		if (typeof (previousActiveItem) !== 'undefined') {
			var previousActiveItemIcon = previousActiveItem.getElementsByTagName('i')[0];
			if (previousActiveItem.getAttribute('data-option') == 'all') {
				icon.classList.remove('fa-asterisk');
			} else {
				previousActiveItemIcon.classList.remove('fa-dot-circle-o');
				icon.classList.remove('fa-circle-o');
				icon.classList.remove('fa-circle');
				previousActiveItemIcon.classList.add('fa-circle');
			}
			previousActiveItem.classList.remove(filter + '-active');
		}
		itemElt.classList.add(filter + '-active');
		if (option == 'all') {
			icon.classList.remove('fa-circle-o');
			icon.classList.remove('fa-circle');
			icon.classList.add('fa-asterisk');
		} else {
			iconElt.classList.remove('fa-circle');
			iconElt.classList.add('fa-dot-circle-o');
			icon.classList.add('fa-circle');
		}
		spanFilter.setAttribute('data-selected', itemElt.getAttribute('data-option'));
		spanFilter.textContent = document.getElementById(filterId).getElementsByTagName('span')[0].textContent;
		icon.style.color = iconElt.style.color;
		hideFilterList(filter);
	}

	function initSearchEvents() {
		document.getElementById("search-tabs").addEventListener('click', function () {
			$('#search-tabs-list').fadeToggle();
		});

		var searchTabs = Array.from(document.getElementById('search-tabs-list').getElementsByTagName('li'));
		searchTabs.forEach(searchTab => {
			searchTab.addEventListener('click', function () {
				reset();
				var previousTab = document.getElementsByClassName('search-tab-active')[0];
				document.getElementById(previousTab.getAttribute('data-target')).style.display = 'none';
				previousTab.classList.remove('search-tab-active');

				document.getElementById(searchTab.getAttribute('data-target')).style.display = 'block';
				searchTab.classList.add('search-tab-active');

				document.getElementById('search-tab-selected-text').textContent = searchTab.textContent;
			});
		});

		var searchFilters = Array.from(document.getElementsByClassName('search-filter'));
		searchFilters.forEach(searchFilter => {
			var filterId = searchFilter.getAttribute('id');
			searchFilter.addEventListener('click', function (e) {
				var filterId = searchFilter.getAttribute('id');
				if (this.classList.contains('search-filter-active')) {
					if (filterId == 'search-filter-owner') {
						if (e.target !== document.getElementById('search-filter-owner-input')) {
							hideFilterList(filterId);
						}
					} else {
						hideFilterList(filterId);
					}
				} else {
					if (filterId == 'search-filter-owner') {
						document.getElementById('search-filter-owner-input').focus();
					}
					showFilterList(filterId);
				}
			});
			if (filterId !== 'search-filter-owner') {
				var filterOptions = Array.from(document.getElementById(filterId + '-list').getElementsByTagName('li'));
				filterOptions.forEach(filterOption => {
					filterOption.addEventListener('click', function () {
						var filterOptionId = filterOption.getAttribute('id');
						selectSearchFilter(filterId, filterOptionId);
						filterFeatures();
					});
				});
			}
		});

		var ownerInput = document.getElementById('search-filter-owner-input');
		ownerInput.addEventListener('click', function () {
			ownerInput.value = '';
		})
	}

	/* --- Catalog --- */

	/*function toggleCatalog() {
		$("#catalog-container").stop(true, true).slideToggle(300, 'linear', function () {
			if (!mySwiper) {
				initSwiper();
			}
			initSelectedSolution();
			hideContact();
		});
		$('#search').toggleClass('search-offset');
	}

	function hideCatalog() {
		$("#catalog-container").slideUp(300, 'linear', function () {
			hideContact();
		});
		document.getElementById('search').classList.remove('search-offset');
	}

	function showCatalog() {
		$("#catalog-container").stop(true, true).slideDown(300, 'linear');
		if (!mySwiper) {
			initSwiper();
		}
		document.getElementById('search').classList.add('search-offset');
	}*/

	function initSelectedSolution() {
		var boxScenes = Array.from(document.getElementsByClassName("box-scene"));
		boxScenes.forEach(boxScene => {
			if (boxScene.className = 'box-scene box-scene-hover swiper-slide swiper-slide-next click-event') {
				boxScene.classList.remove("click-event");
			}
		});
	}

	/* --- Profile --- */
	function showProfile() {
		getCustomerData();
		$('.full-overlay').fadeIn();
		document.getElementById('profil').classList.add('profil-active');
	}

	function showAsideProfile() {
		document.getElementById('profil-panel').getElementsByTagName('aside')[0].classList.add('aside-active');
		document.getElementById('profil-panel').classList.add('profil-aside-active');
	}

	function hideAsideProfile() {
		document.getElementById('profil-panel').getElementsByTagName('aside')[0].classList.remove('aside-active');
		document.getElementById('profil-panel').classList.remove('profil-aside-active');
		$(".aside-nav a").removeClass('aside-nav-tab-active');
		$("#profil-panel aside section").fadeOut();
	}

	function hideProfile(element) {
		if (element !== document.getElementById('submit-profile')) {
			$('.full-overlay').fadeOut();
		}
		document.getElementById('profil').classList.remove('profil-active');
		hideAsideProfile();
		document.getElementById('profil').scrollTop = 0;
		var progress = document.getElementById('profil-progress-bar');
		progress.value = 0;
	}

	/* --- Dashboard --- */
	function showDashboard() {
		$('.full-overlay').fadeIn();
		document.getElementById('dashboard').classList.add('dashboard-active');
		showDashboardIndicatorPanel();
		hideDashboardUpgradeSubscriptionPanel();
		if (document.getElementById('program-name').textContent.includes('Basic')) {
			document.getElementById('overlay-archived-program').style.display = 'block';
			document.getElementById('archived-program-content').classList.add('dashboard-panel-effect');
		}
	}

	function hideDashboard(element) {
		$('.full-overlay').fadeOut();
		document.getElementById('dashboard').classList.remove('dashboard-active');
	}

	function showDashboardIndicatorPanel() {
		document.getElementById('dashboard-indicators-content').style.display = 'block';
		document.getElementById('dashboard-indicator-link').classList.add('active');
	}

	function hideDashboardIndicatorPanel(element) {
		document.getElementById('dashboard-indicators-content').style.display = 'none';
		document.getElementById('dashboard-indicator-link').classList.remove('active');
	}

	function showDashboardUpgradeSubscriptionPanel() {
		document.getElementById('dashboard-upgrade-subscription-content').style.display = 'block';
	}

	function hideDashboardUpgradeSubscriptionPanel(element) {
		document.getElementById('dashboard-upgrade-subscription-content').style.display = 'none';
	}

	/* --- Contact --- */
	function showContact(product) {
		document.getElementById('cart').getElementsByTagName('h1')[0].textContent = document.getElementById('contact-product').value = product.name;
		document.getElementById('cart').style.backgroundColor = product.color;
		document.getElementById('cart').getElementsByClassName('line')[0].style.color = 'rgba(0,0,0,0.07)';
		document.getElementById('cart').getElementsByTagName('img')[0].setAttribute('src', '/img/' + product.screenshot + '.png');
		document.getElementById('label-contact-cgu').style.color = '#616161';
		document.getElementById('contact-open-container').scrollTop = 0;
		document.getElementById('contact').classList.add('contact-active');
	}

	function hideContact() {
		document.getElementById('contact').classList.remove('contact-active');
	}

	/* --- Init content --- */
	function initContent() {
		function renderDialogMessage() {
			var container = document.getElementById('workspace');
			var mainContent = document.createElement('div');
			mainContent.style.display = 'none';
			mainContent.setAttribute('class', 'main-dialog-message');
			var firstDiv = document.createElement('div');
			var firstDivContent = document.createElement('i');
			firstDivContent.setAttribute('class', 'fa');
			firstDivContent.setAttribute('aria-hidden', 'true');
			var closeButton = document.createElement('div');
			closeButton.setAttribute('id', 'main-dialog-message-close');
			var secondDiv = document.createElement('div');
			var secondDivSpan = document.createElement('span');
			var secondDivButton = document.createElement('button');
			secondDivButton.setAttribute('id', 'home-dialog-button');
			secondDivButton.textContent = 'Fermer';
			secondDiv.appendChild(secondDivSpan);
			secondDiv.appendChild(secondDivButton);
			firstDiv.appendChild(firstDivContent);
			firstDiv.appendChild(closeButton);
			mainContent.appendChild(firstDiv);
			mainContent.appendChild(secondDiv);
			container.appendChild(mainContent);

			closeButton.addEventListener('click', function () {
				$('.main-dialog-message').fadeOut();
				$('.full-overlay').fadeOut();
				$('#overlay-new-project').fadeOut();
			});

			secondDivButton.addEventListener('click', function () {
				$('.main-dialog-message').fadeOut();
				$('.full-overlay').fadeOut();
				$('#overlay-new-project').fadeOut();
			});
		}
		renderDialogMessage();
	}

	function toggleSelectedFilter(e) {
		if (!$(e.target).closest('#search-filter-source-list').length && !$(e.target).closest('#search-filter-source').length) {
			if (document.getElementById('search-filter-source').classList.contains('search-filter-active')) hideFilterList('search-filter-source');
		}
		if (!$(e.target).closest('#search-filter-status-list').length && !$(e.target).closest('#search-filter-status').length) {
			if (document.getElementById('search-filter-status').classList.contains('search-filter-active')) hideFilterList('search-filter-status');
		}
		if (!$(e.target).closest('#search-filter-owner-list').length && !$(e.target).closest('#search-filter-owner').length) {
			if (document.getElementById('search-filter-owner').classList.contains('search-filter-active')) hideFilterList('search-filter-owner');
			clearOwnerListValue();
		}
	}

	/* --- Event handlers --- */
	function initEvents() {

		document.getElementById('submit-welcome-form').addEventListener('click', function () {
			sendCustomerName(event);
		});
		var contextualMenuTitleElements = document.getElementsByClassName('contextual-menu-title-js');
		for (var i = 0; i < contextualMenuTitleElements.length; i++) {
			contextualMenuTitleElements[i].addEventListener('click', function () {
				menuContextualToggle('contextual-menu-solution-list-content', 'contextual-menu-solution-list-container-title');
			})
		}

		$(".aside-nav").on('click', function (e) {
			if (document.getElementById('profil-panel').classList.contains('profil-aside-active') && !$(e.target).closest('.aside-nav li a').length) {
				hideAsideProfile();
			} else if (!$(e.target).closest('.aside-nav li a').length) {
				showAsideProfile();
				document.getElementById('profil-notification').style.display = "block";
				$(".aside-nav a[data-target='profil-notification']").addClass('aside-nav-tab-active');
			}
		});
		$(".aside-nav a").on('click', function () {
			if (!document.getElementById('profil-panel').classList.contains('profil-aside-active')) {
				showAsideProfile();
			} else if (document.getElementById('profil-panel').classList.contains('profil-aside-active') && document.getElementById(this.dataset.target).style.display === "block") {
				hideAsideProfile();
			}
			var asideSections = document.getElementsByClassName('aside-section');
			for (var i = 0; i < asideSections.length; i++) {
				asideSections[i].style.display = "none";
				$('.aside-nav-tab-active').removeClass('aside-nav-tab-active');
			}
			var target = document.getElementById(this.dataset.target);
			target.style.display = 'block';

			if (document.getElementById('profil-panel').classList.contains('profil-aside-active')) {
				this.classList.add('aside-nav-tab-active');
			}
		});
		$(document).on('click', function (e) {
			if (!$(e.target).parents().hasClass("menu-projets") && isTheLockClicked == false) {
				closeMyProjectMenu();
			}
			if (document.getElementById('profil').classList.contains('profil-active')) {
				if (!$(e.target).closest('#profil-panel').length && !$(e.target).closest('header li').length) {
					hideProfile();
				}
			}
			if (document.getElementById('dashboard').classList.contains('dashboard-active')) {
				if (!$(e.target).closest('#dashboard-panel').length && !$(e.target).closest('header li').length) {
					hideDashboard();
				}
			}
			/*if (!$(e.target).closest('#pricing-modal-wrapper').length && !$(e.target).closest('#home-dialog-button').length && !$(e.target).closest('#nav-users-link').length) {
				hidePricingModal();
			}*/
			if (!$(e.target).closest('#pricing-modal-wrapper').length && !$(e.target).closest('#home-dialog-button').length && !$(e.target).closest('#nav-config-users-link').length && !$(e.target).closest('#dashboard-panel').length && !$(e.target).closest('.delete-user-btn').length) {
				hidePricingModal();
			}
			if (document.getElementById('search-tabs-list').style.display == 'block' && !$(e.target).closest('#search-tabs').length) {
				$('#search-tabs-list').fadeOut();
			}
			if (document.getElementById('nav-profile-list').style.display == 'block' && !$(e.target).closest('#nav-profile').length) {
				$('#nav-profile-list').fadeOut();
			}
			toggleSelectedFilter(e);
		});

		$('#geocoder-container').on('click', function () {
			/*hideCatalog();*/
			if (document.getElementById('menu-slider').className = 'menu-ouvert') {
				hideContextualMenu();
			}
		});

		$('#button-upgrade').on('click', function () {
			hideDashboard();
			showPricingModal();
			/* hideDashboardIndicatorPanel();
			showDashboardUpgradeSubscriptionPanel(); */
		});

		$('#dashboard-indicator-link').on('click', function (event) {
			showDashboardIndicatorPanel();
			hideDashboardUpgradeSubscriptionPanel();
		});

		$('#close-dashboard').on('click', function (event) {
			document.getElementById('dashboard').classList.remove('dashboard-active');
		});
		
		$('#close-pricing-modal').on('click', function (event) {
			document.getElementById('pricing-modal').style.display = "none";
			$('#full-overlay').fadeOut();
		});

		$('#purchaser-close-button').on('click', function () {
			hidePurhaserForm()
		});

		$('#purchaser-previous-button').on('click', function () {
			hidePurhaserForm()
		});

		$('#add-purchaser-button-people').on('click', function () {
			var elemntsCount = document.getElementById("purchaser-ui-dialog-list-wrapper").childElementCount;
			individualForm = true;
			showPurchaserFormPeople()
			clearPurchaserForm();
			individual = createIndividual();
		});

		$('#add-purchaser-button-tenant').on('click', function () {
			var elemntsCount = document.getElementById("purchaser-ui-dialog-list-wrapper").childElementCount;
			individualForm =false;
			showPurchaserFormSociety()
			clearPurchaserForm();
			company = createCompany();
		});

		/* $('#btn-wrapper-overlay-validate').on('click', function (){
			document.getElementById('purchaser-ui').style.display = "none";
			updatePurchaserGrid();
		});

		$('#button-purchaser-delete').on('click', function () {
			deletePurchaser();
		});
		
		$('#btn-wrapper-overlay-edit').on('click', function (){
			document.getElementById('purchaser-form-container').style.display = "block";
			document.getElementById('purchaser-ui-dialog-main-container').style.display = "none";
			document.getElementById('button-purchaser-delete').style.display = "block";
		}); */


		/* Main nav links */
		document.getElementById('nav-profile').addEventListener('click', function () {
			$('#nav-profile-list').fadeToggle();
		});
		var navProfileLinks = Array.from(document.getElementById('nav-profile-list').getElementsByTagName('li'));
		navProfileLinks.forEach(profileLink => {
			profileLink.addEventListener('click', function () {
				var previousLink = document.getElementsByClassName('nav-topbar-active')[0];
				if (previousLink) {
					previousLink.classList.remove('search-tab-active');
				}
				profileLink.classList.add('search-tab-active');
			});
		});
		$('#nav-profil-link').on('click', function () {
			showProfile();
		});

		$('#nav-dashboard-link').on('click', function () {
			showDashboard();
			//getDashboardData();
			//initDashboard();
		});


		/*$('#nav-users-link').on('click', function () {
			showUsers();
		});*/

		$('#nav-config-users-link').on('click', function () {
			document.getElementById('pricing-modal').style.display = 'block';
			showUsers();
			renderConfigUsers();
		});


		/*$("#nav-catalog-link").on('click', function (event) {
			toggleCatalog();
			hideContextualMenu();
			event.stopPropagation();
		});*/

		$("#nav-pricing-model-link").on('click', function (event) {
			showPricingModal();
			event.stopPropagation();
		});

		$('#submit-profile').on('click', function (event) {
			updateCustomer(event);
		});
		$('#back-catalog').on('click', function (event) {
			hideContact();
		});
		$('#submit-contact').on('click', function (event) {
			if (document.getElementById('contact-cgu').checked) {
				send(event);
			} else {
				document.getElementById('label-contact-cgu').style.color = 'red';
			}
		});

		$('#nav-toggle').on('click', function () {
			this.classList.toggle("active");
			$('#js-nav').slideToggle();
		});

		$('#nav-toggle').on('click', function () {
			this.classList.toggle("active");
			$('#js-nav').slideToggle();
		});

		document.getElementById('menu-sidebar').addEventListener('click', function () {
			var sliderMenu = document.getElementById('menu-slider');
			if (sliderMenu.classList.contains('menu-ouvert')) {
				hideContextualMenu();
			} else {
				displayContextualMenu();
				/*hideCatalog();*/
			}
		})

		var isContextLockClicked = true;

		document.getElementById('contextual-menu-lock').addEventListener('click', function () {
			if (isContextLockClicked == false) {
				isContextLockClicked = true;
				$("#contextual-menu-lock").css("color", "#11a0b9");
			} else {
				isContextLockClicked = false;
				$("#contextual-menu-lock").css("color", "#999");
			}
		});

		document.getElementById("menu-slider").addEventListener('mouseleave', function () {
			if (isContextLockClicked == false)
				hideContextualMenu();
		});


		/*$('#map').on('click', function () {
			hideCatalog();
		});*/

		$('#tuto-overlay').click(function (evt) {
			if (!$(evt.target.parentElement).is('#coach-image-close') && !$(evt.target.parentElement).is('#coach-image-next')) {
				animateOnboard();
			}
		});

		document.getElementById('coach-image-next').addEventListener('click', function () {
			animateOnboard();
		});

		document.getElementById('coach-image-close').addEventListener('click', function () {
			closeOnboard();
		});


		// SEARCH & FILTERS 

		document.getElementById('search-filters').addEventListener('click', function (e) {
			toggleSelectedFilter(e);
		});

		document.getElementById('search-filter-owner-input').addEventListener('input', function () {
			searchOwner(this, 'search-filter-owner-list');
		});

		document.getElementById('search-clear-filters').addEventListener('click', function () {
			clearFilters();
			savedStudySource.clear();
			operations.forEach(operation => {
				savedStudySource.addFeatures((new ol.format.GeoJSON()).readFeatures(operation, {
					featureProjection: 'EPSG:3857'
				}));
			});
		})

		document.getElementById('search-user-input').addEventListener('keyup', function () {
			searchUser('search-user-input');
		});

		/*************************My project menu*******************************/

		//---Tooltip script---

		$('.tooltip').tooltipster({
			animation: 'grow',
			delay: 200,
			animationDuration: 350,
			side: 'left'
		});

		/*        $('.tooltip-lock').tooltipster({
			 animation: 'fade',
			 delay: 200,
			 animationDuration: 350,
			 theme: 'tooltip-lock',
			 side: 'top',
			 arrow: false,
		 });*/

		//--------------------

		//---Menu opens when the sidebar is hovered---

		$(".hover-zone").hover(function () {
			displayMyProjectContextualMenu();
		})

		//---Locks the menu in the open state---

		var isTheLockClicked = false;

		$(".lock").click(function () {
			if (isTheLockClicked == false) {
				isTheLockClicked = true;
				$(".lock").css("color", "#11a0b9");
			} else {
				isTheLockClicked = false;
				$(".lock").css("color", "#999");
			}
		})


		//---Menu closes when any area except menu's area is hovered and the lock is false---


		var closeMyProjectMenu = function () {
			$(".menu-bar").removeClass("open");
			document.getElementById('search').classList.remove('search-menu-open');
			document.getElementById('search-filters').classList.remove('search-menu-open');
		}

		document.getElementById("menu-projets").addEventListener('mouseleave', function () {
			if (isTheLockClicked == false)
				closeMyProjectMenu();
		})

		//--------------------

		//---Links submenus to the icones---

		var trigger = Array.from(document.getElementsByClassName('menu-bar-trigger'));
		trigger.forEach(trigger => {
			var dataTarget = trigger.getAttribute('data-target');
			trigger.addEventListener('click', function () {
				$('.menu-bar-content').hide();
				$('#' + dataTarget).fadeIn();

				document.getElementsByClassName('menu-projets-item-active')[0].classList.remove('menu-projets-item-active');
				trigger.classList.add('menu-projets-item-active');

				document.getElementById('menu-land-name-title').textContent = trigger.getAttribute('data-text');
			})
		});

		document.getElementById('more-services').addEventListener('click', function () {
			displayContextualMenu();
			if (isTheLockClicked == false) {
				closeMyProjectMenu();
			}
		});
		document.getElementById('popup').addEventListener('click', function (event) {
			if (event.target.id != 'swipe-right' && event.target.id != 'swipe-left' && event.target.id != 'chevron-swipe-left' && event.target.id != 'chevron-swipe-right' && event.target.id != 'popup-closer') {
				displayMyProjectContextualMenu();
			}
		});

		//-------------- Pricing modal --------------------//		
		document.getElementById('create-tenant').addEventListener('click', function () {
			checkTenantForm();
		});

		//-------------Purchaser UI --------------------//

		document.getElementById('button-purchaser-save').addEventListener('click', function () {
			var elemntsCount = document.getElementById("purchaser-ui-dialog-list-wrapper").childElementCount;
			if (individualForm == true) {
				setIndividualData(elemntsCount);
				if(document.getElementById('purchaser-name').value
				&& document.getElementById('purchaser-firstname').value
				&& document.getElementById('purchaser-people-email').value){
					savePurchaser('individual',elemntsCount);
					hidePurhaserForm();
				}
				else {
					document.getElementById('purchaser-form-warning-empty-fields').style.display = 'block';
					
					if(!document.getElementById('purchaser-name').value) {
						document.getElementById('warning-name').style.display = 'block';
					} 
					if(!document.getElementById('purchaser-firstname').value) {
						document.getElementById('warning-firstname').style.display = 'block';
					}
					if(!document.getElementById('purchaser-people-email').value) {
						document.getElementById('warning-people-email').style.display = 'block';
					}
				}
			}
			else if (individualForm == false)  {
				setSocietyData(elemntsCount);
				if(document.getElementById('purchaser-society-name').value
				&& document.getElementById('purchaser-society-siret').value
				&& document.getElementById('purchaser-society-contact-email').value){
					savePurchaser('company',elemntsCount);
					hidePurhaserForm();
				}
				else {
					document.getElementById('purchaser-form-warning-empty-fields').style.display = 'block';
				
					if(!document.getElementById('purchaser-society-name').value) {
						document.getElementById('warning-society-name').style.display = 'block';
					} 
					if(!document.getElementById('purchaser-society-siret').value) {
						document.getElementById('warning-society-siret').style.display = 'block';
					}
					if(!document.getElementById('purchaser-society-contact-email').value) {
						document.getElementById('warning-society-email').style.display = 'block';	
					}
				}
			}
		});

		/*document.getElementById('button-purchaser-select').addEventListener('click', function () {
			$('.full-overlay').fadeOut();
			$('#purchaser-ui').fadeOut();
		});*/
		document.getElementById('button-purchaser-delete').addEventListener('click', function () {
			deletePurchaser(selectedPurchaser);
			hidePurhaserForm();
		});
		document.getElementById('purchaser-ui-dialog-search-input').addEventListener("keyup", matchPurchaserByName);
	}

	function hidePurhaserForm() {
		document.getElementById('purchaser-form-container').style.display = "none";
		document.getElementById('purchaser-previous-button').style.display = "none";
		document.getElementById('purchaser-ui-dialog-main-container').style.display = "block";
		var onlySociety = document.getElementsByClassName("purchaser-only-society");
		var onlyPeople = document.getElementsByClassName("purchaser-only-people");
		for (var i = 0; i < onlySociety.length; i++) {
			onlySociety[i].style.display = "none";
		}
		for (var i = 0; i < onlyPeople.length; i++) {
			onlyPeople[i].style.display = "none";
		}
	}

	function showPurchaserFormPeople() {
		document.getElementById('purchaser-form-container').style.display = "block";
		document.getElementById('purchaser-previous-button').style.display = "block";
		document.getElementById('purchaser-ui-dialog-main-container').style.display = "none";
		document.getElementById('purchaser-form-title').innerHTML = "<i class='fa fa-user-o' aria-hidden='true'></i>Ajouter un acquéreur";
		document.getElementById('purchaser-type').innerHTML = "particulier";
		var onlySociety = document.getElementsByClassName("purchaser-only-society");
		var onlyPeople = document.getElementsByClassName("purchaser-only-people");
		for (var i = 0; i < onlySociety.length; i++) {
			onlySociety[i].style.display = "none";
		}
		for (var i = 0; i < onlyPeople.length; i++) {
			onlyPeople[i].style.display = "block";
		}
	}

	function showPurchaserFormSociety() {
		document.getElementById('purchaser-form-container').style.display = "block";
		document.getElementById('purchaser-previous-button').style.display = "block";
		document.getElementById('purchaser-ui-dialog-main-container').style.display = "none";
		document.getElementById('purchaser-form-title').innerHTML = "<i class='fa fa-building-o' aria-hidden='true'></i>Ajouter une société";
		document.getElementById('purchaser-type').innerHTML = "société";
		var onlySociety = document.getElementsByClassName("purchaser-only-society");
		var onlyPeople = document.getElementsByClassName("purchaser-only-people");
		for (var i = 0; i < onlySociety.length; i++) {
			onlySociety[i].style.display = "block";
		}
		for (var i = 0; i < onlyPeople.length; i++) {
			onlyPeople[i].style.display = "none";
		}
	}

	function deletePurchaserUi(index) {
		var container = document.getElementById("purchaser-ui-dialog-list-wrapper");
		var block = document.getElementById('purchaser-ui-dialog-list-' + index);
		container.removeChild(block);
	}

	function filterFeatures() {
		var spanFilter = document.getElementById('search-filter-status-span'),
			dataSelected = spanFilter.getAttribute('data-selected').toUpperCase(),
			projectName = document.getElementById('search-project-input').value.toUpperCase(),
			projectOwner = document.getElementById('search-filter-owner-input').value,
			filteredOperations = operations.filter(function (operation) {
				return (dataSelected == 'ALL' || operation.features[0].properties.status == dataSelected) && (projectName == '' || operation.features[0].properties.name.toUpperCase().indexOf(projectName) > -1) && (projectOwner == '' || projectOwner == 'Tous' || operation.owner == projectOwner);
			});
		hidePopup();
		savedStudySource.clear();
		filteredOperations.forEach(filteredOperation => {
			savedStudySource.addFeatures((new ol.format.GeoJSON()).readFeatures(filteredOperation, {
				featureProjection: 'EPSG:3857'
			}));
		});
	}

	function getCustomerData(callback) {
		var customerRequest = getConnectionAwareXmlHttpRequest('GET', '/customers', function (responseText) {
			customer = JSON.parse(responseText);
			if (customer) {
				renderCustomerData(customer);
				if (callback) callback();
			}
		});
		customerRequest.setRequestHeader("Accept", "application/json");
		customerRequest.send();
	}

	function initCustomerSettings() {
		var customerRequest = getConnectionAwareXmlHttpRequest('GET', '/customers', function (responseText) {
			customer = JSON.parse(responseText);
			if (customer) {
				setRandomCustomerColor(customer.mail);
				getProducts();
				initSolutionList();
				if (customer.members !== null) {
					createUserList(customer.members);
				}
			}
		});
		customerRequest.setRequestHeader("Accept", "application/json");
		customerRequest.send();
	}

	function customerCanModifySubscription() {
		let canModifySubscription = false,
			currentMember = [];
		if (customer.members !== null) {
			currentMember = customer.members.filter(member => member.mail == customer.mail);
		}
		if (currentMember.length > 0) {
			canModifySubscription = currentMember.canModifySubscription;
		} else if (customer.subscriptions !== null && customer.subscriptions.length > 0 && customer.subscriptions[0].subscriptionId !== null) {
			canModifySubscription = true;
		}
		return canModifySubscription;
	}

	function getProducts() {
		var productsRequest = getConnectionAwareXmlHttpRequest('GET', '/products', function (responseText) {
			let productsList = JSON.parse(responseText);
			if (productsList && productsList.length > 0) {
				products = productsList;
				initPricingModal();
				if (customerCanModifySubscription()) {
					
					initDashboard();
					showConfigUserNav();
				}
			}
		});
		productsRequest.setRequestHeader("Accept", "application/json");
		productsRequest.send();
	}

	function showPricingModal() {
		showPricingModalPricingPartOnly();
		hideTenantModal();
		hidePricingModalPaymentPartOnly();
		hideUsersPartOnly();
		$('#full-overlay').fadeIn();
		$('#pricing-modal').fadeIn();	
	}

	function hidePricingModal() {
		$('#full-overlay').fadeOut();
		$('#pricing-modal').fadeOut();
	}

	function showPricingModalPricingPartOnly() {
		$('#pricing').show();
	}

	function hidePricingModalPricingPartOnly() {
		$('#pricing').hide();
	}

	function showTenantForm() {
		$('#tenant-modal').show();
	}

	function hideTenantModal() {
		$('#tenant-modal').hide();
	}

	function showPricingModalPaymentPartOnly() {
		$('#payment-form').show();
	}

	function hidePricingModalPaymentPartOnly() {
		$('#payment-form').hide();
	}

	function showUsersPartOnly() {
		$('#full-overlay').show();
		$('#pop-up-users-panel').show();
	}

	function hideUsersPartOnly() {
		$('#pop-up-users-panel').hide();
	}

	function showUsers() {
		hidePricingModalPricingPartOnly();
		hideTenantModal();
		hidePricingModalPaymentPartOnly();
		showUsersPartOnly();
		$('#full-overlay').fadeIn();
		$('#pricing-modal').fadeIn();
	}

	function initPricingModal() {
		document.getElementById('nav-pricing-model-link').style.display = "block";
		if (!customerCanModifySubscription()) {
			initStripeElements();
		}
		renderPricingModal();
	}

	function renderPricingModal() {
		clearPricingModalElement();
		var userContainerNumber = document.getElementById('user-number-container');
		var userNumberInput = document.createElement("input");
		userNumberInput.setAttribute("id", "pricing-users-input");
		userNumberInput.setAttribute("type", "number");
		userNumberInput.setAttribute("min", "1");
		userNumberInput.value = productLicenseCount;
		userContainerNumber.appendChild(userNumberInput);
		if (customerCanModifySubscription()) {
			productLicenseCount = customer.licenseCount;
			userNumberInput.value = productLicenseCount;
			var validateButton = document.createElement("a");
			validateButton.setAttribute("id", "btn-license-quantity-update");
			validateButton.setAttribute("class", "btn-next update-licence-quantity-btn");
			validateButton.textContent = "Valider";
			userContainerNumber.appendChild(validateButton);
			validateButton.addEventListener('click', function () {
				updateLicense(productLicenseCount);
			});
		}
		var pricingModalProducts = document.getElementById("pricing-products");
		products.forEach(function (product, index) {
			pricingModalProducts.appendChild(renderPricingProduct(product, index));
		});

		document.getElementById('pricing-users-input').addEventListener('input', function () {
			productLicenseCount = Number(this.value);
			$('.pricing-product-users-count').text(" x " + productLicenseCount);
			products.forEach(function (product, index) {
				document.getElementById('pricing-product-total-price-' + index).textContent = product.activedMeteredPrice + product.licensedPrice * productLicenseCount;
			})
		});
	}

	function clearPricingModalElement(pricingProductEltArray) {
		var pricingModalProducts = document.getElementById("pricing-products");
		while (pricingModalProducts.hasChildNodes()) {
			pricingModalProducts.removeChild(pricingModalProducts.lastChild);
		}
		$("#pricing-users-input").remove();
		$("#btn-license-quantity-update").remove();
	}


	function renderPricingProduct(product, index) {
		var productWrapper = document.createElement("div");
		productWrapper.setAttribute("class", "pricing-product");
		if (product.highlighted) {
			productWrapper.setAttribute("class", "pricing-product pricing-product-highlighted");
		} else {
			productWrapper.setAttribute("class", "pricing-product");
		}

		var productTitleWrapper = document.createElement("h2");
		productTitleWrapper.textContent = I18N_PRODUCT + " ";
		var productTitle = document.createElement("span");
		productTitle.textContent = product.name;
		productTitleWrapper.appendChild(productTitle);
		productWrapper.appendChild(productTitleWrapper);

		var productPricesWrapper = document.createElement("div");
		productPricesWrapper.setAttribute("class", "pricing-product-prices-wrapper");
		var productActivedMeteredPlanText = document.createElement("p");
		productActivedMeteredPlanText.textContent = I18N_PER_ACTIVED_PROGRAM_PER_MONTH;
		var productActivedMeteredPlanValue = document.createElement("strong");
		productActivedMeteredPlanValue.setAttribute("id", "pricing-product-actived-metered-plan-price-" + index);
		productActivedMeteredPlanValue.textContent = product.activedMeteredPrice; // prix active metered plan !!!!!!!!!!!!!!!
		var productActivedMeteredPlanSpan = document.createElement("span");
		productActivedMeteredPlanSpan.textContent = " " + I18N_CURRENCY_EUR;

		productActivedMeteredPlanText.prepend(productActivedMeteredPlanSpan);
		productActivedMeteredPlanText.prepend(productActivedMeteredPlanValue);
		productPricesWrapper.appendChild(productActivedMeteredPlanText);

		if (typeof (product.archivedMeteredPrice) !== "undefined") {
			var productArchivedMeteredPlanText = document.createElement("p");
			productArchivedMeteredPlanText.setAttribute("class", "pricing-product-archived-metered-plan-price");
			productArchivedMeteredPlanText.textContent = I18N_PER_ARCHIVED_PROGRAM_PER_MONTH;
			var productArchivedMeteredPlanValue = document.createElement("strong");
			productArchivedMeteredPlanValue.setAttribute("id", "pricing-product-archived-metered-plan-price-" + index);
			productArchivedMeteredPlanValue.textContent = product.archivedMeteredPrice; // prix archived metered plan !!!!!!!!!!!!!!!
			var productArchivedMeteredPlanSpan = document.createElement("span");
			productArchivedMeteredPlanSpan.textContent = " " + I18N_CURRENCY_EUR;

			productArchivedMeteredPlanText.prepend(productArchivedMeteredPlanSpan);
			productArchivedMeteredPlanText.prepend(productArchivedMeteredPlanValue);
			productPricesWrapper.appendChild(productArchivedMeteredPlanText);
		}

		var productLicensedPlanText = document.createElement("p");
		productLicensedPlanText.textContent = I18N_PER_USER_PER_MONTH;
		var productLicensedPlanValue = document.createElement("strong");
		productLicensedPlanValue.setAttribute("id", "pricing-product-licensed-plan-price-" + index);
		productLicensedPlanValue.textContent = product.licensedPrice; // prix licensed !!!!!!!!!!!!!!!
		var productLicensedPlanSpan = document.createElement("span");
		productLicensedPlanSpan.textContent = " " + I18N_CURRENCY_EUR;
		var productUsersCount = document.createElement("span"); // EF
		productUsersCount.setAttribute("class", "pricing-product-users-count"); // EF
		if (customerCanModifySubscription()) {
			productUsersCount.textContent = " x " + productLicenseCount;
		} else {
			productUsersCount.textContent = " x " + product.perSeatCount;
		}

		productLicensedPlanText.prepend(productLicensedPlanSpan);
		productLicensedPlanText.prepend(productLicensedPlanValue);
		productLicensedPlanText.appendChild(productUsersCount);
		productPricesWrapper.appendChild(productLicensedPlanText);
		productWrapper.appendChild(productPricesWrapper);
		if (customerCanModifySubscription()) {
			if (product.productId == customer.subscriptions[0].productId) {
				productWrapper.setAttribute("class", "pricing-product pricing-product-subscribed");
			} else {
				productWrapper.setAttribute("class", "pricing-product");
				var productButtonWrapper = document.createElement("div");
				productButtonWrapper.setAttribute("class", "pricing-product-button-wrapper");
				var productButton = document.createElement("button");
				productButton.setAttribute("class", "pricing-product-button");
				productButton.textContent = I18N_SUBSCRIBE;
				productButton.addEventListener('click', function () {
					updateSubscriptionPlan(product.productId);
				});
				productButtonWrapper.appendChild(productButton);
				productWrapper.appendChild(productButtonWrapper);

			}
		} else {
			var productButtonWrapper = document.createElement("div");
			productButtonWrapper.setAttribute("class", "pricing-product-button-wrapper");
			if (product.freeTrial) {
				var productFreeTrialButton = document.createElement("button");
				productFreeTrialButton.setAttribute("class", "pricing-product-button pricing-product-free-trial-button");
				productFreeTrialButton.addEventListener("click", function () {
					// access to free trial
				});
				var productFreeTrialButtonIcon = document.createElement("i");
				productFreeTrialButtonIcon.setAttribute("class", "fa fa-gift");
				productFreeTrialButtonIcon.setAttribute("aria-hidden", "true");
				var productFreeTrialButtonText = document.createElement("span");
				productFreeTrialButtonText.textContent = product.freeTrialDuration + " " + I18N_FREE_TRIAL;

				productFreeTrialButton.appendChild(productFreeTrialButtonIcon);
				productFreeTrialButton.appendChild(productFreeTrialButtonText);
				productButtonWrapper.appendChild(productFreeTrialButton);
			}
			var productButton = document.createElement("button");
			productButton.setAttribute("class", "pricing-product-button");
			productButton.textContent = I18N_SUBSCRIBE;
			productButton.addEventListener('click', function () {
				productId = product.productId;
				hidePricingModalPricingPartOnly();
				showTenantForm();
			});
			productButtonWrapper.appendChild(productButton);
			productWrapper.appendChild(productButtonWrapper);
		}

		var productContent = document.createElement("div");
		productContent.setAttribute("class", "pricing-product-content-wrapper");
		product.features.forEach(feature => {
			productContent.appendChild(renderPricingProductFeature(feature));
		});

		productWrapper.appendChild(productContent);

		var productTotalWrapper = document.createElement("div");
		productTotalWrapper.setAttribute("class", "pricing-product-total-wrapper");
		var productTotalText = document.createElement("span");
		productTotalText.textContent = I18N_TOTAL;
		var productTotalContent = document.createElement("p");
		productTotalContent.textContent = I18N_PER_MONTH;
		var productTotalValue = document.createElement("strong");
		productTotalValue.setAttribute("id", "pricing-product-total-price-" + index);
		productTotalValue.textContent = product.activedMeteredPrice + product.licensedPrice; // prix metered plan + prix licensed !!!!!!!!!!!!!!! 
		var productTotalSpan = document.createElement("span");
		productTotalSpan.textContent = " " + I18N_CURRENCY_EUR;

		productTotalWrapper.appendChild(productTotalText);
		productTotalContent.prepend(productTotalSpan);
		productTotalContent.prepend(productTotalValue);
		productTotalWrapper.appendChild(productTotalContent);
		productWrapper.appendChild(productTotalWrapper);

		return productWrapper;
	}

	function renderPricingProductFeature(feature, pricingProductEltArray) {
		var featureWrapper = document.createElement("div");
		featureWrapper.setAttribute("class", "pricing-product-feature-wrapper");
		var featureTitle = document.createElement("h3");
		featureTitle.textContent = feature.title;
		featureWrapper.appendChild(featureTitle);

		var newFeature = true;
		var pricingProductEltArray = Array.from(document.getElementsByClassName("pricing-product"));
		if (pricingProductEltArray.length > 0) {
			var lastProduct = pricingProductEltArray[pricingProductEltArray.length - 1];
			var previousFeatures = Array.from(lastProduct.getElementsByTagName("h3"));
			previousFeatures.forEach(previousFeature => {
				if (previousFeature.textContent == feature.title) {
					newFeature = false;
				}
			});
			featureWrapper.appendChild(featureTitle);
		}

		if (newFeature) {
			var featureItemsWrapper = document.createElement("ul");
			if (feature.desc.length != 0) {
				feature.desc.forEach(desc => {
					featureItemsWrapper.appendChild(renderPricingProductFeatureItem(desc));
				});
			}
			featureWrapper.appendChild(featureItemsWrapper);
		}

		return featureWrapper;
	}

	function renderPricingProductFeatureItem(desc) {
		var featureItemLi = document.createElement("li");
		featureItemLi.textContent = desc;
		var featureItemIcon = document.createElement("i");
		featureItemIcon.setAttribute("class", "fa fa-check-circle");
		featureItemIcon.setAttribute("aria-hidden", "true");

		featureItemLi.prepend(featureItemIcon);

		return featureItemLi;
	}

	function showDashboardNav() {
		document.getElementById('nav-dashboard-link').style.display = "block";
	}

	function updateNotif() {
		if (!notifications) {
			document.getElementById('nav-profile-notif').style.display = 'none';
			document.getElementById('nav-profile-notif-value').textContent = '';
		} else {
			document.getElementById('nav-profile-notif').style.display = 'block';
			document.getElementById('nav-profile-notif-value').textContent = notifications;
		}
	}

	function initStripeElements() {
		var stripe = Stripe('pk_test_ufRM7B8cnmYgoHSuFOZRYJsT');
		var elements = stripe.elements();

		// Floating labels
		var inputs = document.querySelectorAll('.cell.stripe-content.stripe-element .input');
		Array.prototype.forEach.call(inputs, function (input) {
			input.addEventListener('focus', function () {
				input.classList.add('focused');
			});
			input.addEventListener('blur', function () {
				input.classList.remove('focused');
			});
			input.addEventListener('keyup', function () {
				if (input.value.length === 0) {
					input.classList.add('empty');
				} else {
					input.classList.remove('empty');
				}
			});
		});

		var elementStyles = {
			base: {
				color: '#32325D',
				fontWeight: 500,
				fontSize: '16px',
				fontSmoothing: 'antialiased',

				'::placeholder': {
					color: '#CFD7DF',
				},
				':-webkit-autofill': {
					color: '#e39f48',
				},
			},
			invalid: {
				color: '#E25950',

				'::placeholder': {
					color: '#FFCCA5',
				},
			},
		};

		var elementClasses = {
			focus: 'focused',
			empty: 'empty',
			invalid: 'invalid',
		};

		var cardNumber = elements.create('cardNumber', {
			style: elementStyles,
			classes: elementClasses,
		});
		cardNumber.mount('#stripe-card-number');

		var cardExpiry = elements.create('cardExpiry', {
			style: elementStyles,
			classes: elementClasses,
		});
		cardExpiry.mount('#stripe-card-expiry');

		var cardCvc = elements.create('cardCvc', {
			style: elementStyles,
			classes: elementClasses,
		});
		cardCvc.mount('#stripe-card-cvc');

		cardNumber.addEventListener('change', function (event) {
			var displayError = document.getElementById('card-errors');
			if (event.error) {
				displayError.textContent = event.error.message;
			} else {
				displayError.textContent = '';
			}
		});

		// Create a token or display an error when the form is submitted.
		var form = document.getElementById('payment-form');
		form.addEventListener('submit', function (event) {
			event.preventDefault();
			event.stopPropagation();

			stripe.createToken(cardNumber).then(function (result) {
				if (result.error) {
					// Inform the customer that there was an error
					var errorElement = document.getElementById('card-errors');
					errorElement.textContent = result.error.message;
				} else {
					// Send the token to your server
					stripeTokenHandler(result.token);
				}
			});
		});

	}

	function stripeTokenHandler(token) {
		// Insert the token ID into the form so it gets submitted to the server
		var form = document.getElementById('payment-form');
		var hiddenInput = document.createElement('input');
		hiddenInput.setAttribute('type', 'hidden');
		hiddenInput.setAttribute('name', 'stripeToken');
		hiddenInput.setAttribute('value', token.id);
		var hiddenInputProductId = document.createElement('input');
		hiddenInputProductId.setAttribute('type', 'hidden');
		hiddenInputProductId.setAttribute('name', 'productId');
		hiddenInputProductId.setAttribute('value', productId);
		form.appendChild(hiddenInput);
		form.appendChild(hiddenInputProductId);

		var stripeRequest = getConnectionAwareXmlHttpRequest('POST', '/subscriptions?stripeToken=' + encodeURIComponent(token.id), function (responseText) {		
			getCustomerData(renderPricingModal);
			getInvoiceData(initDashboard);
			showConfigUserNav();
			hidePricingModal();
			hidePricingModalPaymentPartOnly();
			showDialogMessage("stripe", "success", I18N_SUCCESS_MESSAGE_PAYMENT_CONFIG, I18N_SUCCESS_MESSAGE_PAYMENT_CONFIG_ACTION, function () {
				renderConfigUsers();
				showUsersPartOnly();
			});
		});
		stripeRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		stripeRequest.setRequestHeader("Accept", "application/json");
		var body = {
			subscriptionId: null,
			newProduct: productId,
			quantity: productLicenseCount
		};
		stripeRequest.send(JSON.stringify(body));
	}

	function initDashboard() {
		renderDashboard();
		showDashboardNav();
	}

	function getInvoiceData(callback) {
		var dashboardDataRequest = getConnectionAwareXmlHttpRequest('GET', '/invoices', function (responseText) {
			invoiceData = JSON.parse(responseText);
			if (invoiceData) {
				if (callback) callback();
			}	
		});
		dashboardDataRequest.setRequestHeader("Accept", "application/json");
		dashboardDataRequest.send();
	}

	function fillDashBoard() {
		if (invoiceData.subscriptionName) document.getElementById('program-name').textContent = "Formule " + invoiceData.subscriptionName;
		if (invoiceData.activeMeteredPrice != 0) document.getElementById('active-program-price').textContent = invoiceData.activeMeteredPrice + " " + I18N_CURRENCY_EUR + " " + I18N_PER_MONTH;
		if (invoiceData.activeMeteredSubtotal != 0) document.getElementById('active-program-subtotal').textContent = invoiceData.activeMeteredSubtotal + " " + I18N_CURRENCY_EUR + " " + I18N_PER_MONTH;
		if (invoiceData.archivedMeteredPrice != 0) document.getElementById('archived-program-price').textContent = invoiceData.archivedMeteredPrice + " " + I18N_CURRENCY_EUR + " " + I18N_PER_MONTH;
		if (invoiceData.archivedMeteredSubtotal != 0) document.getElementById('archived-program-subtotal').textContent = invoiceData.archivedMeteredSubtotal + " " + I18N_CURRENCY_EUR + " " + I18N_PER_MONTH;
		if (invoiceData.licensedPrice != 0) document.getElementById('licensed-price').textContent = invoiceData.licensedPrice + " " + I18N_CURRENCY_EUR + " " + I18N_PER_USER_PER_MONTH;
		if (invoiceData.licensedQuantity) document.getElementById('licensed-quantity').textContent = invoiceData.licensedQuantity;
		document.getElementById('licensed-subtotal').textContent = invoiceData.licensedSubtotal + " " + I18N_CURRENCY_EUR + " " + I18N_PER_MONTH;
		if (invoiceData.totalCostTaxFree) document.getElementById('total-price').textContent = invoiceData.totalCost + " " + I18N_CURRENCY_EUR + " " + I18N_PER_MONTH;
	}

	function renderDashboard() {
		fillDashBoard();
		if (invoiceData.licensedQuantity) document.getElementById('update-licence-quantity-input').value = invoiceData.licensedQuantity;
	}

	function updateSubscriptionPlan(stripeNewProduct) {
		var subscriptionRequest = getConnectionAwareXmlHttpRequest('PUT', '/subscriptions', function (responseText) {
			getCustomerData(renderPricingModal);
			showDialogMessage("users-config", "success", I18N_SUCCESS_MESSAGE_SUBSCRIPTION_PLAN_UPDATE, "OK");
		});
		subscriptionRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		subscriptionRequest.setRequestHeader("Accept", "application/json");
		var body = {
			subscriptionId: customer.subscriptionId,
			newProduct: stripeNewProduct,
			quantity: -1
		};
		subscriptionRequest.send(JSON.stringify(body));
	}

	function updateLicense(quantity) {
		var subscriptionRequest = getConnectionAwareXmlHttpRequest('PUT', '/subscriptions', function (responseText) {
			getCustomerData(renderPricingModal);
			showDialogMessage("users-config", "success", I18N_SUCCESS_MESSAGE_SUBSCRIPTION_USERS_UPDATE, "OK");
		});
		subscriptionRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		subscriptionRequest.setRequestHeader("Accept", "application/json");
		var body = {
			subscriptionId: customer.subscriptionId,
			newProduct: null,
			quantity: quantity
		};
		subscriptionRequest.send(JSON.stringify(body));
	}

	function setRandomCustomerColor(customerMail) {
		var palette = ['#EAC435', '#7A2EA0', '#E40066', '#03CEA4', '#FB4D3D', '#96C94A', '#19D3C1', '#3151E0'];
		document.getElementById('nav-profile-icon').prepend(customerMail.charAt(0));
		document.getElementById('nav-profile-icon').style.background = palette[Math.floor(Math.random() * palette.length)];
	}

	function renderCustomerData(customerData) {
		if (customerData.firstName || customerData.lastName) document.getElementById('profil-username').textContent = customerData.firstName + " " + customerData.lastName;
		if (customerData.firstName) document.getElementById('profil-first-name').value = document.getElementById('contact-first-name').value = customerData.firstName;
		if (customerData.lastName) document.getElementById('profil-last-name').value = document.getElementById('contact-last-name').value = customerData.lastName;
		if (customerData.company) document.getElementById('profil-company').value = document.getElementById('contact-company').value = customerData.company;
		if (customerData.job) document.getElementById('profil-function').value = document.getElementById('contact-function').value = customerData.job;
		if (customerData.mail) document.getElementById('profil-email').value = document.getElementById('contact-email').value = customerData.mail;
		if (customerData.phone) document.getElementById('profil-phone').value = document.getElementById('contact-phone').value = customerData.phone;
		if (customerData.lang) {
			var language = customerData.lang;
			switch (language) {
				case "fr":
					document.getElementsByName('language')[0].checked = true;
					break;
				case "en":
					document.getElementsByName('language')[1].checked = true;
					break;
				default:
					document.getElementsByName('language')[1].checked = true;
					break;
			}
		}

		if (document.getElementById('profil').classList.contains('profil-active')) {
			// Progress bar
			var dataCount = 0;
			var dataProfil = ["firstName", "lastName", "company", "job", "mail", "phone", "lang"];
			for (var i in dataProfil) {
				for (var j in customerData) {
					if (dataProfil[i] === j && customerData[j] != "" && customerData[j] != null) {
						dataCount++;
					}
				}
			}
			var dataFull = dataProfil.length;
			var profilRate = Math.floor((dataCount / dataFull) * 100);
			var textRate = "";
			switch (true) {
				case (profilRate < 50):
					textRate = "Je n'ai rempli que " + profilRate + "% de mon profil";
					document.getElementById('profil-progress').classList.remove('progress-bar-container-full');
					document.getElementById('profil-progress').classList.add('progress-bar-container-notfull');
					break;
				case (profilRate >= 50):
					textRate = "J'ai rempli " + profilRate + "% de mon profil";
					document.getElementById('profil-progress').classList.remove('progress-bar-container-notfull');
					document.getElementById('profil-progress').classList.add('progress-bar-container-full');
					break;
			}
			document.getElementById('profil-rate').textContent = textRate;

			var msecsPerUpdate = 1000 / 60;
			var progress = document.getElementById('profil-progress-bar');
			var duration = 0.7;
			var interval = progress.getAttribute('max') / (duration * 1000 / msecsPerUpdate);

			progress.value = 0;

			var animateProfilRate = function () {
				progress.value = progress.value + interval;
				if (progress.value + interval < profilRate) {
					setTimeout(animateProfilRate, msecsPerUpdate);
				} else {
					progress.value = profilRate;
				}
			}
			animateProfilRate();
		}
	}

	function updateCustomer(event) {
		event.preventDefault();
		event.stopPropagation();
		var customerRequest = getConnectionAwareXmlHttpRequest('POST', '/customers', function (responseText) {
			hideProfile(this);
			/*hideSharePanel(this);*/
			showDialogMessage("profil", "success", I18N_SUCCESS_MESSAGE_PROFIL);
		});
		customerRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		customerRequest.setRequestHeader("Accept", "application/json");
		customerRequest.send(JSON.stringify(fillCustomer()));
	}

	function fillCustomer() {
		customer.firstName = document.getElementById("profil-first-name").value;
		customer.lastName = document.getElementById("profil-last-name").value;
		customer.company = document.getElementById("profil-company").value;
		customer.job = document.getElementById("profil-function").value;
		customer.mail = document.getElementById("profil-email").value;
		customer.phone = document.getElementById("profil-phone").value;
		if (document.querySelector('input[name="language"]:checked')) {
			customer.lang = document.querySelector('input[name="language"]:checked').value;
		}
		return customer;
	}

	function showWelcomeForm() {
		$('#full-overlay').fadeIn();
		$('#welcome-form').fadeIn();
	}

	function hideWelcomeForm() {
		$('#full-overlay').fadeOut();
		$('#welcome-form').fadeOut();
	}

	function sendCustomerName(event) {
		event.preventDefault();
		event.stopPropagation();
		var customerRequest = getConnectionAwareXmlHttpRequest('POST', '/customers', function (responseText) {
			hideWelcomeForm();
			showDialogMessage("profil", "success", I18N_WELCOME + ' ' + customer.firstName + ' ' + customer.lastName + ', ' + I18N_SUCCESS_MESSAGE_WELCOME_FORM, I18N_LETS_GO, function () {
				displayTutoOverlay();
			});
		});
		customerRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		customerRequest.setRequestHeader("Accept", "application/json");
		customerRequest.send(JSON.stringify(fillCustomerName()));
	}

	function fillCustomerName() {
		customer.firstName = document.getElementById("welcome-first-name").value;
		customer.lastName = document.getElementById("welcome-last-name").value;
		return customer;
	}

	function initSolutionList() {
		var solutionsRequest = getConnectionAwareXmlHttpRequest('GET', '/solutions', function (responseText) {
			let products = JSON.parse(responseText);
			if (products) {
				products.forEach(product => {
					servicesMap.set(product.uri, product);
				});
				renderSolutionList(products);
				initMenuCircle(products);
			}
		});
		solutionsRequest.setRequestHeader("Accept", "application/json");
		solutionsRequest.send();
	}

	function updateMenuSolutionTitle(product) {
		var menuSolutionTitleContainer = document.getElementById('service-menu-content-service-title');
		menuSolutionTitleContainer.style.backgroundColor = product.color;
		/*  var caretIconContent = document.getElementById('contextual-menu-caret-icon');*/
		var solutionIconContent = document.getElementById('contextual-menu-solution-icon');
		//var solutionIconImg = document.createElement('img');
		solutionIconContent.setAttribute('src', '/img/' + product.icon + '_white.png');
		var solutionNameTitleContent = document.getElementById('contextual-menu-solution-name-title');
		solutionNameTitleContent.textContent = product.name;
		//solutionIconContent.appendChild(solutionIconImg);
		var containerSolutionListTitle = document.getElementById('contextual-menu-solution-list-container-title');
		containerSolutionListTitle.setAttribute('aria-expanded', 'false');

	};

	function renderSolutionList(products) {
		var solutionListContainer = document.getElementById('box-slider');
		var contextualMenuSolutionList = document.getElementById('contextual-menu-solution-list');
		var subscription = 0;
		products.forEach(product => {
			if (findSubscription(product.uri)) {
				subscription++;
			}
			/*solutionListContainer.appendChild(renderSolutionBox(product));*/
			if (findSubscription(product.uri)) {
				contextualMenuSolutionList.appendChild(renderContextualMenuElmt(product));
			} else if (product.uri == "") {
				contextualMenuSolutionList.appendChild(renderContextualMenuUnavailableElmt(product));
			} else {
				contextualMenuSolutionList.appendChild(renderContextualMenuUnboughtElmt(product));
			}
		});

		$('.tooltip-service').tooltipster({
			animation: 'fade',
			delay: 200,
			animationDuration: 350,
			theme: 'tooltip-lock',
			side: 'top',
			arrow: false,
		});
	}

	function removeMainServiceUI() {
		/*var currentFeature = selectedStudyFeature.getGeometry().getCoordinates();*/
		document.getElementById('service_div').innerHTML = '';
		document.getElementById("service_div").style.minHeight = "0";
		$('#map-section').animate({
			height: "100vh"
		}, 1000, function () {
			ol3Map.updateSize();

			/*flyTo(currentFeature);*/
		});
		// scrollToMapSectionTop();
	}

	// function scrollToMapSectionTop() {
	// 	$('html, body').animate({
	// 		scrollTop: $('#map-section').offset().top - 90
	// 	}, 1000);
	// }

	/*function hideLandProjectMenu() {
		var menuLandProjectContent = document.getElementById('menu-land-project-content');
		var menuLandProjectTitle = document.getElementById('menu-land-project-container-title');
		menuLandProjectContent.style.display = 'none';
		menuLandProjectTitle.setAttribute('aria-expanded', 'false');
	}*/

	function renderMenuProjets() {
		$('#menu-land-submit').on('click', function (event) {
			if (document.getElementById('menu-land-name').value != "") {
				event.preventDefault();
				event.stopPropagation();
				document.getElementById('menu-land-warning-title').style.display = 'none';
				document.getElementById('menu-land-warning-submit').style.display = 'none';
				saveStudy();
			} else {
				document.getElementById('menu-land-warning-title').style.display = 'block';
				document.getElementById('menu-land-warning-submit').style.display = 'block';
			}
		});
		$('#menu-land-delete').on('click', function (event) {
			document.getElementById('menu-land-status').value = 'ARCHIVED';
			saveStudy();
		});
	}

	function renderOverlayProjets() {
		$('#overlay-land-submit').on('click', function (event) {
			if (document.getElementById('overlay-land-name').value != "") {
				event.preventDefault();
				event.stopPropagation();
				document.getElementById('overlay-land-warning-title').style.display = 'none';
				document.getElementById('overlay-land-warning-submit').style.display = 'none';
				saveStudy();
			} else {
				document.getElementById('overlay-land-warning-title').style.display = 'block';
				document.getElementById('overlay-land-warning-submit').style.display = 'block';
			}
		});
	}

	function menuContextualToggle(id, id2) {
		var n = document.getElementById(id);
		if (n.style.display != 'none') {
			n.style.display = 'none';
			document.getElementById(id2).setAttribute('aria-expanded', 'false');
		} else {
			n.style.display = 'block';
			document.getElementById(id2).setAttribute('aria-expanded', 'true');
		}
	}

	function renderContextualMenuElmt(product) {
		var menuElmt = document.createElement('div');
		menuElmt.setAttribute('class', 'menu-elmt tooltip-service');
		menuElmt.setAttribute('id', product.uri + '-id');
		menuElmt.setAttribute('title', product.name);
		menuElmt.style.backgroundColor = product.color;
		menuElmt.style.borderStyle = 'solid';
		menuElmt.style.borderColor = product.color;
		menuElmt.style.borderWidth = '0.2em';
		var menuElmtContainer = document.createElement('div');
		menuElmtContainer.setAttribute('class', 'menu-elmt-container');
		var content = document.getElementById('service-menu-content');
		/*var contentBack = document.getElementById('service-menu-content-back');*/
		var sliderMenu = document.getElementById('menu-slider');
		var serviceDiv = document.getElementById('service_div');
		serviceDiv.addEventListener('click', function () {
			if (sliderMenu.className = 'menu-ouvert') {
				hideContextualMenu();
			}
		});
		menuElmt.addEventListener('click', function () {
			loadService(product.uri);
		});
		var imageWhiteElt = document.createElement('img');
		imageWhiteElt.setAttribute('src', '/img/' + product.icon + '_white.png');
		/*imageWhiteElt.style.width = '70%';*/
		var imageElt = document.createElement('img');
		imageElt.setAttribute('src', '/img/' + product.icon + '.png');
		/*imageElt.style.width = '70%';*/
		imageElt.style.display = 'none';
		var abrvElmt = document.createElement('p');
		abrvElmt.setAttribute('class', 'menu-elmt-abrv');
		abrvElmt.textContent = product.abrv;
		menuElmt.addEventListener("mouseover", function () {
			menuElmt.style.backgroundColor = 'transparent';

			abrvElmt.style.color = product.color;
			if (imageElt.style.display == "none") {
				imageElt.style.display = "block";
				imageWhiteElt.style.display = "none";
			}
		});
		menuElmt.addEventListener("mouseout", function () {
			menuElmt.style.backgroundColor = product.color;
			abrvElmt.style.color = '#fff';
			if (imageElt.style.display !== "none") {
				imageElt.style.display = "none";
				imageWhiteElt.style.display = "block";
			}
		});
		menuElmt.appendChild(menuElmtContainer);
		menuElmtContainer.appendChild(imageWhiteElt);
		menuElmtContainer.appendChild(imageElt);
		menuElmtContainer.appendChild(abrvElmt);
		return menuElmt;
	}

	function renderContextualMenuUnboughtElmt(product) {
		var menuElmt = document.createElement('div');
		menuElmt.setAttribute('class', 'menu-elmt');
		menuElmt.style.backgroundColor = product.color;
		var menuElmtOverlayUnavailable = document.createElement('div');
		menuElmtOverlayUnavailable.setAttribute('class', 'menu-elmt-overlay-unbought');
		var menuElmtContainer = document.createElement('div');
		menuElmtContainer.setAttribute('class', 'menu-elmt-container');
		var content = document.getElementById('service-menu-content');
		var sliderMenu = document.getElementById('menu-slider');
		var serviceDiv = document.getElementById('service_div');
		serviceDiv.addEventListener('click', function () {
			if (sliderMenu.className = 'menu-ouvert') {
				hideContextualMenu();
			}
		});
		menuElmt.addEventListener('click', function () {
			initSelectedSolution();
			/*showCatalog();*/
			hideContextualMenu();
			document.getElementById(product.name + '-solution-elmt-id').classList.add('click-event');
		});
		var imageWhiteElt = document.createElement('img');
		imageWhiteElt.setAttribute('src', '/img/' + product.icon + '_white.png');
		var imageElt = document.createElement('img');
		imageElt.setAttribute('src', '/img/' + product.icon + '.png');
		imageElt.style.display = 'none';
		var abrvElmt = document.createElement('p');
		abrvElmt.setAttribute('class', 'menu-elmt-abrv');
		abrvElmt.textContent = product.abrv;
		menuElmt.appendChild(menuElmtOverlayUnavailable);
		menuElmt.appendChild(menuElmtContainer);
		menuElmtContainer.appendChild(imageWhiteElt);
		menuElmtContainer.appendChild(imageElt);
		menuElmtContainer.appendChild(abrvElmt);
		return menuElmt;
	}

	function renderContextualMenuUnavailableElmt(product) {
		var menuElmt = document.createElement('div');
		menuElmt.setAttribute('class', 'menu-elmt');
		menuElmt.style.backgroundColor = product.color;
		var menuElmtOverlayUnavailable = document.createElement('div');
		menuElmtOverlayUnavailable.setAttribute('class', 'menu-elmt-overlay-unavailable');
		var menuElmtContainer = document.createElement('div');
		menuElmtContainer.setAttribute('class', 'menu-elmt-container');
		var content = document.getElementById('service-menu-content');
		var sliderMenu = document.getElementById('menu-slider');
		var serviceDiv = document.getElementById('service_div');
		serviceDiv.addEventListener('click', function () {
			if (sliderMenu.className = 'menu-ouvert') {
				hideContextualMenu();
			}
		});
		menuElmt.addEventListener('click', function () {
			initSelectedSolution();
			/*showCatalog();*/
			hideContextualMenu();
			document.getElementById(product.name + '-solution-elmt-id').classList.add('click-event');
		});
		var imageWhiteElt = document.createElement('img');
		imageWhiteElt.setAttribute('src', '/img/' + product.icon + '_white.png');
		var imageElt = document.createElement('img');
		imageElt.setAttribute('src', '/img/' + product.icon + '.png');
		imageElt.style.display = 'none';
		var abrvElmt = document.createElement('p');
		abrvElmt.setAttribute('class', 'menu-elmt-abrv');
		abrvElmt.textContent = product.abrv;
		menuElmt.appendChild(menuElmtOverlayUnavailable);
		menuElmt.appendChild(menuElmtContainer);
		menuElmtContainer.appendChild(imageWhiteElt);
		menuElmtContainer.appendChild(imageElt);
		menuElmtContainer.appendChild(abrvElmt);
		return menuElmt;
	}

	function displayContextualMenu() {
		var sliderMenu = document.getElementById('menu-slider');
		var sidebar = document.getElementById('menu-sidebar');
		sidebar.style.display = 'block';
		sliderMenu.style.transform = 'translateX(-21em)';
		sliderMenu.classList.add('menu-ouvert');
	}

	function displayContextualMenuSideBar() {
		var sidebar = document.getElementById('menu-sidebar');
		sidebar.style.display = 'block';
	}

	function hideContextualMenu() {
		var sliderMenu = document.getElementById('menu-slider');
		var sidebar = document.getElementById('menu-sidebar');
		sliderMenu.style.transform = 'translateX(0)';
		sliderMenu.style.right = '-21em';
		sliderMenu.classList.remove('menu-ouvert');
	}

	function displayMyProjectContextualMenu() {
		var menuMyProject = document.getElementById('menu-bar');
		menuMyProject.classList.add('open');
		document.getElementById('search').classList.add('search-menu-open');
		document.getElementById('search-filters').classList.add('search-menu-open');
	}

	/*function renderSolutionBox(product) {
		var boxScene = document.createElement('div');
		boxScene.setAttribute('id', product.name + '-solution-elmt-id');
		if (viewport() < 900) {
			boxScene.setAttribute('class', 'box-scene swiper-slide');
			activateClickHandler(boxScene);
		} else {
			boxScene.setAttribute('class', 'box-scene box-scene-hover swiper-slide');
			deactivateClickHandler(boxScene);
		}
		var box = document.createElement('div');
		box.setAttribute('class', 'box');
		boxScene.appendChild(box);
		var subscription = findSubscription(product.uri);
		if (subscription) {
			renderSoldFrontFaceBox(product, box);
			box.appendChild(renderSoldSideFaceBox(subscription, product));
		} else if (product.uri == "") {
			renderUnavailableFrontFaceBox(product, box);
			box.appendChild(renderUnavailableSideFaceBox(product));
		} else {
			renderFrontFaceBox(product, box);
			box.appendChild(renderSideFaceBox(product));
		}
		return boxScene;
	}*/

	function findSubscription(uri) {
		var result = null;
		var services = customer.services;
		if (services) {
			services.forEach(service => {
				if (service.id == uri) {
					result = service.id;
				}
			});
		}
		return result;
	}

	function getCookie(name) {
		var cookieValue = null;
		if (document.cookie && document.cookie != '') {
			var cookies = document.cookie.split(';');
			for (var i = 0; i < cookies.length; i++) {
				var cookie = jQuery.trim(cookies[i]);
				if (cookie.substring(0, name.length + 1) == (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		return cookieValue;
	}

	function send(event) {
		event.preventDefault();
		event.stopPropagation();
		var sendRequest = getConnectionAwareXmlHttpRequest('POST', '/send', function (responseText) {
			hideContact();
			showDialogMessage("contact", "success", I18N_SUCCESS_MESSAGE_CONTACT);
		});
		sendRequest.setRequestHeader("Content-Type", "application/json");
		sendRequest.setRequestHeader("Accept", "application/json");
		sendRequest.send(JSON.stringify(fillContact()));
	}

	function loadMenuFragment(fragmentContainer, menuElmt, serviceId, callback) {
		/*hideLandProjectMenu();*/
		removeMainServiceUI();
		showLoadingAnimation("contextual-menu");
		if (fragmentContainer.firstChild && fragmentContainer.firstChild.id == serviceId + '-menu') {
			fragmentContainer.style.display = "block";
			loadUIFragmentI18n(serviceId, 'menu', callback);
			return;
		}
		fragmentContainer.innerHTML = '';
		var solutionList = document.getElementById('contextual-menu-solution-list');
		var uiFragmentRequest = getConnectionAwareXmlHttpRequest('GET', '/ui-proxy?service-id=' + serviceId + '&resource=/menu/', function (responseText) {
			if (responseText == "") {
				loadMainFragment(document.getElementById('service_div'), serviceId);
			} else {
				getUIFragmentStyle(serviceId, 'menu');
				solutionList.parentElement.style.display = "none";
				fragmentContainer.style.display = "block";
				displayMenuServiceTitle();
				fragmentContainer.innerHTML = responseText;
				loadUIFragmentI18n(serviceId, 'menu', callback);
			}
		});
		uiFragmentRequest.send();
	}

	function displayMenuServiceTitle() {
		var menuSolutionTitleContainer = document.getElementById('service-menu-content-service-title');
		menuSolutionTitleContainer.style.display = 'block';
	}

	function loadUIFragmentI18n(serviceId, type, callback) {
		if (getUIFragmentI18n(serviceId, type)) {
			document.getElementById(serviceId + type + '-i18n').addEventListener('load', function () {
				loadUIFragmentScript(serviceId, type, callback);
			});
		} else {
			loadUIFragmentScript(serviceId, type, callback);
		}
	}

	function loadUIFragmentScript(serviceId, type, callback) {
		if (getUIFragmentScript(serviceId, type)) {
			document.getElementById(serviceId + type + '-script').addEventListener('load', function () {
				renderUIFragment(serviceId, type, callback);
			});
		} else {
			renderUIFragment(serviceId, type, callback);
		}
	}

	function renderUIFragment(serviceId, type, callback) {
		window[serviceId][type]['initUI']();
		stopLoadingAnimation("contextual-menu");
		if (callback) callback();
	}

	function scrollToServiceMainUI() {
		/*var currentFeature = selectedStudyFeature.getGeometry().getCoordinates();*/
		$('html, body').animate({
			scrollTop: $('#service_div').offset().top - 90
		}, 1000);
		document.getElementById("service_div").style.minHeight = "100vh";
	}

	function getUIFragmentStyle(serviceId, type) {
		if (document.getElementById(serviceId + type + '-style')) return false;
		var style = document.createElement('link');
		style.setAttribute('rel', 'stylesheet');
		style.setAttribute('id', serviceId + type + '-style');
		style.setAttribute('href', '/ui-proxy?service-id=' + serviceId + '&resource=/css/' + type + '_style.css');
		document.head.appendChild(style);
		return true;
	}

	function getUIFragmentI18n(serviceId, type) {
		if (document.getElementById(serviceId + type + '-i18n')) return false;
		var language = getQueryVariable('lang');
		var langPath = language != null ? language : 'fr';
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('language', 'javascript');
		script.setAttribute('id', serviceId + type + '-i18n');
		script.setAttribute('src', '/ui-proxy?service-id=' + serviceId + '&resource=/template/' + langPath + '/' + type + '_i18n.js');
		document.body.appendChild(script);
		return true;
	}

	function getUIFragmentScript(serviceId, type) {
		if (document.getElementById(serviceId + type + '-script')) return false;
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('language', 'javascript');
		script.setAttribute('id', serviceId + type + '-script');
		script.setAttribute('src', '/ui-proxy?service-id=' + serviceId + '&resource=/js/' + type + '_script.js');
		document.body.appendChild(script);
		return true;
	}

	function getQueryVariable(variable) {
		var query = window.location.search.substring(1);
		var vars = query.split('&');
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			if (decodeURIComponent(pair[0]) == variable) {
				return decodeURIComponent(pair[1]);
			}
		}
		return null;
	}

	function loadService(uri) {
		var product = servicesMap.get(uri);
		if (findSubscription(uri)) {
			updateMenuSolutionTitle(product);
			loadMenuFragment(document.getElementById('service-menu-content'), document.getElementById(uri + '-id'), product.uri);
		} else {
			initSelectedSolution();
			/*showCatalog();*/
			hideContextualMenu();
			document.getElementById(product.name + '-solution-elmt-id').classList.add('click-event');
		}
	}
	/******************************* SERVICE CONTRACT ********************************************/

	function checkIfAddOnActive(service, addOn) {
		let active = false;
		customer.services.forEach(currentService => {
			if (currentService.id == service) {
				if (currentService.addOns.includes(addOn)) {
					active = true;
				}
			}
		});
		return active;
	}

	function getSelectedStudyCoordinates() {
		var coordinates = new ol.proj.transform(selectedStudyFeature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
		return coordinates;
	}

	function createNewStudy() {
		var study = {
			id: '',
			status: 'ONGOING',
			source: 'DS',
			name: I18N_PROJECT_NAME,
			landArea: '',
			address: '',
			postcode: '',
			city: '',
			taxes: []
		}
		return study;
	}

	function populateStudyFromFeature(study, feature, layer) {
		if (feature && layer == savedStudyLayer &&
			feature.getProperties() && feature.getProperties().features &&
			feature.getProperties().features.length > 0) {
			study.id = feature.getProperties().features[0].get('id');
			study.status = feature.getProperties().features[0].get('status');
			study.source = feature.getProperties().features[0].get('source');
			study.name = feature.getProperties().features[0].get('name');
			study.landArea = feature.getProperties().features[0].get('landArea');
			study.address = feature.getProperties().features[0].get('address');
			study.postcode = feature.getProperties().features[0].get('postcode');
			study.city = feature.getProperties().features[0].get('city');
			study.taxes = feature.getProperties().features[0].get('taxes');
		} else if (feature && layer == savedStudyLayer &&
			feature.getProperties()) {
			study.id = feature.getProperties().id;
			study.status = feature.getProperties().status;
			study.source = feature.getProperties().source;
			study.name = feature.getProperties().name;
			study.landArea = feature.getProperties().landArea;
			study.address = feature.getProperties().address;
			study.postcode = feature.getProperties().postcode;
			study.city = feature.getProperties().city;
			study.taxes = feature.getProperties().taxes;
		} else if (feature && layer == newStudyLayer &&
			feature.properties && feature.properties.features &&
			feature.properties.features.length > 0) {
			study.address = feature.properties.features[0].address;
			study.postcode = feature.properties.features[0].postcode;
			study.city = feature.properties.features[0].city;
			study.taxes = feature.properties.features[0].taxes;
		}
		if (!study.address) study.address = '';
		if (!study.postcode) study.postcode = '';
		if (!study.city) study.city = '';
	}

	function getSelectedStudy(feature) {
		var selectedStudy = null,
			studyFeature = feature ? feature : selectedStudyFeature;
		if (studyFeature) {
			selectedStudy = createNewStudy();
			populateStudyFromFeature(selectedStudy, studyFeature, selectedStudyLayer ? selectedStudyLayer : savedStudyLayer);
		} else {
			selectedStudy = getSelectedStudyCluster()[selectedClusterFeatueIndex];
		}

		return selectedStudy;
	}

	function getSelectedStudyCluster() {
		var selectedStudies = [];
		if (selectedCluster) {
			selectedCluster.get('features').forEach(feature => {
				let study = createNewStudy();
				populateStudyFromFeature(study, feature, savedStudyLayer);
				selectedStudies.push(study);
			});
		}
		return selectedStudies;
	}

	function isStudyModified() {
		var selectedStudy = getSelectedStudy();
		if (selectedStudy.name != document.getElementById('menu-land-name').value ||
			selectedStudy.landArea != document.getElementById('menu-land-area').value || selectedStudy.status != document.getElementById('menu-land-status').value) {
			showDialogMessage('warning-not-saved', 'warning', I180);
			return true;
		}
		return false;
	}

	function getSelectedStudyTaxData() {
		return getSelectedStudy().taxes;
	}

	function getConnectionAwareXmlHttpRequest(httpMethod, uri, successCallBack) {
		var httpRequest = new XMLHttpRequest();
		httpRequest.open(httpMethod, uri);

		httpRequest.setRequestHeader('X-XSRF-TOKEN', getCookie('XSRF-TOKEN'));
		httpRequest.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		httpRequest.addEventListener('readystatechange', function () {
			if (httpRequest.readyState === XMLHttpRequest.DONE) {
				if (httpRequest.status === 200) {
					if (successCallBack) successCallBack(httpRequest.responseText);
				} else if (httpRequest.status === 401) {
					showDialogMessage('access-denied-dialog', 'error', I18N_ACCESS_DENIED_MESSAGE, I18N_RELOAD_LABEL, function () {
						location.reload(true)
					});
				}
			}
		});
		return httpRequest;
	}

	function loadMainFragment(fragmentContainer, serviceId, callback) {
		if (fragmentContainer.firstChild && fragmentContainer.firstChild.id == serviceId + '-main') {
			loadUIFragmentI18n(serviceId, 'main', callback);
			scrollToServiceMainUI();
			return;
		}
		fragmentContainer.innerHTML = '';
		var uiFragmentRequest = getConnectionAwareXmlHttpRequest('GET', '/ui-proxy?service-id=' + serviceId + '&resource=/main/', function (responseText) {
			fragmentContainer.innerHTML = responseText;
			loadUIFragmentI18n(serviceId, 'main', callback);
			scrollToServiceMainUI();
		});
		uiFragmentRequest.send();
		getUIFragmentStyle(serviceId, 'main');
	}

	function showLoadingAnimation(eltId) {
		$("#" + eltId).LoadingOverlay("show", {
			image: "",
			color: "rgba(51, 51, 51, 0.2)",
			fontawesome: "fa fa-spinner fa-spin"
		});
	}

	function stopLoadingAnimation(eltId) {
		$("#" + eltId).LoadingOverlay("hide", true);
	}

	function showFullLoadingAnimation() {
		$.LoadingOverlay("show", {
			image: "",
			color: "rgba(51, 51, 51, 0.2)",
			fontawesome: "fa fa-spinner fa-spin"
		});
	}

	function stopFullLoadingAnimation() {
		$.LoadingOverlay("hide", true);
	}

	function showDialogMessage(id, type, message, buttonLabel, callback) {
		var mainDialogMessage = document.getElementsByClassName('main-dialog-message')[0];
		mainDialogMessage.classList.remove('main-success-message', 'main-warning-message', 'main-error-message');
		mainDialogMessage.getElementsByTagName('div')[2].getElementsByTagName('span')[0].textContent = message;
		mainDialogMessage.classList.add('main-' + type + '-message');
		mainDialogMessage.getElementsByTagName('div')[0].getElementsByTagName('i')[0].classList.remove('fa-check-square-o', 'fa-exclamation-triangle-o', 'fa-window-close-o');
		if (mainDialogMessage.classList.contains('main-success-message')) {
			mainDialogMessage.getElementsByTagName('div')[0].getElementsByTagName('i')[0].classList.add('fa-check-square-o');
		} else if (mainDialogMessage.classList.contains('main-warning-message')) {
			mainDialogMessage.getElementsByTagName('div')[0].getElementsByTagName('i')[0].classList.add('fa-exclamation-triangle');
		} else if (mainDialogMessage.classList.contains('main-error-message')) {
			mainDialogMessage.getElementsByTagName('div')[0].getElementsByTagName('i')[0].classList.add('fa-window-close-o');
		}
		mainDialogMessage.setAttribute('id', id + '-' + type + '-message');
		var dialogButton = document.getElementById('home-dialog-button');
		if (buttonLabel) {
			dialogButton.textContent = buttonLabel;
		}
		var old_element = document.getElementById('home-dialog-button');
		var new_element = old_element.cloneNode(true);
		old_element.parentNode.replaceChild(new_element, old_element);
		new_element.addEventListener('click', function () {
			$('.full-overlay').fadeOut();
			if (callback) callback();
			$('.main-dialog-message').fadeOut();
		});
		$('.full-overlay').fadeIn();
		$('.main-dialog-message').fadeIn();
	}

	function showPurchaserUi(idsToHighlight, callback) {
		var purchaserUi = document.getElementById('purchaser-ui');
		var dialogButton = document.getElementById('purchaser-close-button');
		dialogButton.addEventListener('click', function () {
			$('.full-overlay').fadeOut();
			$('#purchaser-ui').fadeOut();
			getSelectedPurchaser();
			if (callback) callback();
			document.body.scrollTop = document.body.scrollHeight - 500;
		});
		$('.full-overlay').fadeIn();
		$('#purchaser-ui').fadeIn();
		loadPurchasers(idsToHighlight);
	}
	
	function getSelectedPurchaser() {
		if(selectedPurchaser != -1) {
			return purchasers[selectedPurchaser];
		} else return null;
	}

	
	/*******************************SERVICE CONTRACT ********************************************/

	function fillContact() {
		var contact = {};
		contact.product = document.getElementById("contact-product").value;
		contact.nbUsers = document.getElementById("contact-nb-users").value;
		contact.firstName = document.getElementById("contact-first-name").value;
		contact.lastName = document.getElementById("contact-last-name").value;
		contact.company = document.getElementById("contact-company").value;
		contact.job = document.getElementById("contact-function").value;
		contact.mail = document.getElementById("contact-email").value;
		contact.phone = document.getElementById("contact-phone").value;
		contact.comment = document.getElementById("contact-comment").value;
		return contact;
	}

	function displayTutoOverlay() {
		document.getElementById('tuto-overlay').style.display = 'block';
		document.getElementById('coach-image-close').style.display = 'block';
		document.getElementById('coach-image-next').style.display = 'block';
	}

	function displaySecondTutoOverlay() {
		document.getElementById('second-tuto-overlay').style.display = 'block';
	}

	function hideFirstTutoOverlay() {
		document.getElementById('first-tuto-overlay').style.display = 'none';
	}

	function hideSecondTutoOverlay() {
		document.getElementById('second-tuto-overlay').style.display = 'none';
	}

	function displayThirdTutoOverlay() {
		document.getElementById('third-tuto-overlay').style.display = 'block';
	}

	function hideThirdTutoOverlay() {
		document.getElementById('third-tuto-overlay').style.display = 'none';
		document.getElementById('tuto-overlay').style.display = 'none';
	}

	function animateOnboard() {
		var firstTutoOverlay = document.getElementById('first-tuto-overlay');
		var secondTutoOverlay = document.getElementById('second-tuto-overlay');
		var thirdTutoOverlay = document.getElementById('third-tuto-overlay');
		var coachImageClose = document.getElementById('coach-image-close');
		var coachImageNext = document.getElementById('coach-image-next');
		if (secondTutoOverlay.style.display != 'block' && thirdTutoOverlay.style.display != 'block') {
			displayContextualMenu();
			hideFirstTutoOverlay();
			displaySecondTutoOverlay();
		} else if (thirdTutoOverlay.style.display != 'block') {
			hideContextualMenu();
			var sidebar = document.getElementById('menu-sidebar');
			sidebar.style.display = 'none';
			hideSecondTutoOverlay();
			displayThirdTutoOverlay();
			coachImageNext.style.display = 'none';
		} else if (thirdTutoOverlay.style.display == 'block') {
			hideThirdTutoOverlay();
			coachImageClose.style.display = 'none';
			coachImageNext.style.display = 'none';
		}
	}

	function closeOnboard() {
		var tutoOverlay = document.getElementById('tuto-overlay');
		var sliderMenu = document.getElementById('menu-slider');
		if (sliderMenu.className = 'menu-ouvert') {
			hideContextualMenu();
			var sidebar = document.getElementById('menu-sidebar');
			sidebar.style.display = 'none';
		}
		tutoOverlay.style.display = 'none';
	}

	/*************************tax*******************************/

	function browseTax() {
		var taxRequest = getConnectionAwareXmlHttpRequest('GET', '/taxes', function (responseText) {
			var taxes = JSON.parse(responseText);
			countryPolygonLayer.getSource().addFeatures((new ol.format.GeoJSON()).readFeatures(taxes, {
				featureProjection: 'EPSG:3857'
			}));
			stopFullLoadingAnimation();
		});
		taxRequest.setRequestHeader("Content-Type", "application/json");
		taxRequest.setRequestHeader("Accept", "application/json");
		taxRequest.send();
	}

	function createUserList(members) {
		var selectedStudy = getSelectedStudy();
		var parentElt = document.getElementById('user-list');
		members.forEach(member => {
			var itemElt = document.createElement('li');
			itemElt.setAttribute('id', member + '-user-id')
			itemElt.setAttribute('class', 'user');
			var userIcon = document.createElement('i');
			userIcon.setAttribute('class', 'fa fa-user user-icon');
			var anchorElt = document.createElement('a');
			anchorElt.textContent = member;
			var shareIcon = document.createElement('i');
			shareIcon.setAttribute('class', 'fa fa-share-alt share-icon');
			itemElt.addEventListener('click', function () {
				itemElt.classList.remove('selected')
				let selectedStudy = getSelectedStudy();
				if (selectedStudy.id != '') {
					if (!sharedWithUsers.delete(member)) {
						sharedWithUsers.add(member);
						itemElt.classList.add('selected');
					}
					shareStudy();
				}
			});
			itemElt.appendChild(userIcon);
			itemElt.appendChild(anchorElt);
			itemElt.appendChild(shareIcon);
			parentElt.appendChild(itemElt);
		});
	}

	function searchUser(inputId) {
		var input, filter, ul, li, a, i;
		input = document.getElementById(inputId);
		filter = input.value.toUpperCase();
		ul = document.getElementById('user-list');
		li = ul.getElementsByTagName("li");
		for (i = 0; i < li.length; i++) {
			a = li[i].getElementsByTagName("a")[0];
			if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {
				li[i].style.display = "";
			} else {
				li[i].style.display = "none";

			}
		}
	}

	function clearContent(menuContent) {
		while (menuContent.hasChildNodes()) {
			menuContent.removeChild(menuContent.lastChild);
		}
	}

	/*function formatDate(Date d) {
		var dd = d.getDate();
		if(dd<10) dd='0'+dd;
		var mm = d.getMonth()+1;
		if(mm<10) mm='0'+mm;
		var yyyy = d.getFullYear();
		return dd + "/" + mm + "/" + yyyy;
	}*/

	/*function loadSharedWithUsers(study) {
		var selectedStudy = study ? study : getSelectedStudy();
		if (selectedStudy.id && selectedStudy.id != "") {
			var sharedWIthUsersRequest = getConnectionAwareXmlHttpRequest('GET', '/sharedwith?landId=' + encodeURIComponent(selectedStudy.id), function (responseText) {
				sharedWithUsers = new Set(JSON.parse(responseText));
				highlightUsers();
			});
			sharedWIthUsersRequest.setRequestHeader("Accept", "application/json");
			sharedWIthUsersRequest.send();
		}
	}*/

	function loadAttachments(study) {
		var selectedStudy = study ? study : getSelectedStudy();
		if (selectedStudy.id && selectedStudy.id != "") {
			var attachmentsRequest = getConnectionAwareXmlHttpRequest('GET', '/attachments?landId=' + encodeURIComponent(selectedStudy.id), function (responseText) {
				attachments = JSON.parse(responseText);
				var attachmentMenu = document.getElementById('sidebar-file');
				attachments.forEach(attachment => {
					attachmentMenu.appendChild(createAttachmentsList(attachment, selectedStudy));
				});
			});
			attachmentsRequest.setRequestHeader("Accept", "application/json");
			attachmentsRequest.send();
		}
	}


	function createAttachmentsList(attachment, study) {
		var itemElt = document.createElement('li');
		var anchorElt = document.createElement('a');
		anchorElt.setAttribute('href', '/attachment?filename=' + attachment.fileName + '&landname=' + study.name);
		var spanElt = document.createElement('span');
		spanElt.textContent = attachment.name;
		var downloadIcon = document.createElement('i');
		downloadIcon.setAttribute('class', 'fa fa-download');
		downloadIcon.setAttribute('aria-hidden', 'true');
		anchorElt.appendChild(spanElt);
		anchorElt.appendChild(downloadIcon);
		itemElt.appendChild(anchorElt);
		var modifDate = attachment.modifDate;
		/*var dateMaj = modifDate.substring(0,10);
		var hourMaj = modifDate.substring(11,modifDate.length);*/
		if (modifDate != null) {
			var dateContainer = document.createElement('div');
			dateContainer.setAttribute('class', 'attachment-date');
			dateContainer.textContent = 'mise à jour : ' + modifDate;
			itemElt.appendChild(dateContainer);
		}
		return itemElt;
	}

	/************************ QUOTATION AND PAYMENT POP UP ***********************/


	function checkTenantForm() {
		//	    if(!document.getElementById("tenant-name").value.replace(/\s/g, "").length || !document.getElementById("tenant-admin-name").value.replace(/\s/g, "").length || !document.getElementById("tenant-admin-mail").value.replace(/\s/g, "").length) {
		//	        document.getElementById('tenant-form-required-text').style.display = 'block';
		//	        (!document.getElementById("tenant-name").value.replace(/\s/g, "").length) ? document.getElementById("tenant-name-label").classList.add('form-label-error') : document.getElementById("tenant-name-label").classList.remove('form-label-error');
		//	        (!document.getElementById("tenant-admin-name").value.replace(/\s/g, "").length) ? document.getElementById("tenant-admin-name-label").classList.add('form-label-error') : document.getElementById("tenant-admin-name-label").classList.remove('form-label-error');
		//	        (!document.getElementById("tenant-admin-mail").value.replace(/\s/g, "").length) ? document.getElementById("tenant-admin-mail-label").classList.add('form-label-error') : document.getElementById("tenant-admin-mail-label").classList.remove('form-label-error');
		//	    }else {
		//	        document.getElementById('tenant-form-required-text').style.display = 'none';
		//	        document.getElementById("tenant-name-label").classList.remove('form-label-error');
		//	        document.getElementById("tenant-admin-name-label").classList.remove('form-label-error');
		//	        document.getElementById("tenant-admin-mail-label").classList.remove('form-label-error');
		//	        tenant = {};
		//	        sendTenant();
		//	    }
		sendTenant();
	}

	function sendTenant() {
		fillTenant();
		var clientRequest = getConnectionAwareXmlHttpRequest('POST', '/tenants', function (responseText) {
			let tenantStructure = JSON.parse(responseText);
			tenant = tenantStructure;
			hideTenantModal();
			showPricingModalPaymentPartOnly();
		});
		clientRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		clientRequest.setRequestHeader("Accept", "application/json");
		clientRequest.send(JSON.stringify(tenant));
	}

	function fillTenant() {
		tenant.name = document.getElementById("tenant-name").value;
		//tenant.address = document.getElementById("tenant-address").value;
		//tenant.siret = document.getElementById("tenant-siret").value;
		// tenant.country = document.getElementById("tenant-country").value;
		// tenant.taxNumber = document.getElementById("tenant-tax-number").value;
		tenant.headOfficeEmail = customer.mail;
		tenant.adminName = document.getElementById("tenant-admin-name").value;
		tenant.adminEmail = document.getElementById("tenant-admin-mail").value;
	}

	function showConfigUserNav() {
		document.getElementById('nav-config-users-link').style.display = 'block';
	}

	function renderConfigUsers() {
		//renderQuantityUsersLeft();
		clearConfigUsersRow();
		var userRowContainer = document.getElementById('users-list-container');
		if (customer.members && customer.members.length > 0) {
				let members =customer.members;
				members.forEach(function (member) {
				userRowContainer.appendChild(renderUsersRow(member));
				});
			} else {
				createUserRow();
			}
			
		document.getElementById('add-user').addEventListener('click', createUserRow);
		document.getElementById('send-subscription-configuration').addEventListener('click', checkConfigUsersEmail);
	}

	function renderQuantityUsersLeft() {
		var quantityUsersLeft = document.getElementById('number-of-users-left');
		if (customer.members && customer.members.length > 0) {
			quantityUsersLeft.textContent = productLicenseCount - customer.members.length;
		} else {
			quantityUsersLeft.textContent = productLicenseCount;
		}
	}

	function clearConfigUsersRow() {
		var userRowContainer = document.getElementById('users-list-container');
		while (userRowContainer.hasChildNodes()) {
			userRowContainer.removeChild(userRowContainer.lastChild);
		}
	}

	function createUserRow() {
		var userRowContainer = document.getElementById('users-list-container');
		
		var userRowContent = document.createElement('div');
		userRowContent.setAttribute('class', 'my-user-input-container');
		//userRowContent.setAttribute('id', 'my-user-container-' + index);
		//var spanNumber = document.createElement('span');
		//spanNumber.setAttribute('id', 'my-user-input-number-' + index);
		//spanNumber.setAttribute('class', 'my-user-input-number pop-up-user-color');
		//spanNumber.textContent = (index + 1) + " . ";

		var formTypeElt = document.createElement('div');
		formTypeElt.setAttribute('class', 'my-user-input-content material-design-group ');

		var inputTypeElt = document.createElement('input');
		//inputTypeElt.setAttribute('id', 'my-user-input-' + index);
		inputTypeElt.setAttribute('data-input', 'mail-input');
		inputTypeElt.setAttribute('type', 'text');
		//inputTypeElt.setAttribute('name', 'my-user-input-' + index);
		inputTypeElt.setAttribute('class', 'material-design-input my-user-input-email');
		//inputTypeElt.setAttribute('required', '');

		var highlightTypeElt = document.createElement('span');
		highlightTypeElt.setAttribute('class', 'material-design-highlight');
		var barTypeElt = document.createElement('span');
		barTypeElt.setAttribute('class', 'material-design-bar');
		var labelInputTypeElt = document.createElement('label');
		labelInputTypeElt.setAttribute('class', 'material-design-label');
		//labelInputTypeElt.setAttribute('for', 'my-user-input-' + index);
		labelInputTypeElt.textContent = I18N_ADD_USER_MAIL;
		
		var checkBoxListContainer = document.createElement('ul');
		checkBoxListContainer.setAttribute('class', 'authorization-list-container');

		var checkBoxListItems = ['subscription-admin', 'config-user-admin'];
		var li = {},
			input = {},
			label = {};
		checkBoxListItems.forEach(checkBoxListItem => {
			li[checkBoxListItem] = document.createElement('li');
			input[checkBoxListItem] = document.createElement('input');
			input[checkBoxListItem].setAttribute('type', 'checkbox');
			input[checkBoxListItem].setAttribute('class', 'user-role' );
			//input[checkBoxListItem].setAttribute('id', checkBoxListItem + '-' + index);
			
			//input[checkBoxListItem].setAttribute('name', 'user-role-' + index);
			input[checkBoxListItem].setAttribute('value', checkBoxListItem);
			label[checkBoxListItem] = document.createElement('label');
			//label[checkBoxListItem].setAttribute('for', checkBoxListItem + '-' + index);
			label[checkBoxListItem].setAttribute('class', checkBoxListItem + '-label');
			switch (checkBoxListItem) {
				case "subscription-admin":
					input[checkBoxListItem].setAttribute('title', I18N_SUBSCRIPTION_MANAGING);
					input[checkBoxListItem].setAttribute('data-subscription', checkBoxListItem);
					label[checkBoxListItem].textContent = I18N_UPDATE_SUBSCRIPTION;
					
					break;
				case "config-user-admin":
					input[checkBoxListItem].setAttribute('title', I18N_CONFIG_USERS_MANAGING);
					input[checkBoxListItem].setAttribute('data-config-user', checkBoxListItem);
					label[checkBoxListItem].textContent = I18N_CONFIG_USERS;
					
					break;
				default:
					break;
			}

			li[checkBoxListItem].appendChild(label[checkBoxListItem]);
			li[checkBoxListItem].appendChild(input[checkBoxListItem]);
			checkBoxListContainer.appendChild(li[checkBoxListItem]);
		});
		var divDeleteBtn = document.createElement('div');
		//divDeleteBtn.setAttribute('id', 'delete-user-btn-' + index);
		divDeleteBtn.setAttribute('class', 'delete-user-btn');
		var iconDeleteBtn = document.createElement('i');
		iconDeleteBtn.setAttribute('class', 'fa fa-trash-o delete-user-btn');
		iconDeleteBtn.setAttribute('title', I18N_DELETE_MEMBER);
		divDeleteBtn.appendChild(iconDeleteBtn);
		divDeleteBtn.addEventListener('click', function () {
			clearUserRowElement();
		});
		//userRowContent.appendChild(spanNumber);
		userRowContent.appendChild(formTypeElt);
		userRowContent.appendChild(checkBoxListContainer);
		userRowContent.appendChild(divDeleteBtn);

		formTypeElt.appendChild(inputTypeElt);
		formTypeElt.appendChild(highlightTypeElt);
		formTypeElt.appendChild(barTypeElt);
		formTypeElt.appendChild(labelInputTypeElt);
		userRowContainer.appendChild(userRowContent);
		return userRowContainer;
		

	}

	function renderUsersRow(member) {
	//function renderUsersRow() {
		var userRowContent = document.createElement('div');
		userRowContent.setAttribute('class', 'my-user-input-container');
		//userRowContent.setAttribute('id', 'my-user-container-' + index);
		//var spanNumber = document.createElement('span');
		//spanNumber.setAttribute('id', 'my-user-input-number-' + index);
		//spanNumber.setAttribute('class', 'my-user-input-number pop-up-user-color');
		//spanNumber.textContent = (index + 1) + " . ";

		var formTypeElt = document.createElement('div');
		formTypeElt.setAttribute('class', 'my-user-input-content material-design-group ');

		var inputTypeElt = document.createElement('input');
		//inputTypeElt.setAttribute('id', 'my-user-input-' + index);
		inputTypeElt.setAttribute('data-input', 'mail-input');
		inputTypeElt.setAttribute('type', 'text');
		//inputTypeElt.setAttribute('name', 'my-user-input-' + index);
		inputTypeElt.setAttribute('class', 'material-design-input my-user-input-email');
		//inputTypeElt.setAttribute('required', '');

		var highlightTypeElt = document.createElement('span');
		highlightTypeElt.setAttribute('class', 'material-design-highlight');
		var barTypeElt = document.createElement('span');
		barTypeElt.setAttribute('class', 'material-design-bar');
		var labelInputTypeElt = document.createElement('label');
		labelInputTypeElt.setAttribute('class', 'material-design-label');
		//labelInputTypeElt.setAttribute('for', 'my-user-input-' + index);
		//labelInputTypeElt.textContent = I18N_ADD_USER_MAIL;
		if (customer.members && customer.members.length > 0) {
			inputTypeElt.value = member.mail;
			labelInputTypeElt.textContent = I18N_CHANGE_USER_MAIL;
		} else {
			labelInputTypeElt.textContent = I18N_ADD_USER_MAIL;

		}
		var checkBoxListContainer = document.createElement('ul');
		checkBoxListContainer.setAttribute('class', 'authorization-list-container');

		var checkBoxListItems = ['subscription-admin', 'config-user-admin'];
		var li = {},
			input = {},
			label = {};
		checkBoxListItems.forEach(checkBoxListItem => {
			li[checkBoxListItem] = document.createElement('li');
			input[checkBoxListItem] = document.createElement('input');
			input[checkBoxListItem].setAttribute('type', 'checkbox');
			input[checkBoxListItem].setAttribute('class', 'user-role' );
			//input[checkBoxListItem].setAttribute('id', checkBoxListItem + '-' + index);
			
			//input[checkBoxListItem].setAttribute('name', 'user-role-' + index);
			input[checkBoxListItem].setAttribute('value', checkBoxListItem);
			label[checkBoxListItem] = document.createElement('label');
			//label[checkBoxListItem].setAttribute('for', checkBoxListItem + '-' + index);
			label[checkBoxListItem].setAttribute('class', checkBoxListItem + '-label');
			switch (checkBoxListItem) {
				case "subscription-admin":
					input[checkBoxListItem].setAttribute('title', I18N_SUBSCRIPTION_MANAGING);
					input[checkBoxListItem].setAttribute('data-subscription', checkBoxListItem);
					label[checkBoxListItem].textContent = I18N_UPDATE_SUBSCRIPTION;
					if (member) {
						input[checkBoxListItem].checked = member.canModifySubscription;
					}
					break;
				case "config-user-admin":
					input[checkBoxListItem].setAttribute('title', I18N_CONFIG_USERS_MANAGING);
					input[checkBoxListItem].setAttribute('data-config-user', checkBoxListItem);
					label[checkBoxListItem].textContent = I18N_CONFIG_USERS;
					if (customer.members && customer.members.length > 0) {
						input[checkBoxListItem].checked = member.canConfigureUsers;
					}
					break;
				default:
					break;
			}

			li[checkBoxListItem].appendChild(label[checkBoxListItem]);
			li[checkBoxListItem].appendChild(input[checkBoxListItem]);
			checkBoxListContainer.appendChild(li[checkBoxListItem]);
		});
		var divDeleteBtn = document.createElement('div');
		//divDeleteBtn.setAttribute('id', 'delete-user-btn-' + index);
		divDeleteBtn.setAttribute('class', 'delete-user-btn');
		var iconDeleteBtn = document.createElement('i');
		iconDeleteBtn.setAttribute('class', 'fa fa-trash-o delete-user-btn');
		iconDeleteBtn.setAttribute('title', I18N_DELETE_MEMBER);
		divDeleteBtn.appendChild(iconDeleteBtn);
		divDeleteBtn.addEventListener('click', function () {
			clearUserRowElement();
		});
		//userRowContent.appendChild(spanNumber);
		userRowContent.appendChild(formTypeElt);
		userRowContent.appendChild(checkBoxListContainer);
		userRowContent.appendChild(divDeleteBtn);

		formTypeElt.appendChild(inputTypeElt);
		formTypeElt.appendChild(highlightTypeElt);
		formTypeElt.appendChild(barTypeElt);
		formTypeElt.appendChild(labelInputTypeElt);

		return userRowContent;
		
	}

	function clearUserRowElement() {
		event.target.parentElement.parentElement.remove();
	}


	function checkConfigUsersEmail() {
		var mailInputs = Array.from(document.getElementsByClassName('my-user-input-email'));
		var regex = RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
		var emailOk = true;
		var configurations = [];
		mailInputs.forEach(mailInput => {
			if (regex.test(mailInput.value)) {
				mailInput.style.color = '#11a0ba';
				//mailInput.placeholder = I18N_ENTER_EMAIL;
			} else {
				mailInput.style.color = '#f17955';
				mailInput.value = I18N_ERROR_EMAIL;
				emailOk = false;
			}
		});
		if (emailOk) {
			//for (let i = 0; i <  mailInputs.length; i++) {
			//	let user = {};
				
			//	user.mail = document.getElementById('my-user-input-' + i).value;
			//	user.canModifySubscription = document.getElementById('subscription-admin-' + i).checked;
			//	user.canConfigureUsers = document.getElementById('config-user-admin-' + i).checked;


			//	configurations.push(user);
			//}
			
			var userRows = Array.from(document.getElementsByClassName('my-user-input-container'));
			userRows.forEach(userRow => {

				let user = {};
				user.mail = userRow.childNodes[0].firstChild.value;
				user.canModifySubscription = userRow.childNodes[1].childNodes[0].lastChild.checked;
				user.canConfigureUsers = userRow.childNodes[1].childNodes[1].lastChild.checked;
				configurations.push(user);
			});
			sendSubscriptionConfig(configurations);
		}
	}

	//	function checkConfigUsersEmail(indexUser) {
	//		var validateEmail = function(elementValue) {
	//			var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
	//			return emailPattern.test(elementValue);
	//		}
	//		
	//		for(var i = 1; i <= 3; i++) {
	//			$('#my-user-input-' + i ).keyup(function() {
	//		
	//				var value = $(this).val();
	//				var valid = validateEmail(value);
	//			
	//				if (!valid) {
	//			
	//					$(this).css('color', '#f17955');
	//			
	//				} else {
	//			
	//					 $(this).css('color', '#11a0ba');
	//			
	//				}
	//			});
	//		}
	//	}

	function sendSubscriptionConfig(configurations) {
		var subscriptionRequest = getConnectionAwareXmlHttpRequest('POST', '/users?subscriptionId=' + encodeURIComponent(customer.subscriptionId), function (responseText) {
			hidePricingModal();
			getCustomerData();
			showDialogMessage("users-config", "success", I18N_SUCCESS_MESSAGE_SUBSCRIPTION_USERS_UPDATE, "OK");
			//initDashboard();
		});
		subscriptionRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		subscriptionRequest.setRequestHeader("Accept", "application/json");

		subscriptionRequest.send(JSON.stringify(configurations));
	}

	function clearPurchasersContainer() {
		var purchaserContainer = document.getElementById("purchaser-ui-dialog-list-wrapper");
		while (purchaserContainer.hasChildNodes()) {
			purchaserContainer.removeChild(purchaserContainer.lastChild);
		}
	}

	function savePurchaser(purchaserType, index) {
		var saveRequest = getConnectionAwareXmlHttpRequest('POST', '/purchasers', function (responseText) {
			var purchaser = JSON.parse(responseText);
			let purchaserIndex = findPurchaser(purchaser);
				if (purchaserIndex == -1) {
					if(purchaser.name != undefined){
						renderPurchaser(index, "individual");
					}else{
						renderPurchaser(index, "company");
					}
				} else {
					reloadPurchaser(purchaser,purchaserIndex);
				}
				//loadPurchasers();
				
		});

		saveRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		saveRequest.setRequestHeader("Accept", "application/json;charset=UTF-8");

		if (purchaserType == 'individual') {
			saveRequest.send(JSON.stringify(individual));
		} else if (purchaserType == 'company') {
			saveRequest.send(JSON.stringify(company));
		}
	}
	
	function loadPurchasers(idsToHighlight) {
			var purchaserRequest = window.ppmds.home.getConnectionAwareXmlHttpRequest('GET', '/purchasers', function(responseText) {
				let response = JSON.parse(responseText);
				if(response) {
					purchasers = response;
					clearPurchasersContainer();
					for(var i = 0; i < purchasers.length; i++) {
						if(purchasers[i].name != undefined){
							renderPurchaser(i, "individual", idsToHighlight);
							updateIndividual(purchasers[i],i);
						}else if(purchasers[i].socialReason != undefined){
							renderPurchaser(i, "company", idsToHighlight);
							updateCompany(purchasers[i],i);
						}
        			}
				}
			});
			purchaserRequest.setRequestHeader("Accept", "application/json");
			purchaserRequest.send();
	}
	function deletePurchaser(index) {
		var deleteRequest = window.ppmds.home.getConnectionAwareXmlHttpRequest('DELETE', '/purchasers?id='+ encodeURIComponent(purchasers[index]._id) , function (responseText) {
			deletePurchaserUi(index);
		});
		deleteRequest.setRequestHeader("Accept", "application/json");
		deleteRequest.send();
	}

	/* MENU CIRCULAIRE */

	function initMenuCircle(products) {
        var circleMenu = document.getElementById('circle-menu');
        var burgerMenu = document.getElementById('burger-menu');
        var burgerMenuImg = document.getElementById('burger-menu-img');
        var circle = document.getElementById('hamburger').getElementsByClassName('circle');
        var close = document.getElementById('close');
        var overlay = document.getElementById('full-overlay');
        var soMenu = document.getElementById('so-menu');
        var gpMenu = document.getElementById('gp-menu');
        var bpMenu = document.getElementById('bp-menu');
        var modifMenu = document.getElementById('modif-menu');
        var archivageMenu = document.getElementById('archivage-menu');
        var msgBurger = document.getElementById('msg-burger');
        var msgSo = document.getElementById('msg-so');
        var msgGp = document.getElementById('msg-gp');
        var msgBp = document.getElementById('msg-bp');
        var msgModif = document.getElementById('msg-modif');
        var msgArchivage = document.getElementById('msg-archivage');

        $('#circle-menu').circleMenu({
            item_diameter: 50,
            circle_radius: 170,
            direction: 'top-left'
        });

        circleMenu.style.display = 'block';

        burgerMenu.addEventListener('click', function () {
            $('.circle').toggleClass('close-animation-circle');
            close.classList.toggle('close-animation-close');
            $('.full-overlay').fadeToggle();
        });

        if (circleMenu.classList.contains('circleMenu-open')) {
        	positionHoverMsg(burgerMenu, msgBurger);
	        positionHoverMsg(soMenu, msgSo);
	        positionHoverMsg(gpMenu, msgGp);
	        positionHoverMsg(bpMenu, msgBp);
	        positionHoverMsg(modifMenu, msgModif);
	        positionHoverMsg(archivageMenu, msgArchivage);
        }

        overlay.addEventListener('click', function () {
            $('#circle-menu').circleMenu('close');
            $('.circle').toggleClass('close-animation-circle');
            close.classList.toggle('close-animation-close');
        });

        $('ul').on('circleMenu-select', function (evt, item) {
            $('.circle').toggleClass('close-animation-circle');
            close.classList.toggle('close-animation-close');
        });

        hoverMsg(burgerMenu, circleMenu, msgBurger);
        hoverMsg(soMenu, circleMenu, msgSo);
        hoverMsg(gpMenu, circleMenu, msgGp);
        hoverMsg(bpMenu, circleMenu, msgBp);
        hoverMsg(modifMenu, circleMenu, msgModif);
        hoverMsg(archivageMenu, circleMenu, msgArchivage);

    }

    function checkSubscriptionCircleMenu(products) {
    	products.forEach(product => {
        	var subscription = findSubscription(product.uri);
			if (subscription == 'monitoring') {
				soMenu.classList.remove('inaccessible');				
			}

			if (subscription == 'marketing') {
				gpMenu.classList.remove('inaccessible');
			}

			if (subscription == 'montage') {
				bpMenu.classList.remove('inaccessible');
			}
        });
    }

	function hoverMsg(trigger, circleMenu, msg) {
		trigger.addEventListener('mouseover', function () {
			if (circleMenu.classList.contains('circleMenu-open')) {
				msg.style.display = 'block';
			}
		});
		trigger.addEventListener('mouseout', function () {
			msg.style.display = 'none';
		});
	}

	function positionHoverMsg(trigger, msg) {
		var soMenu = document.getElementById('so-menu');
		var burgerMenu = document.getElementById('burger-menu');

    	trigger.onmouseover = function (e) {
		    var x = e.clientX,
		        y = e.clientY;
		    msg.style.display = 'block';
		    if (trigger == soMenu) {
		    	msg.style.top = (y - 100) + 'px';
		    	msg.style.left = (x - 150) + 'px';
		    	msg.style.display = 'table';
		    } else if (trigger == burgerMenu) {
		    	msg.style.top = (y - 100) + 'px';
		    	msg.style.left = (x - 120) + 'px';
		    } else {
		    msg.style.top = (y - 50) + 'px';
		    msg.style.left = (x - 50) + 'px';
		    }
		};
	}

    function enableHoverMsgCreateOrSelect() {
        var burgerMenu = document.getElementById('burger-menu');
        var circleMenu = document.getElementById('circle-menu');
        var msgBurger = document.getElementById('msg-burger');

		hoverMsg(burgerMenu, circleMenu, msgBurger);
	}

    function disableHoverMsgCreateOrSelect() {
        var burgerMenu = document.getElementById('burger-menu');
        var msgBurger = document.getElementById('msg-burger');

		burgerMenu.addEventListener('mouseover', function () {
			msgBurger.style.display = 'none';
		});
	}

	function menuCircleSelectedProject() {
		var circleModif = document.getElementById('modif-menu');
		var circleArchivage = document.getElementById('archivage-menu');

		circleModif.classList.remove('inaccessible');
		circleArchivage.classList.remove('inaccessible');
	}

	function menuCircleUnselectedProject() {
		var circleModif = document.getElementById('modif-menu');
		var circleArchivage = document.getElementById('archivage-menu');

		circleModif.classList.add('inaccessible');
		circleArchivage.classList.add('inaccessible');
	}

	function reloadPurchaser(purchaser,purchaserIndex) {
		if(purchaser.name != undefined){
			updateIndividual(purchasers[purchaserIndex],purchaserIndex)
		}else {
			updateCompany(purchasers[purchaserIndex],purchaserIndex)
		}
	}
	
	/***********************PURCHASER UI**************************/

	function renderPurchaser(index, purchaserType, idsToHighlight) {
		var purchaserDialogListWrapper = document.getElementById('purchaser-ui-dialog-list-wrapper');
		var purchaserDialogList = document.createElement('div');
		purchaserDialogList.setAttribute('id', 'purchaser-ui-dialog-list-' + index);
		purchaserDialogList.setAttribute('class', 'purchaser-ui-dialog-list');
		var purchaserDialogContent = document.createElement('div');
		purchaserDialogContent.setAttribute('id', 'purchaser-ui-content-' + index);
		if(idsToHighlight != undefined && idsToHighlight.length > 0){
			if(idsToHighlight.includes(purchasers[index]._id)) {
				purchaserDialogContent.style.backgroundColor = "#e5e5e5";
				purchaserDialogContent.style.color = "#b1b1b1";
				purchaserDialogContent.style.borderBottom = "solid 4px #9b9898";
			}
		}
		var purchaserTypeValue = document.getElementById('purchaser-type').textContent;
		if (purchaserType == "individual") {
			purchaserDialogContent.setAttribute('class', 'purchaser-ui-dialog-list-content purchaser-ui-dialog-purchaser-content');
		} else {
			purchaserDialogContent.setAttribute('class', 'purchaser-ui-dialog-list-content purchaser-ui-dialog-tenant-content');
		}

		var divPurchaserDialogList = document.createElement('div');
		divPurchaserDialogList.setAttribute('id', 'purchaser-ui-content-i');
		var iPurchaserDialogList = document.createElement('i');
		if (purchaserType == "individual") {
			iPurchaserDialogList.setAttribute('class', 'fa fa-user-o fa-2x');
		} else {
			iPurchaserDialogList.setAttribute('class', 'fa fa-building-o fa-2x');
		}
		var firstNamePurchaser = document.createElement('div');
		firstNamePurchaser.setAttribute('id', 'purchaser-ui-name' + index);
		firstNamePurchaser.setAttribute('class', 'purchaser-description');
		if (purchaserType == "individual") {
			firstNamePurchaser.textContent = document.getElementById('purchaser-name').value;
		} else {
			firstNamePurchaser.textContent = document.getElementById('purchaser-society-name').value;
		}
		var lastNamePurchaser = document.createElement('div');
		lastNamePurchaser.setAttribute('id', 'purchaser-ui-lastname' + index);
		lastNamePurchaser.setAttribute('class', 'purchaser-description');
		if (purchaserType == "individual") {
			lastNamePurchaser.textContent = document.getElementById('purchaser-firstname').value;
		} else {
			lastNamePurchaser.textContent = "SIRET : " + document.getElementById('purchaser-society-siret').value;
		}
		var divMailPurchaser = document.createElement('div');
		divMailPurchaser.setAttribute('id', 'purchaser-ui-content-mail' + index);
		if (purchaserType == "individual") {
			divMailPurchaser.textContent = document.getElementById('purchaser-people-email').value;
		} else {
			divMailPurchaser.textContent = document.getElementById('purchaser-society-contact-email').value;
		}

		var purchaserDialogOverlay = document.createElement('div');
		purchaserDialogOverlay.setAttribute('id', 'purchaser-overlay');
		if (purchaserType == "individual") {
			purchaserDialogOverlay.setAttribute('class', 'purchaser-ui-dialog-list-overlay purchaser-physical-person');
		} else {
			purchaserDialogOverlay.setAttribute('class', 'purchaser-ui-dialog-list-overlay purchaser-society');
		}
		var importPurchaserButton = document.createElement('div');
		importPurchaserButton.setAttribute('class', 'btn-wrapper-overlay btn-wrapper-overlay-validate');
		importPurchaserButton.setAttribute('id', 'btn-wrapper-overlay-validate');
		importPurchaserButton.addEventListener('click', function () {
			selectedPurchaser = index;
			document.getElementById('purchaser-close-button').click();
		});
		var aPurchaserDialogOverlayBtnValidate = document.createElement('a');
		aPurchaserDialogOverlayBtnValidate.setAttribute('href', '#');
		aPurchaserDialogOverlayBtnValidate.setAttribute('class', 'btn-wrapper-link');
		var iPurchaserDialogOverlayBtnValidate = document.createElement('i');
		iPurchaserDialogOverlayBtnValidate.setAttribute('class', 'fa fa-th-large');
		iPurchaserDialogOverlayBtnValidate.setAttribute('aria-hidden', 'true');
		var titlePurchaserDialogOverlayBtnValidate = document.createElement('p');
		titlePurchaserDialogOverlayBtnValidate.textContent = I18N_VALIDATE_BTN;

		var editPurchaserButton = document.createElement('div');
		editPurchaserButton.setAttribute('class', 'btn-wrapper-overlay btn-wrapper-overlay-edit');
		editPurchaserButton.setAttribute('id', 'btn-wrapper-overlay-edit');
		editPurchaserButton.addEventListener('click', function () {
			selectedPurchaser = index;
			var parentNode = event.target.parentNode;
			if (parentNode.parentElement.parentElement.classList.contains('purchaser-physical-person')) {
				individualForm = true;
				showPurchaserFormPeople();
				individual = purchasers[selectedPurchaser];				updatePurchaserFormPeople(index);
				document.getElementById('button-purchaser-delete').style.display = "block";
			} else {
				individualForm = false;
				showPurchaserFormSociety();
				company = purchasers[selectedPurchaser];
				updatePurchaserFormSociety(index);
				document.getElementById('button-purchaser-delete').style.display = "block";

			}
		});
		var aPurchaserDialogOverlayBtnEdit = document.createElement('a');
		/* aPurchaserDialogOverlayBtnEdit.setAttribute('href', '#'); */
		aPurchaserDialogOverlayBtnEdit.setAttribute('class', 'btn-wrapper-link');
		var iPurchaserDialogOverlayBtnEdit = document.createElement('i');
		iPurchaserDialogOverlayBtnEdit.setAttribute('class', 'fa fa-edit');
		iPurchaserDialogOverlayBtnEdit.setAttribute('aria-hidden', 'true');
		var titlePurchaserDialogOverlayBtnEdit = document.createElement('p');
		titlePurchaserDialogOverlayBtnEdit.textContent = I18N_EDIT_BTN;

		divPurchaserDialogList.appendChild(iPurchaserDialogList);

		purchaserDialogContent.appendChild(divPurchaserDialogList);
		purchaserDialogContent.appendChild(firstNamePurchaser);
		purchaserDialogContent.appendChild(lastNamePurchaser);
		purchaserDialogContent.appendChild(divMailPurchaser);

		importPurchaserButton.appendChild(aPurchaserDialogOverlayBtnValidate);
		aPurchaserDialogOverlayBtnValidate.appendChild(iPurchaserDialogOverlayBtnValidate);
		aPurchaserDialogOverlayBtnValidate.appendChild(titlePurchaserDialogOverlayBtnValidate);

		editPurchaserButton.appendChild(aPurchaserDialogOverlayBtnEdit);
		aPurchaserDialogOverlayBtnEdit.appendChild(iPurchaserDialogOverlayBtnEdit);
		aPurchaserDialogOverlayBtnEdit.appendChild(titlePurchaserDialogOverlayBtnEdit);

		purchaserDialogOverlay.appendChild(importPurchaserButton);
		purchaserDialogOverlay.appendChild(editPurchaserButton);

		purchaserDialogList.appendChild(purchaserDialogContent);
		purchaserDialogList.appendChild(purchaserDialogOverlay);
		purchaserDialogListWrapper.appendChild(purchaserDialogList);

		

	}

	function hightlightPurchaser() {
		var elmtToHightlight = document.getElementsByClassName('purchaser-ui-dialog-list-content');
		var container = document.getElementsByClassName('purchaser-ui-dialog-list')
		for (var i = 0; i < container; i++) {
			if (document.getElementById('purchaser-overlay').hasClass('purchaser-physical-person')) {
				elmtToHightlight.style.background = "#bbdcff";
			} else if (document.getElementById('purchaser-overlay').hasClass('purchaser-society')) {
				elmtToHightlight.style.background = "#fbcbb4";
			}
		}
	}

	function clearPurchaserForm() {
		document.getElementById('purchaser-name').value = '';
		document.getElementById('purchaser-firstname').value = '';
		document.getElementById('purchaser-adress').value = '';
		document.getElementById('purchaser-people-email').value = '';
		document.getElementById('purchaser-people-phone').value = '';
		document.getElementById('purchaser-society-name').value = '';
		document.getElementById('purchaser-society-legalstatus').value = '';
		document.getElementById('purchaser-society-siret').value = '';
		document.getElementById('purchaser-society-capital').value = '';
		document.getElementById('purchaser-society-contact-name').value = '';
		document.getElementById('purchaser-society-contact-email').value = '';
		document.getElementById('purchaser-society-contact-phone').value = '';

	}

	function matchPurchaserByName() {
		var search = document.getElementById('purchaser-ui-dialog-search-input').value.toUpperCase();
		if (search == "") {
			clearHighlightings();
			showPurchasers();
		} else {
			var visibleElt = new Set();
			var details = document.querySelectorAll("div.purchaser-description");
			for (var i = 0; i < details.length; i++) {
				var purchaserContainer = details[i].parentElement.parentElement;
				details[i].classList.remove('purchaser-description-match');
				if (details[i].textContent.toUpperCase().indexOf(search) > -1) {
					details[i].classList.add('purchaser-description-match');
					visibleElt.add(purchaserContainer.id);
				}
			}
			hidePurchasers(visibleElt);
		}
	}

	function clearHighlightings() {
		var details = document.querySelectorAll("div.purchaser-description");
		for (var i = 0; i < details.length; i++) {
			details[i].classList.remove('purchaser-description-match');
		}
	}

	function hidePurchasers(visibleElt) {
		var purchasers = document.getElementById('purchaser-ui-dialog-list-wrapper').children;
		for (var i = 0; i < purchasers.length; i++) {
			var purchaser = purchasers[i];
			if (!visibleElt.has(purchaser.id)) purchaser.classList.add('purchaser-hidden');
		}
	}

	function showPurchasers() {
		var purchasers = document.getElementById('purchaser-ui-dialog-list-wrapper').children;
		for (var i = 0; i < purchasers.length; i++) {
			var purchaser = purchasers[i];
			purchaser.classList.remove('purchaser-hidden');
		}
	}
	function updatePurchaserFormPeople(index) {
		document.getElementById('purchaser-name').value = purchasers[index].name;
		document.getElementById('purchaser-firstname').value = purchasers[index].firstName;
		document.getElementById('purchaser-adress').value = purchasers[index].address;
		document.getElementById('purchaser-people-email').value = purchasers[index].mail;
		document.getElementById('purchaser-people-phone').value = purchasers[index].phoneNumber;
	}

	function updatePurchaserFormSociety(index) {
		document.getElementById('purchaser-society-name').value = purchasers[index].socialReason;
		document.getElementById('purchaser-society-legalstatus').value = purchasers[index].legalStatus;
		document.getElementById('purchaser-society-siret').value =purchasers[index].siret;
		document.getElementById('purchaser-society-capital').value = purchasers[index].capital;
		document.getElementById('purchaser-adress').value = purchasers[index].address;
		document.getElementById('purchaser-society-contact-name').value = purchasers[index].contactName;
		document.getElementById('purchaser-society-contact-email').value = purchasers[index].contactMail;
		document.getElementById('purchaser-society-contact-phone').value = purchasers[index].contactMail;

	}

	function createIndividual() {
		var individual = {
			_id: null,
			name: "",
			firstName: "",
			address: "",
			mail: "",
			phoneNumber: ""
		}
		return individual;
	}

	function createCompany() {
		var company = {
			_id: null,
			socialReason: "",
			legalStatus: "",
			siret: "",
			capital: "",
			address: "",
			contactName: "",
			contactMail: "",
			contactPhone: ""
		}
		return company;
	}

	function setIndividualData(index) {
		individual.name = document.getElementById('purchaser-name').value;
		individual.firstName = document.getElementById('purchaser-firstname').value;
		individual.address = document.getElementById('purchaser-adress').value;
		individual.mail = document.getElementById('purchaser-people-email').value;
		individual.phoneNumber = document.getElementById('purchaser-people-phone').value;
	}

	function setSocietyData(index) {
		company.socialReason = document.getElementById('purchaser-society-name').value;
		company.legalStatus = document.getElementById('purchaser-society-legalstatus').value;
		company.siret = document.getElementById('purchaser-society-siret').value;
		company.capital = document.getElementById('purchaser-society-capital').value;
		company.address = document.getElementById('purchaser-adress').value;
		company.contactName = document.getElementById('purchaser-society-contact-name').value;
		company.contactMail = document.getElementById('purchaser-society-contact-email').value;
		company.contactPhone = document.getElementById('purchaser-society-contact-phone').value;
	}
	function updateCompany(company,index) {
		if(company.name != ""){
			document.getElementById('purchaser-ui-name' + index).innerHTML= company.socialReason;
		}
		if(company.lastName != ""){
			document.getElementById('purchaser-ui-lastname'+ index).innerHTML= company.siret;
		}
		if(company.mail != ""){
			document.getElementById('purchaser-ui-content-mail' +index).innerHTML= company.contactMail;
		}

	}
	function updateIndividual(individual, index) {
		if(individual.name != ""){
			document.getElementById('purchaser-ui-name' + index).innerHTML= individual.name;
		}
		if(individual.lastName!= ""){
			document.getElementById('purchaser-ui-lastname'+ index).innerHTML= individual.firstName;
		}
		if(individual.mail!= ""){
			document.getElementById('purchaser-ui-content-mail' +index).innerHTML= individual.mail;
		}
	}
	function findPurchaser(purchaser) {
	    for (var i = 0; i < purchasers.length; i++) {
	    	if(purchaser._id == purchasers[i]._id) {
	    		return i;
	    	}
		}
	}
	/* function updatePurchaserGrid(){
	//var updatePurchaserName = document.getElementById('purchaser-name');
	updatePurchaserName.textContent = purchaser.firstname?(purchaser.firstname).toLocaleString():null; 
	document.getElementById('purchaser-name').value = purchaser.firstname;
	} */

}());

$(document).ready(function () {
	window.ppmds.home.initHome();
});