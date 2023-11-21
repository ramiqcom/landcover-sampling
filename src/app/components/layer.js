import { useEffect, useState } from 'react';
import { Basemap as base, Tile, FeaturesValidation, Features, Point, Agri, Labelled, AgriPoint, Grid } from './map';

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
	const [ roadmapDisabled, setRoadmapDisabled ] = useState(false);
	const [ terrainDisabled, setTerrainDisabled ] = useState(false);
	const [ satelliteDisabled, setSatelliteDisabled ] = useState(true);

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
		imageCheckbox, setImageCheckbox,
    sampleCheckbox, setSampleCheckbox,
    selectedSampleCheckbox, setSelectedSampleCheckbox,
		labelledSampleCheckbox, setLabelledSampleCheckbox,
		selectedMenu,
		agriCheckbox, setAgriCheckbox,
    selectedAgriCheckbox, setSelectedAgriCheckbox,
		agriCheckboxDisabled, setAgriCheckboxDisabled,
		setSampleCheckboxDisabled,
		agriFeatures,
		sampleFeatures
	} = prop;


	// Data opacity
	const [ opacitySelected, setOpacitySelected ] = useState(1);
	const [ opacitySample, setOpacitySample ] = useState(1);
	const [ opacityImage, setOpacityImage ] = useState(1);
	const [ opacityLabelSample, setOpacityLabelSample ] = useState(1);
	
	// Agri data
	const [ opacityAgri, setOpacityAgri ] = useState(1);
	const [ selectedOpacityAgri, setSelectedOpacityAgri ] = useState(1);

	// Layer display
	const [ layerValidationDisplay, setLayerValidationDisplay ] = useState('none');
	const [ layerLabelDisplay, setLayerLabelDisplay ] = useState('none');

	// Useeffect when selected menu change
	useEffect(() => {
		setLayerValidationDisplay('none');
		setLayerLabelDisplay('none');
		
		if (Agri && AgriPoint && FeaturesValidation && Point && Features) {
			AgriPoint.setStyle({ opacity: 0 });
			Agri.setOpacity(0);
			Point.setStyle({ opacity: 0 });
			Features.setStyle({ opacity: 0 });
			FeaturesValidation.setOpacity(0);
		}

		switch (selectedMenu) {
			case 'validation':
			case 'assessment':
				setLayerValidationDisplay('flex');
				Point.setStyle({ opacity: 1 });
				FeaturesValidation.setOpacity(1);
				Features.setStyle({ opacity: 1 });
				break;
			case 'labelling':
				setLayerLabelDisplay('flex');
				AgriPoint.setStyle({ opacity: 1 });
				Agri.setOpacity(1);
				break;
			default:
				setLayerValidationDisplay('none');
				setLayerLabelDisplay('none');
				break
		}
	}, [ selectedMenu ]);

	// Allow to show and hide the agriculture checkbox
	useEffect(() => {
		if (agriFeatures) {
			setAgriCheckboxDisabled(false);
		} else {
			setAgriCheckboxDisabled(true);
		};
	}, [ agriFeatures ]);

	// Allow to show and hide validation sample checkbox
	useEffect(() => {{
		if (sampleFeatures) {
			setSampleCheckboxDisabled(false)
		} else {
			setSampleCheckboxDisabled(true);
		}
	}}, [ sampleFeatures ]);

	return (
		<div className='flexible vertical space'>

			<div className='flexible vertical' style={{ display: layerValidationDisplay }}>
				<div style={{ textAlign: 'center' }}>
					Validation
				</div>

				<div className='flexible start center1' style={{ gap: '0.5vh' }}> 

					<input type='checkbox' checked={selectedSampleCheckbox} disabled={sampleCheckboxDisabled} onChange={e => {
						setSelectedSampleCheckbox(e.target.checked);
						Point.setStyle({ opacity: e.target.checked ? 1 : 0 });
					}}/> 

					<div style={{ border: '3px solid gold', borderRadius: '100%', height: '10px', width: '10px' }}></div>

					<div style={{ flex: 2 }}>
						Selected validation 
					</div>

					<input style={{ flex: 1 }} type='range' min={0} max={1} step={0.01} value={opacitySelected} disabled={sampleCheckboxDisabled} onChange={e => {
						setOpacitySelected(e.target.value);
						Point.setStyle({ opacity: e.target.value });
					}}/>
				</div>

				<div className='flexible start center1' style={{ gap: '0.5vh' }}>

					<input type='checkbox' checked={labelledSampleCheckbox} disabled={sampleCheckboxDisabled} onChange={e => {
						setLabelledSampleCheckbox(e.target.checked);
						Features.eachLayer(layer => layer.setStyle({ opacity: e.target.checked ? 1 : 0}));
					}}/>

					<div style={{ border: '3px solid green', borderRadius: '100%', height: '10px', width: '10px' }}></div>

					<div style={{ flex: 2 }}>
						Labelled validation
					</div>

					<input style={{ flex: 1 }} type='range' min={0} max={1} step={0.01} value={opacityLabelSample} disabled={sampleCheckboxDisabled} onChange={e => {
						setOpacityLabelSample(e.target.value);
						const style = { opacity: e.target.value };
						Features.eachLayer(layer => layer.setStyle(style));
					}}/>
				</div>
					
				<div className='flexible start center1' style={{ gap: '0.5vh' }}>

					<input type='checkbox' checked={sampleCheckbox} disabled={sampleCheckboxDisabled} onChange={e => {
						setSampleCheckbox(e.target.checked);
						FeaturesValidation.setOpacity(e.target.checked ? 1 : 0);
					}}/>

					<div style={{ border: '3px solid blue', borderRadius: '100%', height: '10px', width: '10px' }}></div>

					<div style={{ flex: 2 }}>
						Unlabelled validation
					</div>

					<input style={{ flex: 1 }} type='range' min={0} max={1} step={0.01} value={opacitySample} disabled={sampleCheckboxDisabled} onChange={e => {
						setOpacitySample(e.target.value);
						FeaturesValidation.setOpacity(e.target.value);
					}}/>
				</div>
			</div>

			<div style={{ display: layerLabelDisplay }} className='flexible vertical'>
				<div style={{ textAlign: 'center' }}>
					Labelling
				</div>

				<div className='flexible start center1' style={{ gap: '0.5vh' }}>
					<input type='checkbox' /> 

					<div style={{ flex: 2 }}>
						Drawed label
					</div>

					<input style={{ flex: 1 }} type='range' min={0} max={1} step={0.01} />
				</div>

				<div className='flexible start center1' style={{ gap: '0.5vh' }}>
					<input type='checkbox' disabled={agriCheckboxDisabled} checked={selectedAgriCheckbox} onChange={e => {
						setSelectedAgriCheckbox(e.target.checked)
						AgriPoint.setStyle({ opacity: e.target.checked ? 1 : 0 });
					}}/> 

					<div style={{ border: '3px solid gold', borderRadius: '100%', height: '10px', width: '10px' }}></div>

					<div style={{ flex: 2 }}>
						Selected agriculture sample
					</div>

					<input style={{ flex: 1 }} type='range' min={0} max={1} value={selectedOpacityAgri} onChange={e => {
						setSelectedOpacityAgri(e.target.value);
						AgriPoint.setStyle({ opacity: e.target.value });
					}} step={0.01} />
				</div>

				<div className='flexible start center1' style={{ gap: '0.5vh' }}>
					<input type='checkbox' disabled={agriCheckboxDisabled} checked={agriCheckbox} onChange={e => {
						setAgriCheckbox(e.target.checked)
						Agri.setOpacity(e.target.checked ? 1 : 0);
					}} /> 

					<div style={{ border: '3px solid blue', borderRadius: '100%', height: '10px', width: '10px' }}></div>

					<div style={{ flex: 2 }}>
						Agriculture sample
					</div>

					<input style={{ flex: 1 }} type='range' min={0} max={1} value={opacityAgri} onChange={e => {
						setOpacityAgri(e.target.value);
						Agri.setOpacity(e.target.value);
					}} step={0.01} />
				</div>
			</div>
			
			<div className='flexible vertical'>
				<div style={{ textAlign: 'center' }}>
					Image
				</div>

				<div className='flexible start center1' style={{ gap: '0.5vh' }}> 
					<input type='checkbox' checked={imageCheckbox} disabled={imageCheckboxDisabled} onChange={e => {
						setImageCheckbox(e.target.checked);
						Tile.setOpacity(e.target.checked ? 1 : 0); // Change opacity of the object
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
			
		</div>
	)
}