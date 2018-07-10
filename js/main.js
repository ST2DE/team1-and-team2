var vm = new Vue({
  el: "#app",
  data: {
    map,
    userCurrentPosition: "",
    userCurrentAddress: "",
    userCurrentCity: "",
    busMarkers: [],
    stopMarkers: [],
    busRouteLine: "",
    recommendRoutes: [],
    isPanelOpen: true
  },
  mounted: function() {
    var currentPosition;
    // initial map instance
    this.map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 25.0350968, lng: 121.5628179 },
      streetViewControl: false,
      zoom: 16
    });
    // get user current position and recommend bus routes
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        currentPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        // lat,lng to address
        new google.maps.Geocoder().geocode(
          { latLng: currentPosition },
          function(result, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              // generate current position in text
              vm.userCurrentAddress = result[1].formatted_address;
              // get near by bus route
              vm.userCurrentCity = result[5].formatted_address
                .split(" ")
                .shift(); // e.g. Taipei
              axios
                .get(
                  "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/" +
                    vm.userCurrentCity +
                    "?$format=JSON"
                )
                .then(function(res) {
                  let recommend = [];
                  // pick 3 routes ramdomly
                  for (let i = 0; i < 5; i++) {
                    let busRoute =
                      res.data[
                        Math.floor(Math.random() * (res.data.length - 1))
                      ]; // get a ramdom index between 0 ~ length-1
                    recommend.push({
                      routeUID: busRoute.RouteUID,
                      routeCity: vm.userCurrentCity,
                      routeName: busRoute.RouteName.Zh_tw,
                      departureStopName: busRoute.DepartureStopNameZh,
                      destinationStopName: busRoute.DestinationStopNameZh
                    });
                  }
                  // save to global variable
                  vm.recommendRoutes = recommend;
                  vm.userCurrentPosition = currentPosition;

                  vm.map.setCenter(currentPosition);
                });
            } else {
              console.log("定位失敗");
            }
          }
        );
      });
    }
  },
  methods: {
    togglePanel: function() {
      this.isPanelOpen = !this.isPanelOpen;
    },
    clearMap: function() {
      //delete bus
      if (vm.busMarkers.length > 0) {
        vm.busMarkers.forEach(function(bus) {
          bus.setMap(null);
          var index = vm.busMarkers.indexOf(bus);
          vm.busMarkers.slice(index, 1);
        });
      }
      // delete marker
      if (vm.stopMarkers.length > 0) {
        vm.stopMarkers.forEach(function(bus) {
          bus.setMap(null);
          var index = vm.stopMarkers.indexOf(bus);
          vm.stopMarkers.slice(index, 1);
        });
      }
      //delete route line
      if (vm.busRouteLine) {
        vm.busRouteLine.setMap(null);
        vm.busRouteLine = "";
      }
    },
    renderDataByCityAndRouteId: function(city, id) {
      this.displayRoutesAndStops(city, id);
      this.displayBusInRealTime(city, id);
    },
    displayRoutesAndStops: function(city, id) {
      if (vm.stopMarkers) {
        this.clearMap();
        vm.stopMarkers = "";
      }
      axios
        .get(
          "http://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/" +
            city +
            "/" +
            id +
            "?$format=JSON"
        )
        .then(function(response) {
          let pathAxis = [];
          let tempStops = [];
          response.data[0].Stops.forEach(function(stop, index) {
            // 路線
            pathAxis.push({
              lat: stop.StopPosition.PositionLat,
              lng: stop.StopPosition.PositionLon
            });
            // 站牌
            var stopMarker = new google.maps.Marker({
              position: {
                lat: stop.StopPosition.PositionLat,
                lng: stop.StopPosition.PositionLon
              },
              map: vm.map,
              title: stop.StopName.Zh_tw,
              icon:
                "https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png"
            });
            tempStops.push(stopMarker);
          });
          vm.stopMarkers = tempStops;

          // 畫線
          vm.busRouteLine = new google.maps.Polyline({
            path: pathAxis,
            geodesic: true,
            strokeColor: "#ff0000",
            strokeOpacity: 1,
            strkoeWeight: 3
          });
          vm.busRouteLine.setMap(vm.map);
          vm.map.setCenter(pathAxis[10]);
        });
    },
    displayBusInRealTime: function(city, id) {
      var tempMarker = [];
      axios
        .get(
          "https://ptx.transportdata.tw/MOTC/v2/Bus/RealTimeByFrequency/City/" +
            city +
            "/" +
            id +
            "?$top=30&$format=JSON"
        )
        .then(function(res) {
          res.data.forEach(function(data) {
            // BUS 實體
            let DirectionInText = data.Direction ? "去程" : "返程";

            var busMarker = new google.maps.Marker({
              position: {
                lat: data.BusPosition.PositionLat,
                lng: data.BusPosition.PositionLon
              },
              map: vm.map,
              icon: "https://png.icons8.com/metro/26/000000/bus.png"
            });
            var busInfo = new google.maps.InfoWindow({
              content: `路線 : ${data.RouteName.Zh_tw}\n車牌號碼 :${
                data.PlateNumb
              }\n方向 : ${DirectionInText}\n`
            });
            busMarker.addListener("click", function() {
              busInfo.open(vm.map, busMarker);
            }); //同步生成infowindow
            tempMarker.push(busMarker);
          });
          vm.busMarkers = tempMarker;
        });
    }
  },
  computed: {
    shouldPanelShow: function() {
      return {
        left: this.isPanelOpen ? 0 : "-33%"
      };
    },
    reverseArrow: function() {
      return {
        transform: this.isPanelOpen ? "rotate(360deg)" : "rotate(-180deg)"
      };
    }
  }
});
