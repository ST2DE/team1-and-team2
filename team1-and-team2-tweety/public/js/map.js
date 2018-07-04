mapboxgl.accessToken = 'pk.eyJ1IjoieXV3ZWl3ZWkiLCJhIjoiY2ppZzFhY2dqMGF6dzNrbDNhZWxiNm84MCJ9.s8oob6bbZP6J4IvD0CBEHw';
var map = new mapboxgl.Map({
    container: 'map',
    center: [121.25139, 24.9726371],
    zoom: 13,
    style: 'mapbox://styles/mapbox/streets-v9',
    hash: true,
    transformRequest: (url, resourceType) => {
        if (resourceType == 'Source' && url.startsWith('http://myHost')) {
            return {
                url: url.replace('http', 'https'),
                headers: {
                    'my-custom-header': true
                },
                credentials: 'include' // Include cookies for cross-origin requests
            }
        }
    }
});