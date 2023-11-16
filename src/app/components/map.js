// Import color
import { lulcValuePalette } from './lulc';

// Load map function
export let Map;
export let Features;
export let Basemap;
export let Tile;
export let Point;
export let Grid;
export let Labelled;
export let Agri;
export let AgriPoint;

export default async function initMap(map) {
	await import('../../../node_modules/@geoman-io/leaflet-geoman-free');
	await import('./tile.js');

	// Assign map
	Map = L.map(map, 
		{ 
			center: { lat: -0.9729866, lng: 116.7088379 } ,
			zoom: 5,
		}
	);
	
	Basemap = L.tileLayer('http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}')
		.addTo(Map);

	Tile = L.tileLayer("").addTo(Map);

	Features = L.geoJSON([], { pointToLayer: (feat, coord) => {
		if (feat.properties.validation) {
			return L.circleMarker(coord, { radius: 5, color: 'green' })
		} else {
			return L.circleMarker(coord, { radius: 5 })
		};
	}}).addTo(Map);

	Point = L.geoJSON([], { pointToLayer: (feat, coord) => L.circleMarker(coord, { radius: 5, color: 'yellow' }) })
		.addTo(Map);

	// Labelled sample
	Labelled = L.geoJSON([], { style: feature => {
		return { color: lulcValuePalette[feature.properties.classvalue] };
	} }).addTo(Map);

	// Agriculture sample
	Agri = L.tileLayer('').addTo(Map);

	// Agriculture sleected
	AgriPoint = L.geoJSON([], { pointToLayer: (feat, coord) => L.circleMarker(coord, { radius: 5, color: 'yellow' }) })
		.addTo(Map);

	// Grid for labelling
	Grid = L.geoJSON([], { style: { fillOpacity: 0, color: 'cyan' } }).addTo(Map);

	// Add drawing control
	Map.pm.addControls({
		drawCircleMarker: false,
		drawPolyline: false,
		drawMarker: false,
		drawText: false,
		positions: {
			draw: "topright",
			edit: "topright",
		},
	});
	
	// Hide the button
	if (Map.pm.controlsVisible()) {
		Map.pm.toggleControls();
	};
}