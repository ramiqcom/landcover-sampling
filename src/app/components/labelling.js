import { useEffect, useState, useContext } from "react";
import { Map, Grid, Labelled, Agri, AgriPoint } from "./map";
import { squareGrid, bbox } from "@turf/turf";
import { agriSample, saveAgriSample, loadAgri, deleteAgri } from '../server/sampleServer';
import roi from './roi.json' assert { type: 'json' };
import Select from "react-select";
import { toggleFeatures } from "./utilities";
import { Context } from "../page";

export default function Labelling(){
	const { 
		labellingDisplay, region, year, username, selectedMenu, setMessage, setMessageColor,
		sampleAgriList, setSampleAgriList,
		agriFeatures, setAgriFeatures
	} = useContext(Context);

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

	// Agri min and max sample
	const [ agriMin, setAgriMin ] = useState(undefined);
	const [ agriMax, setAgriMax ] = useState(undefined);

	// Set current agri category
	const [ agriCategory, setAgriCategory ] = useState(undefined);

	// Sample size agriculture
	const [ agriSize, setAgriSize ] = useState(5000);

	// Agri choices
	const [ agriChoices, setAgriChoices ] = useState([
		{ value: 1, label: 'Agriculture' },
		{ value: 2, label: 'Non-agriculture' }
	]);

	// Agri sample download link
	const [ agriLink, setAgriLink ] = useState(undefined);

	// When the box choice is changed, zoom to the location
	useEffect(() => {
		if (box) {
			const selected = grid.features[box.value];
			setBoxFeature(selected);
			Map.fitBounds(L.geoJSON(selected).getBounds(), { maxZoom: 10 });
		}
	}, [ box ]);

	// Show drawing widget if the mode is labelling and land cover
	useEffect(() => {		
		if (Grid && labelOption) {
			if (selectedMenu === 'labelling') {
				if (labelOption.value === 'lc'){
					Map.pm.controlsVisible() ? null : Map.pm.toggleControls();
					
					setAgriDisplay('none');
					setLcDisplay('flex');
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
				}

				if (labelOption.value === 'agri') {
					setAgriDisplay('flex');
					setLcDisplay('none');
					Grid.setStyle({ opacity: 0, fillOpacity: 0 });
					Map.pm.controlsVisible() ? Map.pm.toggleControls() : null;
				}
	
			} else {
				setLcDisplay('none');
				setAgriDisplay('none');
				Grid.setStyle({ opacity: 0, fillOpacity: 0 });
				Map.pm.controlsVisible() ? Map.pm.toggleControls() : null;		
			}	
		}
	}, [ labelOption, selectedMenu ]);

	// Useeffect to enable agri sample mode
	useEffect(() => {
		if (sampleAgriSet) {
			setAgriSampleId(sampleAgriSet.value);
		}
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

	/**
	 * Function to change the sample of agri data
	 * @param {{ label: string, value: string}} value 
	 * @returns
	 */
	async function setAgriSample(value) {
		try {
			// Set the agri sample set
			setSampleAgriSet(value);

			// Show sample loading message
			setMessage('Loading sample...');
			setMessageColor('blue');
	
			// Pause the button
			toggleFeatures(true, [ setSampleAgriDisabled, setLabellingDisabled ]);
			const { features, tile, ok, message, selectedSample } = await loadAgri({ sampleId: value.value });
	
			if (!ok) {
				throw new Error(message);
			};
	
			// Set Agri parameter
			Agri.setUrl(tile);	
			setAgriFeatures(features);
			setAgriMax(features.features.length - 1);
			setAgriMin(0);
			setSampleNumberAgri(features.features.map((feat, index) => new Object({ value: index, label: index} )));
	
			// Set the current sample
			if (selectedSample) {
				setSelectedSampleAgri({ value: selectedSample, label: selectedSample });
			} else {
				setSelectedSampleAgri({ value: 0, label: 0 });
			}
	
			// Hide message
			setMessage('Sample loaded');
			setMessageColor('green');
		} catch (err) {
			setMessage(err.message);
			setMessageColor('red');
			return null;
		} finally {
			// Enable some button
			toggleFeatures(false, [ setSampleAgriDisabled, setLabellingDisabled ]);
		}
	}

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
				<div className="flexible space">
					<input type="number" max={5000} min={1} placeholder={'1 - 5000'} style={{ width: '40%' }} value={agriSize} onInput={e => {
						let value = e.target.value;

						if (value > 5000) {
							value = 5000
						} else if (value < 1) {
							value = 1
						}

						setAgriSize(value);
					}} />

					<button className="button-parameter" disabled={labellingDisabled} style={{ width: '60%' }} onClick={async () => {
						try {
							// Set loading
							setMessage('Generating sample...');
							setMessageColor('blue');

							// Disable some button
							toggleFeatures(true, [ setSampleAgriDisabled, setLabellingDisabled ]);

							const time = new Date().getTime();
							const sampleId = `${username}_${labelOption.value}_${region.value}_${year.value}_${time}`;

							const { features, ok, message, tile, selectedSample } = await agriSample({
								region: region.value,
								year: year.value,
								sampleId,
								type: labelOption.value,
								username,
								time,
								size: agriSize
							});

							if (!ok) {
								throw new Error(message);
							}

							// Set the feature of agri sample
							setAgriFeatures(features);
							setAgriMax(features.features.length - 1);
							setAgriMin(0);
							setSampleNumberAgri(features.features.map((feat, index) => new Object({ value: index, label: index} )));''

							// Set the current sample
							if (selectedSample) {
								setSelectedSampleAgri({ value: selectedSample, label: selectedSample });
							} else {
								setSelectedSampleAgri({ value: 0, label: 0 });
							}
							
							// Push the options to the sample agri set
							const listOptions = Array.from(sampleAgriList);
							listOptions.push({ value: sampleId, label: sampleId  });
							setSampleAgriList(listOptions);
							setSampleAgriSet({ value: sampleId, label: sampleId });
							
							// Set Agri tile url
							Agri.setUrl(tile);

							// Set loading
							setMessage('Sample generated');
							setMessageColor('green');
						} catch (error) {
							// Set loading
							setMessage(message);
							setMessageColor('red');
						} finally {
							// Disable some button
							toggleFeatures(false, [ setSampleAgriDisabled, setLabellingDisabled ]);
						}
					}}>Generate sample</button>
				</div>
				
				<div className="flexible space">
					<Select 
						options={sampleAgriList}
						value={sampleAgriSet}
						isDisabled={labellingDisabled}
						onChange={async value => {
							await setAgriSample(value);
						}}
						placeholder={'Select or generate sample'}
						className="select-menu"
						style={{ flex: 4 }}
					/>
					<button style={{ flex: 1 }} className="button-parameter material-icons" disabled={sampleAgriDisabled} onClick={async () => {
						try {
							setMessage('Saving...');
							setMessageColor('blue');

							toggleFeatures(true, [ setSampleAgriDisabled, setLabellingDisabled ]);

							// Set the new data
							const features = new Object(agriFeatures);
							features.properties = {
								region: region.value,
								year: year.value,
								selectedSample: selectedSampleAgri.value,
								sampleId: agriSampleId,
								sampleName: agriSampleId
							}

							// Save the data to the database
							const { ok, message } = await saveAgriSample({ features, time: new Date().getTime(), sampleId: agriSampleId });

							// If the process is not okay
							if (!ok) {
								throw new Error(message);
							}

							setMessage('Sample saved');
							setMessageColor('green');
						} catch (error) {
							setMessage(error.message);
							setMessageColor('red');
						} finally {
							toggleFeatures(false, [ setSampleAgriDisabled, setLabellingDisabled ]);
						}						
					}}>&#xe161;</button>

					<button className="button-parameter material-icons" disabled={sampleAgriDisabled} style={{ flex: 1 }} onClick={async () => {
						try {
							// Disable option first
							toggleFeatures(true, [ setSampleAgriDisabled, setLabellingDisabled ]);

							// Set message
							setMessage('Deleting sample');
							setMessageColor('blue');
							
							// Filter the sample list to only the one not deleted
							const newList = sampleAgriList.filter(obj => obj !== sampleAgriSet);

							// Change the sample to the first on the on the list
							await setAgriSample(newList[0]);

							// Set the new sample list without the deleted one
							setSampleAgriList(newList);
							
							// try to delete the sample from the server
							const { ok, message } = await deleteAgri({ sampleId: sampleAgriSet.value });

							// Throw error if failed
							if (!ok) {
								throw new Error(message);
							}

							// If ok then say it is okay
							setMessage('Sample deleted');
							setMessageColor('green');
						} catch (error) {
							setMessage(error.message);
							setMessageColor('red');
						} finally {
							toggleFeatures(false, [ setSampleAgriDisabled, setLabellingDisabled ]);
						}
					}}>
						&#xe872;
					</button>

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

						// Try to save the sample
						try {
							// Create new data when lc data change
							const newSample = agriFeatures.features.map((feat, index) => {
								if (index === selectedSampleAgri.value){
									feat.properties.agri = value.value;
								};
								return feat
							});

							// Set the new data
							const features = new Object(agriFeatures);
							features.properties = {
								region: region.value,
								year: year.value,
								selectedSample: selectedSampleAgri.value,
								sampleId: agriSampleId,
								sampleName: agriSampleId
							};

							// save the data
							setAgriFeatures(features);

							// Save the data to the database
							const { ok, message } = await saveAgriSample({ features, time: new Date().getTime(), sampleId: agriSampleId });

							// Send message if the saved is failed
							if (!ok) {
								throw new Error(message);
							}
						} catch (error) {
							setMessage(error.message);
							setMessageColor('red');
						}
					}}
					isDisabled={sampleAgriDisabled}
					className="select-menu"
				/>

			</div>

		</div>
	);
}