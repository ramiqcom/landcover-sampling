// Load map function
export let Map;
export let Features;
export let Basemap;
export let Tile;
export let Point;

export default function initMap(map) {
	// Assign map
	Map = L.map(map, 
		{ 
			center: { lat: -0.9729866, lng: 116.7088379 } ,
			zoom: 5,
		}
	);
	
	Basemap = L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}')
		.addTo(Map);

	Tile = L.tileLayer("").addTo(Map);

	Features = L.geoJSON([], { pointToLayer: (feat, coord) => L.circleMarker(coord, { radius: 5 }) } ).addTo(Map);

	Point = L.geoJSON([], { pointToLayer: (feat, coord) => L.circleMarker(coord, { radius: 5, color: 'yellow' }) }).addTo(Map);
}