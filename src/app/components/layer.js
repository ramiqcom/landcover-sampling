import { useEffect, useState } from 'react';
import { Basemap as base, Tile, Features, Point } from './map';

export default function Layers(prop){
	return (
		<div id='layers' className="flexible vertical space">
			<Basemap />
			<LayerCheckbox {...prop} />
		</div>	
	)
}

// Basemap components
function Basemap() {
	const [ roadmapDisabled, setRoadmapDisabled ] = useState(true);
	const [ terrainDisabled, setTerrainDisabled ] = useState(false);
	const [ satelliteDisabled, setSatelliteDisabled ] = useState(false);

	const basemaps= [ roadmapDisabled, terrainDisabled, satelliteDisabled ];

	const xyzTiles = [
		'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', 
		'http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}',
		'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'
	];

	useEffect(() => {
		if (base) {
			basemaps.map((value, index) => {
				value ? base.setUrl(xyzTiles[index]) : null;
			});
		}
	}, [ roadmapDisabled, satelliteDisabled ]);

	return (
		<div id='basemap' className="flexible vertical space">

			<div style={{ textAlign: 'center' }}>Basemap</div>

			<div className='flexible'>
				<button className='select-button' disabled={roadmapDisabled} onClick={() => {
					setRoadmapDisabled(!roadmapDisabled);
					setTerrainDisabled(roadmapDisabled);
					setSatelliteDisabled(roadmapDisabled);
				}}>Roadmap</button>

				<button className='select-button' disabled={terrainDisabled} onClick={() => {
					setRoadmapDisabled(terrainDisabled);
					setTerrainDisabled(!terrainDisabled);
					setSatelliteDisabled(terrainDisabled);
				}}>Terrain</button>

				<button className='select-button' disabled={satelliteDisabled} onClick={() => {
					setRoadmapDisabled(satelliteDisabled);
					setTerrainDisabled(satelliteDisabled);
					setSatelliteDisabled(!satelliteDisabled);
				}}>Satellite</button>
			</div>
			
		</div>
	)
}

// Layer checkbox
function LayerCheckbox(prop) {
	const {
		imageCheckboxDisabled,
    sampleCheckboxDisabled,
    selectedSampleCheckboxDisabled,
		imageCheckbox, setImageCheckbox,
    sampleCheckbox, setSampleCheckbox,
    selectedSampleCheckbox, setSelectedSampleCheckbox,
	} = prop;

	// Hide feature if the checkbox change
	useEffect(() => {
		if (Tile && Features && Point) {
			// List of features in the map to show and hide
			const mapObjects = [ Tile, Features, Point ];

			// Map over the checkbox value
			[ imageCheckbox, sampleCheckbox, selectedSampleCheckbox ].map((check, index) => {
				if (index === 0) {
					check ? mapObjects[index].options.opacity = 1 : mapObjects[index].options.opacity = 0; // Change opacity of the object
					mapObjects[index].redraw() // Redraw if it is a tile
				} else {
					check ? mapObjects[index].setStyle({ opacity: 1 }) : mapObjects[index].setStyle({ opacity: 0 });
				}				
			});
		}
	}, [ imageCheckbox, sampleCheckbox, selectedSampleCheckbox ]);

	return (
		<div className='flexible vertical'>

			<div style={{ textAlign: 'center' }}>
				Layers list
			</div>

			<div className='flexible start center1'> 
				<input type='checkbox' checked={selectedSampleCheckbox} disabled={selectedSampleCheckboxDisabled} onChange={e => {
					setSelectedSampleCheckbox(e.target.checked);
				}}/> 
				Selected sample 
			</div>

			<div className='flexible start center1'> 
				<input type='checkbox' checked={sampleCheckbox} disabled={sampleCheckboxDisabled} onChange={e => {
					setSampleCheckbox(e.target.checked);
				}}/> 
				Sample 
			</div>

			<div className='flexible start center1'> 
				<input type='checkbox' checked={imageCheckbox} disabled={imageCheckboxDisabled} onChange={e => {
					setImageCheckbox(e.target.checked);
				}}/> 
				Image 
			</div>
		</div>
	)
}