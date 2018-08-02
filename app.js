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
    searchInput: "",
    isPanelOpen: true
  },
  mounted: function () {
    var currentPosition;
    // initial map instance
    this.map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 25.0350968, lng: 121.5628179 },
      streetViewControl: false,
      zoom: 16
    });
    // get user current position and recommend bus routes
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        currentPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        // lat,lng to address
        new google.maps.Geocoder().geocode(
          { latLng: currentPosition },
          function (result, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              // generate current position in text
              vm.userCurrentAddress = result[1].formatted_address;
              // get near by bus route
              vm.userCurrentCity = result[5].formatted_address
                .split(" ")
                .shift(); // e.g. Taipei
              vm.userCurrentCity = "Taipei"; ///   for test ///
              axios
                .get(
                  "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/" +
                  vm.userCurrentCity +
                  "?$format=JSON"
                )
                .then(function (res) {
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
                  var elem = document.querySelector(".loading-container");
                  // elem.parentNode.removeChild(elem);
                  elem.style.display = "none";
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
    togglePanel: function () {
      this.isPanelOpen = !this.isPanelOpen;
    },
    clearMap: function () {
      //delete bus
      if (vm.busMarkers.length > 0) {
        vm.busMarkers.forEach(function (bus) {
          bus.setMap(null);
          var index = vm.busMarkers.indexOf(bus);
          vm.busMarkers.slice(index, 1);
        });
      }
      // delete marker
      if (vm.stopMarkers.length > 0) {
        vm.stopMarkers.forEach(function (bus) {
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
    renderDataByCityAndRouteId: function (city, id, uid) {
      this.displayRoutesAndStops(city, id);
      this.displayBusInRealTime(city, id);
      this.getTime(city, id, uid);
    },
    displayRoutesAndStops: function (city, id) {
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
        .then(function (response) {
          let pathAxis = [];
          let tempStops = [];
          response.data[0].Stops.forEach(function (stop, index) {
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
    displayBusInRealTime: function (city, id) {
      var flag = 0;
      setInterval(function () {
        axios
          .get(
            "https://ptx.transportdata.tw/MOTC/v2/Bus/RealTimeByFrequency/City/" +
            city +
            "/" +
            id +
            "?$format=JSON"
          )
          .then(function (res) {
            if (flag != 0) {
              vm.busMarkers.forEach(function (bus) {
                bus.setMap(null);
                var index = vm.busMarkers.indexOf(bus);
                vm.busMarkers.slice(index, 1);
              });
              vm.busMarkers = ''
            }

            res.data.forEach(function (data) {
              let tempMarker = []
              if (data.RouteName.Zh_tw != id)
                return 
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
              busMarker.addListener("click", function () {
                busInfo.open(vm.map, busMarker);
              }); //同步生成infowindow
              tempMarker.push(busMarker);
            });
            vm.busMarkers = tempMarker;
          });
        flag++;
      }, 5000);
    },
    getTime: function (city, id, uid) {
      target = '[data-route-uid="' + uid + '"]';
      document.querySelector(target).firstChild.lastChild.innerHTML =
        '<div class="loading-container"><div class="loading"></div></div>';
      axios
        .get(
          "http://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/" +
          city +
          "/" +
          id +
          "?$format=JSON"
        )
        .then(function (res) {
          var tmp = "";
          res.data.forEach(function (data) {
            let estimateTime = "";
            if (!data.Direction) return;
            if (data.EstimateTime === undefined) {
              estimateTime = "停駛";
            } else if (Math.round(data.EstimateTime / 60) <= "1") {
              estimateTime = "進站中";
            } else {
              estimateTime = Math.round(data.EstimateTime / 60) + "分";
            }
            tmp =
              tmp +
              `<li><p>${
              data.StopName.Zh_tw
              }<span>${estimateTime}</span></p></li>`;
          });
          document.querySelector(target).firstChild.lastChild.innerHTML = tmp;
        });
    },
    displayGo: function (event, city, id, uid) {
      event.stopPropagation(); //prevent event bubbling
      target = '[data-route-uid="' + uid + '"]';
      // tab switch
      document.querySelector(target).firstChild.getElementsByClassName('back')[0].classList.remove('go-or-back-active');
      document.querySelector(target).firstChild.getElementsByClassName('go')[0].classList.add('go-or-back-active');

      document.querySelector(target).firstChild.lastChild.innerHTML =
        '<div class="loading-container"><div class="loading"></div></div>';

      axios
        .get(
          "http://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/" +
          city +
          "/" +
          id +
          "?$format=JSON"
        )
        .then(function (res) {
          var tmp = "";
          res.data.forEach(function (data) {
            let estimateTime = "";
            if (!data.Direction) return;
            if (data.EstimateTime === undefined) {
              estimateTime = "停駛";
            } else if (Math.round(data.EstimateTime / 60) <= "1") {
              estimateTime = "進站中";
            } else {
              estimateTime = Math.round(data.EstimateTime / 60) + "分";
            }
            tmp =
              tmp +
              `<li><p>${
              data.StopName.Zh_tw
              }<span>${estimateTime}</span></p></li>`;
          });

          document.querySelector(target).firstChild.lastChild.innerHTML = tmp;
        });
    },
    displayBack: function (event, city, id, uid) {
      event.stopPropagation();
      target = '[data-route-uid="' + uid + '"]';

      document.querySelector(target).firstChild.getElementsByClassName('go')[0].classList.remove('go-or-back-active');
      document.querySelector(target).firstChild.getElementsByClassName('back')[0].classList.add('go-or-back-active');

      document.querySelector(target).firstChild.lastChild.innerHTML =
        '<div class="loading-container"><div class="loading"></div></div>';
      axios
        .get(
          "http://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/" +
          city +
          "/" +
          id +
          "?$format=JSON"
        )
        .then(function (res) {
          var tmp = "";
          res.data.forEach(function (data) {
            let estimateTime = "";
            if (data.Direction) return;
            if (data.EstimateTime === undefined) {
              estimateTime = "停駛";
            } else if (Math.round(data.EstimateTime / 60) <= "1") {
              estimateTime = "進站中";
            } else {
              estimateTime = Math.round(data.EstimateTime / 60) + "分";
            }
            tmp =
              tmp + `<li><p>${
              data.StopName.Zh_tw
              }<span>${estimateTime}</span></p></li>`;
          });
          document.querySelector(target).firstChild.lastChild.innerHTML = tmp;
        });
    },
    searchRoute: function () {
      document.querySelector(".loading-container").style.display = "block";
      document.querySelector(".recommend-title").style.display = "none";
      // 取得input
      console.log(this.searchInput)
      //搜尋bus
      axios
        .get(
          "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/" + this.userCurrentCity + "/" + this.searchInput + "?$format=JSON"
        ).then(function (res) {
          let recommend = [];
          res.data.forEach(function (data) {
            recommend.push({
              routeUID: data.RouteUID,
              routeCity: vm.userCurrentCity,
              routeName: data.RouteName.Zh_tw,
              departureStopName: data.DepartureStopNameZh,
              destinationStopName: data.DestinationStopNameZh
            });
          })
          // save to global variable
          vm.recommendRoutes = recommend;
        })
      document.querySelector(".loading-container").style.display = "none";
      document.querySelector(".recommend-title").style.display = "block";
    },
    setCity: function (city) {
      var citySelectContainer = document.querySelector('.city-select-container').children
      for (let i = 0; i < citySelectContainer.length; i++) {
        if (citySelectContainer[i].classList.contains('city-select-active')) {
          citySelectContainer[i].classList.remove('city-select-active')
        }
      }
      this.userCurrentCity = city

      if (city == 'Taipei')
        citySelectContainer[0].classList.add('city-select-active')
      else if (city == 'Taoyuan')
        citySelectContainer[1].classList.add('city-select-active')
      else if (city == 'NewTaipei')
        citySelectContainer[2].classList.add('city-select-active')
      else if (city == 'Taichung')
        citySelectContainer[3].classList.add('city-select-active')
      else if (city == 'Tainan')
        citySelectContainer[4].classList.add('city-select-active')
      else
        citySelectContainer[5].classList.add('city-select-active')

    }
  },
  computed: {
    shouldPanelShow: function () {
      return {
        left: this.isPanelOpen ? 0 : "-500px"
      };
    },
    reverseArrow: function () {
      return {
        transform: this.isPanelOpen ? "rotate(360deg)" : "rotate(-180deg)"
      };
    }
  }
});
