import { useEffect, useState } from 'react';
import { Basemap as base } from './map';

export default function Layers(){
	return (
		<div id='layers' className="flexible vertical space">
			<div style={{ textAlign: 'center' }}>Basemap</div>
			<Basemap />
			<LayerCheckbox />
		</div>	
	)
}

// Basemap components
function Basemap() {
	const [ mapDisabled, setMapDisabled ] = useState(true);
	const [ satelliteDisabled, setSatelliteDisabled ] = useState(false);

	useEffect(() => {
		if (base) {
			if (satelliteDisabled) {
				base.setUrl('http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}');
			} else {
				base.setUrl('http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}');
			}
		}
	}, [ mapDisabled, satelliteDisabled ]);

	return (
		<div id='basemap' className="flexible space">
			<button className='select-button' disabled={mapDisabled} onClick={() => {
				setMapDisabled(!mapDisabled);
				setSatelliteDisabled(!satelliteDisabled);
			}}>Map</button>
			<button className='select-button' disabled={satelliteDisabled} onClick={() => {
				setMapDisabled(!mapDisabled);
				setSatelliteDisabled(!satelliteDisabled);
			}}>Satellite</button>
		</div>
	)
}

// Layer checkbox
function LayerCheckbox() {
	return (
		<div className='flexible vertical space'>
			<div className='flexible start'> <input type='checkbox' /> Selected sample </div>
			<div className='flexible start'> <input type='checkbox' /> Selected sample </div>
			<div className='flexible start'> <input type='checkbox' /> Selected sample </div>
		</div>
	)
}