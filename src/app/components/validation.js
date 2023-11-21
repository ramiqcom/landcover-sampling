// Import packages
import { useState, useEffect } from "react";
import Select from 'react-select';
import { toggleFeatures } from "./utilities";
import { lulcLabel, lulcValue, lulcValueLabel } from './lulc';
import { createSample, loadSample, updateSample, updateSampleName, deleteSample } from '../server/sampleServer';
import { Map, Features, Point, FeaturesValidation } from "./map";

// Validation components
export default function Validation(props){
	const { 
		samplingDisplay,
		year, region,
		username,
		setMessage, setMessageColor,
		setRegionYearDisabled,
		sampleGenerationDisabled, setSampleGenerationDisabled,
		sampleSelectionDisabled, setSampleSelectionDisabled,
		sampleSet, setSampleSet,
		sampleFeatures, setSampleFeatures,
		sampleId, setSampleId,
		selectedSample, setSelectedSample,
		selectedSampleSet, setSelectedSampleSet,
		sampleList, setSampleList,
	} = props;

	const [ sampleSize, setSampleSize ] = useState(10);
	const [ selectedSampleFeatures, setSelectedSampleFeatures ] = useState(undefined);
	const [ sampleName, setSampleName ] = useState(undefined);
	const [ minSample, setMinSample ] = useState(undefined);
	const [ maxSample, setMaxSample ] = useState(undefined);

	// LC options
	const lcOptions = lulcLabel.map((label, i) => new Object({ label: label, value: lulcValue[i] }));
	const [ lcSelect, setLcSelect ] = useState(undefined);

	// Sample link for download
	const [ sampleLink, setSampleLink ] = useState(undefined);

	// Do something when the sample set changed
	useEffect(() => {
		if (selectedSampleSet) {
			// Set the sample name and id
			setSampleName(selectedSampleSet.label);
			setSampleId(selectedSampleSet.value);
		}
	}, [ selectedSampleSet ]);

	// Do something and selected sample change
	useEffect(() => {
		if (selectedSample) {
			// Turn on the button
			toggleFeatures(false, [ setSampleSelectionDisabled ]);

			// Change the selected sample
			const selected = changePointSample(sampleFeatures, selectedSample.value, setSelectedSampleFeatures);

			// Set the land cover choice
			if (selected.properties.validation){
				setLcSelect({ value: selected.properties.validation, label: lulcValueLabel[selected.properties.validation] })
			} else {
				setLcSelect(null);
			};
			
		} else {
			toggleFeatures(true, [ setSampleSelectionDisabled ]);
		};
	}, [ selectedSample ]);

	// Change the Features if it changed
	useEffect(() => {
		if (Features) {
			// Change the current sample in the map
			Features.clearLayers();
			Features.addData(sampleFeatures);

			// Set features sample link
			const link = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sampleFeatures))}`;
			setSampleLink(link);
		}
	}, [ sampleFeatures ]);

	return (
		<div id='validation' className='flexible vertical space' style={{ display: samplingDisplay }}>
			
			<div className='menu flexible fill-vertical space'>

				<div style={{ flex: 2 }}>
					Sample per class
				</div>

				<input style={{ flex: 1 }} min={1} max={100} disabled={sampleGenerationDisabled} type='number' value={sampleSize} onChange={e => setSampleSize(e.target.value) }/>

				<button className='button-parameter' disabled={sampleGenerationDisabled} style={{ flex: 1 }}  onClick={async () => {
					try {
						// Disable button
						toggleFeatures(true, [
							setSampleGenerationDisabled,
							setSampleSelectionDisabled,
							setRegionYearDisabled,
						]);

						// Set message
						setMessage('Generating sample...');
						setMessageColor('blue');

						// Time
						const time = new Date().getTime();
						
						// Generate sample set id
						const id = `${username}_${region.value}_${year.value}_${time}`;

						// Generate sampel from earth engine
						const { features, ok, message, tile, selectedSample } = await createSample({ year: year.value, region: region.value, sampleSize, sampleId: id, username, time });

						// Check if the process is success
						if (!ok) {
							throw new Error(message);
						}

						// Set the validation features sample point
						FeaturesValidation.setUrl(tile);

						// Set the new sample features
						setSampleFeatures(features);

						// Samples list
						const sampleList = features.features.map((feat, index) => new Object({ value: index, label: index }));
						setSampleList(sampleList);
						setSelectedSample(sampleList[0]);

						// Set max and min sample
						const sampleIdSort = sampleList.map((feat, index) => index);
						setMinSample(sampleIdSort[0]);
						setMaxSample(sampleIdSort[sampleIdSort.length - 1]);

						// New sample option
						const option = { value: id, label: id };

						// Add the option to sample set selection
						pushOption(sampleSet, setSampleSet, option, 'add');

						// Select the option
						setSelectedSampleSet(option);

						// Selected
						setSelectedSample({ value: selectedSample, label: selectedSample });

						// Delete message
						setMessage(undefined);
					} catch (error) {
						setMessage(error.message);
						setMessageColor('red');
					} finally {
						// Enable button again
						toggleFeatures(false, [
							setSampleGenerationDisabled,
							setSampleSelectionDisabled,
							setRegionYearDisabled,
						]);
					}
				}}>Generate</button>
			</div>

			<div style={{ height: '0.5px', width: '100%', backgroundColor: '#F9F5F0' }}></div>
			
			<div className='flexible space fill-vertical'>

				<Select 
					options={sampleSet}
					value={selectedSampleSet}
					onChange={async value => {
						// Set the sleected sample
						setSelectedSampleSet(value);

						// Try to load and change the sample
						try {
							// Set message
							setMessage('Loading sample...');
							setMessageColor('blue');

							// Disabled button until the operation is done
							toggleFeatures(true, [ setSampleSelectionDisabled ]);

							// Load the sample from the server
							const { features, ok, message, tile, selectedSample } = await loadSample({ sampleId: value.value });

							// If the result is not okay throw error
							if (!ok) {
								throw new Error(message);
							}

							// Set the validation features sample point
							FeaturesValidation.setUrl(tile);

							// Set main samples
							setSampleFeatures(features);

							// Samples list
							const sampleList = features.features.map((feat, index) => new Object({ value: index, label: index }));
							setSampleList(sampleList);
							setSelectedSample(sampleList[0]);

							// Set max and min sample
							const sampleIdSort = sampleList.map((feat, index) => index);
							setMinSample(sampleIdSort[0]);
							setMaxSample(sampleIdSort[sampleIdSort.length - 1]);

							// Set loading to null again
							setMessage(undefined);

							// Selected
							if (selectedSample) {
								setSelectedSample({ value: selectedSample, label: selectedSample });
							} else {
								setSelectedSample({ value: 0, label: 0 });
							}
						} catch (error) {
							// Set message
							setMessage(error.message);
							setMessageColor('red');
						} finally {
							// Activate button again
							toggleFeatures(false, [ setSampleSelectionDisabled ]);
						}
					}}
					className='select-menu'
					styles={ { flex: 3 } }
					isDisabled={sampleGenerationDisabled}
					placeholder={'Generate or select a sample'}
				/>

				<button className="button-parameter" style={{ flex: 1 }} disabled={sampleSelectionDisabled} onClick={async () => {
					try {
						// Delete the sample in the database
						const { ok, message } = await deleteSample({ sampleId });
						if (!ok) {
							throw new Error(message);
						}
						
						// Change the new sample options where it isnt deleted
						const newOptions = sampleSet.filter(dict => dict.value !== sampleId);
						setSampleSet(newOptions);
						
						// Delete features in the map
						Features.clearLayers();
						Point.clearLayers();

						// Set the sample name, id, and selected to none
						if (newOptions.length){
							setSelectedSampleSet(newOptions[0]);
						} else {
							setSelectedSampleSet(undefined);
						}
					} catch (error) {
						setMessage(error.message);
						setMessageColor('red');
					}
					
				}}>-</button>

				<button className='button-parameter material-icons' disabled={sampleSelectionDisabled} style={{ flex: 1 }} onClick={async () => {
					try {
						// Set the message when saving sample
						setMessage('Saving samples...');
						setMessageColor('blue');

						// Disabled button
						toggleFeatures(true, [
							setSampleGenerationDisabled,
							setSampleSelectionDisabled,
							setRegionYearDisabled,
						]);

						// Feature collection assign
						const features = {
							type: 'FeatureCollection',
							features: sampleFeatures.features,
							properties: {
								region,
								year,
								sampleId,
								sampleName: sampleName || sampleId,
								selectedSample: selectedSample.value
							}
						};

						// Set the state of features
						setSampleFeatures(features);

						// Update the sample in the server
						const { ok, message } = await updateSample({ sampleId, features, time: new Date().getTime() });
						if (!ok) {
							throw new Error(message);
						}

						// Set the message when saving sample
						setMessage('Sample successfully saved');
						setMessageColor('green');
					} catch (error) {
						// Set the message when saving sample
						setMessage(error.message);
						setMessageColor('red');
					} finally {
						// Enable button again
						toggleFeatures(false, [
							setSampleGenerationDisabled,
							setSampleSelectionDisabled,
							setRegionYearDisabled,
						]);
					} 
				}}>&#xe161;</button>

				<a className="flexible vertical" href={sampleLink} download={`${sampleId}.geojson`} disabled={sampleSelectionDisabled}>
					<button style={{ flex: 1 }} className="button-parameter material-icons" disabled={sampleSelectionDisabled}>&#xe2c4;</button>
				</a>
			</div>

			<div>
				Sample name
				<input value={sampleName} disabled={sampleSelectionDisabled}
					onInput={e => {
						// Set the sample name
						setSampleName(e.target.value);
					}}
					onBlur={async e => {
						// Change the sample set
						const options = sampleSet.map(data => {
							if (data.value == sampleId) {
								data.label = sampleName;
							}
							return data;
						});
						setSampleSet(options);

						// Change the sample name in the database
						try {
							const { ok, message } = await updateSampleName({ sampleId, sampleName });
							if (!ok) {
								throw new Error(message);
							}
						} catch (error) {
							setMessage(error.message);
							setMessageColor('red');
						}
						
					}}
				/>	
			</div>

			<div className='menu flexible fill-vertical space'>
				<Select 
					options={sampleList}
					isDisabled={sampleSelectionDisabled}
					value={selectedSample}
					onChange={value => setSelectedSample(value)}
					style={{ flex: 2 }}
					className='select-menu'
				/>

				<button style={{ flex: 1 }} className='button-parameter' disabled={sampleSelectionDisabled} onClick={() => {
					const current = selectedSample.value;
					selectedSample.value !== minSample ? setSelectedSample({ label: current - 1, value: current - 1 }) : null;
				}}> {'<'} </button>

				<button style={{ flex: 1 }} className='button-parameter' disabled={sampleSelectionDisabled} onClick={() => {
					const current = selectedSample.value;
					selectedSample.value !== maxSample ? setSelectedSample({ label: current + 1, value: current + 1 }) : null;
				}}> {'>'} </button>

				<button style={{ flex: 1 }} className='button-parameter material-icons' disabled={sampleSelectionDisabled} onClick={() => {
					const bounds = Point.getBounds();
					Map.fitBounds(bounds, { maxZoom: 14 });
				}}>&#xe0c8;</button>
			</div>

			<Select 
				placeholder={'Select landcover type'}
				options={lcOptions}
				value={lcSelect}
				onChange={async value => {
					/// Change the lc value
					setLcSelect(value);
					
					try {
						// Current all features
						const currentFeatures = sampleFeatures.features.map((feat, index) => {
							if (index === selectedSample.value) {
								feat.properties.validation = value.value;
								setSelectedSampleFeatures(feat);
							};
							return feat;
						});
			
						// Feature collection assign
						const features = {
							type: 'FeatureCollection',
							features: currentFeatures,
							properties: {
								region,
								year,
								sampleId,
								sampleName: sampleName || sampleId,
								selectedSample: selectedSample.value
							}
						};

						// Set the current sample features
						setSampleFeatures(features);

						// Update the sample in the server
						const { ok, message } = await updateSample({ sampleId, features, time: new Date().getTime() });

						// If the result is not okay, throw error
						if (!ok) {
							throw new Error(message);
						}
					} catch (error) {
						setMessage(error.message);
						setMessageColor('red');
					}
					
				}}
				className='select-menu'
				isDisabled={sampleSelectionDisabled}
			/>
		</div>	
	)
}

/**
 * Function to change the selected sample
 * @param {GeoJSON} features 
 * @param {Number} value 
 * @param {ReactStateSetter} setSelectedSampleFeatures 
 */
function changePointSample(features, value, setSelectedSampleFeatures){
	// Selected
	const selected = features.features.filter((feat, index) => index === value)[0];
	setSelectedSampleFeatures(selected);

	Point.clearLayers() // Clear all layers inside the selected one
	Point.addData(selected);

	// Zoom to the selected sample
	Map.fitBounds(Point.getBounds(), { maxZoom: 14 });

	return selected;
}

/**
 * Function to remove a option on a select
 * @param {ReactState} current 
 * @param {ReactStateSetter} setter 
 * @param {{ value: any, label: any }} selected 
 * @param {'add' | 'remove'} status 
 */
function pushOption(current, setter, selected, status){
	let newOptions = Array.from(current);
	
	switch (status) {
		case 'add':
			newOptions.push(selected);
			break;
		case 'remove':
			newOptions = newOptions.filter(data => data !== selected);
			break;
	}

	setter(newOptions);
}