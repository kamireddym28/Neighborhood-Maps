/** Model **/

var locationInfo = [{
    place: 'South Lake Tahoe',
    location: {
      lat: 38.947730,
      lng: -119.966709
    }
  }, {
    place: 'Yosemite National Park',
    location: {
      lat: 37.748670,
      lng: -119.587225
    }
  }, {
    place: 'Sequioa & Kings Canyon',
    location: {
      lat: 36.564721,
      lng: -118.772719
    }
  }, {
    place: 'Death Valley National Park',
    location: {
      lat: 36.450273,
      lng: -116.852463
    }
  }, {
    place: 'Big Sur',
    location: {
      lat: 36.237380,
      lng: -121.770421
    }
  }, {
    place: 'Point Reyes National Seashore',
    location: {
      lat: 37.996512,
      lng: -123.020476
    }
  }];

/** Source -- Udacity Getting Started with APIs course **/

/** Map initialize()**/
var map;
var bounds;
var largeInfowindow;

function initMap() {
        // Constructor creates a new map - only center and zoom are required.
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 37.412308, lng: -121.902329},
          zoom: 13,
          mapTypeControl: false
        });

        largeInfowindow = new google.maps.InfoWindow();
        bounds = new google.maps.LatLngBounds();
        ko.applyBindings(new ViewModel());
}

/** Source -- Udacity JS Design Patterns course **/

var myLocations = function(data) {
  var self = this;
  this.title = data.place;
  this.location = data.location;
  this.visible = ko.observable(true);
  this.address = '';
  this.city_state = '';

  // Client ID and Client Secret obtained by creating an App in Foursquare
  var cID = 'JNZ3MZQGPJC1Q32FMS3DEFWZ0NX4LEK3DS4BYQUXSYLT5FX3';
  var cSecret = 'WHNJKNUS1GAWUG3STYDVOQ2FK0W1VRXMZVYBD1HHJA01IVIU';

/** Source -- http://api.jquery.com/jquery.getjson/ **/

  // JSON request using foursquare API
  var fsquareUrl = 'https://api.foursquare.com/v2/venues/search?ll=' + this.location.lat + ',' + this.location.lng + '&client_id=' + cID + '&client_secret=' + cSecret + '&v=20180222' + '&query=' + this.title;
  $.getJSON(fsquareUrl).done(function(data) {
      var currentVenue = data.response.venues[0];
      self.address = currentVenue.location.formattedAddress[0] ? currentVenue.location.formattedAddress[0] : '';
      self.city_state = currentVenue.location.formattedAddress[1] ? currentVenue.location.formattedAddress[1] : '';
    }).fail(function() {
        alert('Error while retrieving information using Foursquare API');
    });

 /** Source -- Udacity Getting Started with APIs course and google maps JS API documentation**/

  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = makeMarkerIcon('0091ff');

  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = makeMarkerIcon('FFFF24');

  // Create a marker per location, and put into markers array.
  this.marker = new google.maps.Marker({
    position: this.location,
    title: this.title,
    animation: google.maps.Animation.DROP,
    icon: defaultIcon
  });

  // Enabling a marker
  this.highlightMarker = ko.computed(function() {
    var markerShow = this.visible() ? this.marker.setMap(map) : this.marker.setMap(null);
    if(this.visible()) {
        bounds.extend(this.marker.position);
        map.fitBounds(bounds);
    }
    return markerShow;
  },this);


  //setting on click event on marker to open info InfoWindow
  this.marker.addListener('click', function() {
    populateInfoWindow(this, self.address, self.city_state, largeInfowindow);
    markerBounce(this);
    map.panTo(this.position);
  });

  // Two event listeners - one for mouseover, one for mouseout,
  // to change the colors back and forth.
   this.marker.addListener('mouseover', function() {
     this.setIcon(highlightedIcon);
   });

   this.marker.addListener('mouseout', function() {
     this.setIcon(defaultIcon);
   });

   //show info of a particular marker choosen from the list
   this.popMarker = function(location) {
     google.maps.event.trigger(self.marker, 'click');
   };

};

/** Source -- Udacity JS Design Patterns course **/

/** ViewModel **/
var ViewModel = function() {
  var self = this;
  this.locationsList = ko.observableArray([]);
  this.findLocation = ko.observable('');

  //adding choosen locations to locatins array
  locationInfo.forEach(function(locationItem) {
      self.locationsList.push(new myLocations(locationItem));
  });

  /** Source -- http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html **/

  // filtering desired location from the locationList
    this.searchedLoc = ko.computed(function() {
        var filter = self.findLocation().toLowerCase();
        if (filter) {
            return ko.utils.arrayFilter(self.locationsList(), function(locationItem) {
                var placeString = locationItem.title.toLowerCase();
                var foundPlace = placeString.includes(filter);
                locationItem.visible(foundPlace);
				        return foundPlace;
			});
    }
        self.locationsList().forEach(function(locationItem) {
            locationItem.visible(true);
        });
    return self.locationsList();
    }, self);
};

 /** source -- https://stackoverflow.com/questions/7339200/bounce-a-pin-in-google-maps-once**/

// setting animation for marker markerBounce
function markerBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
   marker.setAnimation(google.maps.Animation.BOUNCE);
   setTimeout(function(){marker.setAnimation(null);
   }, 1500);
  }
}

/** Source -- Udacity Getting Started with APIs course and google maps JS API documentation **/

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, address, city_state, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;

    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
    var getStreetView = function (data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
            nearStreetViewLocation, marker.position);
          infowindow.setContent('<h4>' + marker.title + '</h4>'+'<p>'+ address +
                                '<br>'+city_state+'</p>'+
                                '<div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 30
            }
          };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent('<h4>' + marker.title + '</h4>'+'<p>'+ address +
                              '<br>'+city_state+'</p>'+
                              '<div>No Street View Found</div>');
      }
    }
    // Use streetview service to get the closest streetview image within
    // 50 meters of the markers position
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    // Open the infowindow on the correct marker.
    infowindow.open(map, marker);
  }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}

/**Source -- https://www.internetkultur.at/simple-hamburger-drop-down-menu-with-css-and-jquery/ **/

 // Toggle menu button for location list
	this.hamBurger = function() {
	  $('.mylocations').toggleClass('droponclick');
	  $('.button').toggleClass('clicked');
	};

// Handling error while loading map
function onLoadMapsError() {
    alert('Google Maps encounterd an error while loading!');
}
