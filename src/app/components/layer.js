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

	const [ opacitySelected, setOpacitySelected ] = useState(1);
	const [ opacitySample, setOpacitySample ] = useState(1);
	const [ opacityImage, setOpacityImage ] = useState(1);

	return (
		<div className='flexible vertical'>

			<div style={{ textAlign: 'center' }}>
				Layers list
			</div>

			<div className='flexible start center1'> 
				<input type='checkbox' checked={selectedSampleCheckbox} disabled={selectedSampleCheckboxDisabled} onChange={e => {
					setSelectedSampleCheckbox(e.target.checked);
					e.target.checked ? Point.setStyle({ opacity: 1, fillOpacity: 0.3 }) : Point.setStyle({ opacity: 0, fillOpacity: 0 });
				}}/> 
				
				<div style={{ flex: 2 }}>
					Selected sample 
				</div>

				<input style={{ flex: 1 }} type='range' min={0} max={1} step={0.01} value={opacitySelected} disabled={selectedSampleCheckboxDisabled} onChange={e => {
					setOpacitySelected(e.target.value);
					Point.setStyle({ opacity: e.target.value, fillOpacity: e.target.value - 0.7 < 0 ? 0 : e.target.value - 0.7 });
				}}/>
			</div>

			<div className='flexible start center1'> 
				<input type='checkbox' checked={sampleCheckbox} disabled={sampleCheckboxDisabled} onChange={e => {
					setSampleCheckbox(e.target.checked);
					e.target.checked ? Features.setStyle({ opacity: 1, fillOpacity: 0.3 }) : Features.setStyle({ opacity: 0, fillOpacity: 0 });
				}}/>

				<div style={{ flex: 2 }}>
					Sample
				</div>

				<input style={{ flex: 1 }} type='range' min={0} max={1} step={0.01} value={opacitySample} disabled={sampleCheckboxDisabled} onChange={e => {
					setOpacitySample(e.target.value);
					Features.setStyle({ opacity: e.target.value, fillOpacity: e.target.value - 0.7 < 0 ? 0 : e.target.value - 0.7 });
				}}/>
			</div>

			<div className='flexible start center1'> 
				<input type='checkbox' checked={imageCheckbox} disabled={imageCheckboxDisabled} onChange={e => {
					setImageCheckbox(e.target.checked);
					e.target.checked ? Tile.setOpacity(1) : Tile.setOpacity(0); // Change opacity of the object
				}}/> 

				<div style={{ flex: 2 }}>
					Image
				</div>

				<input style={{ flex: 1 }} type='range' min={0} max={1} step={0.01} value={opacityImage} disabled={imageCheckboxDisabled} onChange={e => {
					setOpacityImage(e.target.value);
					Tile.setOpacity(e.target.value);
				}} />
			</div>
		</div>
	)
}