var busMarkers = [];
var app = new Vue({
    el: '#app',
    data: {
        isPanelOpen: false,
    },
    mounted: function () {
        // 地圖初始化
        const map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: 25.0350968,
                lng: 121.5628179
            },
            streetViewControl: false,
            zoom: 15
        })

        // 取得公車即時位置後 每5秒刷新
        refreshBusData()
            .then(function () {
                setInterval(function () {
                    clearAllBusMarkers();
                    refreshBusData();
                }, 5000);
            });
        // 畫路線和站牌
        axios.get('https://ptx.transportdata.tw/MOTC/v2/Bus/DisplayStopOfRoute/City/Taipei/307?$top=30&$format=JSON')
            .then(function (res) {
                var axis307 = [];
                let allStops = res.data[0].Stops;

                allStops.forEach(function (data) {
                    var infowindow = new google.maps.InfoWindow({
                        content: data.StopName.Zh_tw + '站'
                    })
                    var busStop307 = new google.maps.Marker({
                        position: {
                            lat: data.StopPosition.PositionLat,
                            lng: data.StopPosition.PositionLon
                        },
                        map: map,
                        title: data.StopName.Zh_tw,
                        icon: "https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png"
                    })
                    busStop307.addListener('click', function () {
                        infowindow.open(map, busStop307)
                    })

                    axis307.push({
                        lat: data.StopPosition.PositionLat,
                        lng: data.StopPosition.PositionLon
                    })
                })
                new google.maps.Polyline({
                    path: axis307,
                    geodesic: true,
                    strokeColor: '#ff0000',
                    strokeOpacity: 1,
                    strkoeWeight: 3
                }).setMap(map)
            })

        // 取得使用者位置
        const userPositionInfoWindow = new google.maps.InfoWindow();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                userPositionInfoWindow.setPosition(pos);
                userPositionInfoWindow.setContent('您的所在位置');
                userPositionInfoWindow.open(map);
                map.setCenter(pos);
            }, function () {
                handleLocationError(true, userPositionInfoWindow, map.getCenter());
            });
        } else {
            // Browser doesn't support Geolocation
            handleLocationError(false, userPositionInfoWindow, map.getCenter());
        }

        function handleLocationError(browserHasGeolocation, userPositionInfoWindow, pos) {
            userPositionInfoWindow.setPosition(pos);
            userPositionInfoWindow.setContent(browserHasGeolocation ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation.');
            userPositionInfoWindow.open(map);
        }

        function refreshBusData() {
            axios.get('https://ptx.transportdata.tw/MOTC/v2/Bus/RealTimeByFrequency/City/Taipei/307?$top=30&$format=JSON')
                .then(function (res) {
                    res.data.forEach(function (data) {
                        // BUS 實體
                        let DirectionInText = data.Direction ? '去程' : '返程'

                        var busMarker = new google.maps.Marker({
                            position: {
                                lat: data.BusPosition.PositionLat,
                                lng: data.BusPosition.PositionLon
                            },
                            map: map,
                            icon: "https://png.icons8.com/metro/26/000000/bus.png"
                        })
                        var busInfo = new google.maps.InfoWindow({
                            content: `路線 : ${data.RouteName.Zh_tw}\n車牌號碼 :${data.PlateNumb}\n方向 : ${DirectionInText}\n`
                        })
                        busMarker.addListener('click', function () {
                            busInfo.open(map, busMarker)
                        }) //同步生成infowindow
                        busMarkers.push(busMarker);
                    })
                })

        }

        function clearAllBusMarkers() {
            if (busMarkers.length > 0) {
                busMarkers.forEach(function (bus) {
                    bus.setMap(null);
                    var index = busMarkers.indexOf(bus);
                    busMarkers.slice(index, 1);
                });
            }
        }
    },
    methods: {

        togglePanel: function () {
            this.isPanelOpen = !this.isPanelOpen;
        },
        drawBusRouteByLineId: function () {}
    },
    computed: {
        shouldPanelShow: function () {
            return {
                left: this.isPanelOpen ? 0 : '-33%'
            };
        }
    }
});