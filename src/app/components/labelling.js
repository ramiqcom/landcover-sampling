import { useEffect, useState } from "react";
import { Map, Grid, Labelled, Agri, AgriPoint } from "./map";
import { squareGrid, bbox } from "@turf/turf";
import { agriSample, saveAgriSample, loadAgri } from '../server/sampleServer';
import roi from './roi.json' assert { type: 'json' };
import Select from "react-select";
import { toggleFeatures } from "./utilities";

export default function Labelling(props){
	const { 
		labellingDisplay, region, year, username, selectedMenu, setMessage, setMessageColor,
		sampleAgriList, setSampleAgriList 
	} = props;

	// Labelling option
	const [ labelOptions, setLabelOptions ] = useState([
		{ label: 'Land cover', value: 'lc' },
		{ label: 'Agriculture', value: 'agri' }
	]);

	// Labelling disabled
	const [ labellingDisabled, setLabellingDisabled ] = useState(false);

	// Label option
	const [ labelOption, setLabelOption ] = useState(undefined);

	// Lc display optiion
	const [ lcDisplay, setLcDisplay ] = useState('flex');

	// Agri display option
	const [ agriDisplay, setAgriDisplay ] = useState('none');

	// Box features
	const [ grid, setGrid ] = useState(undefined);

	// Box min
	const [ boxMin, setBoxMin ] = useState(undefined);

	// Box max
	const [ boxMax, setBoxMax ] = useState(undefined);

	// Box options
	const [ boxOptions, setBoxOptions ] = useState(undefined);

	// Box choice
	const [ box, setBox ] = useState(undefined);

	// Box feature
	const [ boxFeature, setBoxFeature ] = useState(undefined);

	// Sample select for agriculture
	const [ sampleAgriSet, setSampleAgriSet ] = useState(undefined);

	// List of sample agri
	const [ sampleNumberAgri, setSampleNumberAgri ] = useState(undefined);

	// Agri sample id
	const [ agriSampleId, setAgriSampleId ] = useState(undefined);

	// Selected sample agri
	const [ selectedSampleAgri, setSelectedSampleAgri ] = useState(undefined);

	// Disabled select sample agri
	const [ sampleAgriDisabled, setSampleAgriDisabled ] = useState(true);

	// Agri features
	const [ agriFeatures, setAgriFeatures ] = useState(true);

	// Agri min and max sample
	const [ agriMin, setAgriMin ] = useState(undefined);
	const [ agriMax, setAgriMax ] = useState(undefined);

	// Set current agri category
	const [ agriCategory, setAgriCategory ] = useState(undefined);

	// Agri choices
	const [ agriChoices, setAgriChoices ] = useState([
		{ value: 1, label: 'Agriculture' },
		{ value: 2, label: 'Non-agriculture' }
	]);

	// Agri sample download link
	const [ agriLink, setAgriLink ] = useState(undefined);

	// Function to load sample from cloud
	async function loadSampleAgri({ sampleId }) {
		try {
			// Show sample loading message
			setMessage('Loading sample...');
			setMessageColor('blue');

			// Pause the button
			toggleFeatures(true, [ setSampleAgriDisabled, setLabellingDisabled ]);
			const { features, tile, ok } = await loadAgri({ sampleId });

			if (!ok) {
				setMessage(err.message);
				setMessageColor('red');
				return null;
			};

			// Set Agri parameter
			Agri.setUrl(tile);
			setAgriFeatures(features);
			setAgriMax(features.features.length);
			setAgriMin(0);
			setSelectedSampleAgri({ value: 0, label: 0 });
			setSampleNumberAgri(features.features.map((feat, index) => new Object({ value: index, label: index} )));

			// Hide message
			setMessage(undefined);
			setMessageColor('blue');
		} catch (err) {
			setMessage(err.message);
			setMessageColor('red');
			return null;
		} finally {
			// Enable some button
			toggleFeatures(false, [ setSampleAgriDisabled, setLabellingDisabled ]);
		}		
	};

	// When the box choice is changed, zoom to the location
	useEffect(() => {
		if (box) {
			const selected = grid.features[box.value];
			setBoxFeature(selected);
			Map.fitBounds(L.geoJSON(selected).getBounds(), { maxZoom: 10 });
		}
	}, [ box ]);

	// Use effect when the labelling option change
	useEffect(() => {
		if (Grid && labellingDisplay == 'flex') {
			switch (labelOption.value) {
				case 'lc':
					setLcDisplay('flex');
					setAgriDisplay('none');
					Grid.setStyle({ opacity: 1, fillOpacity: 0 });

					Grid.clearLayers();
					// Create grid
					const bounds = roi[region.value];
					const grid = squareGrid(bbox(bounds), 100, { units: 'kilometers' });
					setGrid(grid);
	
					// Add grid to the map
					Grid.addData(grid);
	
					// Set the box min max
					setBoxMin(0);
					setBoxMax(grid.features.length - 1);
					
					// Set the grid box options
					const boxes = grid.features.map((feat, index) => new Object({ value: index, label: index }));
					setBoxOptions(boxes);
	
					// Zoom to box one if there is no box before
					if (!(box)){
						setBox({ value: 0, label: 0 });
						Map.fitBounds(L.geoJSON(grid.features[0]).getBounds(), { maxZoom: 10 });
					};
					break;
				case 'agri':
					setLcDisplay('none');
					setAgriDisplay('flex');
					Grid.setStyle({ opacity: 0, fillOpacity: 0 });
					break;
				default:
					setLcDisplay('none');
					setAgriDisplay('none');
					Grid.setStyle({ opacity: 0, fillOpacity: 0 });
			}
		}
	}, [ labelOption ]);

	// Show drawing widget if the mode is labelling and land cover
	useEffect(() => {
		if (labelOption) {
			if (selectedMenu == 'labelling' && labelOption.value == 'lc') {
				Map.pm.controlsVisible() ? null : Map.pm.toggleControls();
			} else {
				Map.pm.controlsVisible() ? Map.pm.toggleControls() : null;
			};
		}
	}, [ labelOption, selectedMenu ]);

	// Useeffect to enable agri sample mode
	useEffect(() => {
		if (sampleAgriSet) {
			setSampleAgriDisabled(false);
		} else {
			setSampleAgriDisabled(true);
		};
	}, [ sampleAgriSet ]);

	// Useffect when the selected agri sample changed
	useEffect(() => {
		if (AgriPoint) {
			// Change the selected agri sample
			AgriPoint.clearLayers();

			// Get the selected sample
			const selected = agriFeatures.features.filter((feat, index) => index === selectedSampleAgri.value)[0];

			// Zoom to the sample
			Map.fitBounds(L.geoJSON(selected).getBounds(), { maxZoom: 14 });

			// Add selected agri data
			AgriPoint.addData(selected);

			// Change the land cover data if
			if (selected.properties.agri) {
				const choice = agriChoices[selected.properties.agri - 1];
				setAgriCategory(choice);
			} else {
				setAgriCategory(null);
			};
		}
	}, [ selectedSampleAgri ]);

	// Set download link anytime the agri data change
	useEffect(() => {
		if (agriFeatures) {
			const link = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(agriFeatures))}`;
			setAgriLink(link);
		};
	}, [ agriFeatures ]);

	return (
		<div id="labelling" className='flexible vertical space' style={{ display: labellingDisplay }}>
			<Select 
				options={labelOptions}
				value={labelOption}
				className="select-menu"
				onChange={value => setLabelOption(value)}
				isDisabled={labellingDisabled}
			/>

			<div className="flexible space vertical" style={{ display: lcDisplay }}>
				<div className="flexible space">
					<Select
						options={boxOptions}
						style={{ flex: 4 }}
						value={box}
						className='select-menu'
						onChange={value => setBox(value)}
						isDisabled={labellingDisabled}
					/>

					<button style={{ flex: 1 }} className="button-parameter" disabled={labellingDisabled} onClick={() => {
						if (!(box.value === boxMin)){
							setBox({ value: box.value - 1, label: box.value - 1 });
						}
					}}>{'<'}</button>

					<button style={{ flex: 1 }} className="button-parameter" disabled={labellingDisabled} onClick={() => {
						if (!(box.value === boxMax)){
							setBox({ value: box.value + 1, label: box.value + 1 });
						}
					}}>{'>'}</button>

					<button className="button-parameter material-icons" disabled={labellingDisabled} style={{ flex: 1 }} onClick={() => {
						Map.fitBounds(L.geoJSON(boxFeature).getBounds(), { maxZoom: 10 });
					}}>&#xe0c8;</button>
				</div>
			</div>
			

			<div className="flexible space vertical" style={{ display: agriDisplay }}>
				<button className="button-parameter" disabled={labellingDisabled} onClick={async () => {
					// Set loading
					setMessage('Generating sample...');
					setMessageColor('blue');

					// Disable some button
					toggleFeatures(true, [ setSampleAgriDisabled, setLabellingDisabled ]);

					const time = new Date().getTime();
					const sampleId = `${username}_${labelOption.value}_${region.value}_${year.value}_${time}`;

					const { features, ok, message, tile } = await agriSample({
						region: region.value,
						year: year.value,
						sampleId,
						type: labelOption.value,
						username,
						time
					});

					if (ok) {
						// Set the feature of agri sample
						setAgriSampleId(sampleId);
						setAgriFeatures(features);
						setAgriMax(features.features.length);
						setAgriMin(0);
						setSelectedSampleAgri({ value: 0, label: 0 });
						setSampleNumberAgri(features.features.map((feat, index) => new Object({ value: index, label: index} )));
						
						// Push the options to the sample agri set
						const listOptions = Array.from(sampleAgriList);
						listOptions.push({ value: sampleId, label: sampleId  });
						setSampleAgriList(listOptions);
						setSampleAgriSet({ value: sampleId, label: sampleId });
						
						// Set Agri tile url
						Agri.setUrl(tile);

						// Set loading
						setMessage(undefined);
						setMessageColor('blue');
					} else {
						// Set loading
						setMessage(message);
						setMessageColor('red');
					};

					// Disable some button
					toggleFeatures(false, [ setSampleAgriDisabled, setLabellingDisabled ]);
				}}>Generate sample</button>
				
				<div className="flexible space">
					<Select 
						options={sampleAgriList}
						value={sampleAgriSet}
						isDisabled={labellingDisabled}
						onChange={async value => {
							setSampleAgriSet(value);
							await loadSampleAgri({ sampleId: value.value });
						}}
						placeholder={'Select or generate sample'}
						className="select-menu"
						style={{ flex: 4 }}
					/>
					<button style={{ flex: 1 }} className="button-parameter material-icons" disabled={sampleAgriDisabled} onClick={async () => {
						setMessage('Saving...');
						setMessageColor('blue');

						toggleFeatures(true, [ setSampleAgriDisabled, setLabellingDisabled ]);

						// Save the data to the database
						await saveAgriSample({ features: agriFeatures, time: new Date().getTime(), sampleId: agriSampleId });

						setMessage(undefined);
						setMessageColor('blue');

						toggleFeatures(false, [ setSampleAgriDisabled, setLabellingDisabled ]);
					}}>&#xe161;</button>

					<a className="flexible vertical" href={agriLink} download={`${agriSampleId}.geojson`} disabled={sampleAgriDisabled}>
						<button style={{ flex: 1 }} className="button-parameter material-icons" disabled={sampleAgriDisabled}>&#xe2c4;</button>
					</a>
					
				</div>

				<div className="flexible space">
					
					<Select 
						options={sampleNumberAgri}
						value={selectedSampleAgri}
						onChange={value => setSelectedSampleAgri(value)}
						isDisabled={sampleAgriDisabled}
						className="select-menu"
					/>

					<button className="button-parameter" style={{ flex: 1 }} disabled={sampleAgriDisabled} onClick={() => {
						if (!(selectedSampleAgri.value === agriMin)) {
							setSelectedSampleAgri({ value: selectedSampleAgri.value - 1, label: selectedSampleAgri.value - 1  });
						};
					}}>{'<'}</button>
					<button className="button-parameter" style={{ flex: 1 }} disabled={sampleAgriDisabled} onClick={() => {
						if (!(selectedSampleAgri.value === agriMax)) {
							setSelectedSampleAgri({ value: selectedSampleAgri.value + 1, label: selectedSampleAgri.value + 1  });
						};
					}}>{'>'}</button>

					<button className="button-parameter material-icons" disabled={sampleAgriDisabled} style={{ flex: 1 }} onClick={() => {
						Map.fitBounds(AgriPoint.getBounds());
					}}>&#xe0c8;</button>

				</div>

				<Select 
					options={agriChoices}
					placeholder={'Select category'}
					value={agriCategory}
					onChange={async value => {
						setAgriCategory(value);

						// Create new data when lc data change
						const newSample = agriFeatures.features.map((feat, index) => {
							if (index === selectedSampleAgri.value){
								feat.properties.agri = value.value;
							};
							return feat
						});

						// Set the new data
						const newFeatures = new Object(agriFeatures);
						newFeatures.features = newSample;
						setAgriFeatures(newFeatures);

						// Save the data to the database
						await saveAgriSample({ features: newFeatures, time: new Date().getTime(), sampleId: agriSampleId });
					}}
					isDisabled={sampleAgriDisabled}
					className="select-menu"
				/>

			</div>

		</div>
	);
}