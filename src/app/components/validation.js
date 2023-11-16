// Import packages
import { useState, useEffect } from "react";
import Select from 'react-select';
import { toggleFeatures } from "./utilities";
import { lulcLabel, lulcValue, lulcValueLabel } from './lulc';
import { createSample, loadSample, updateSample, updateSampleName, deleteSample } from '../server/sampleServer';
import { Map, Features, Point } from "./map";

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
		setSampleCheckboxDisabled,
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

	// Function to call samples
	async function callSamples(sampleId, callback) {
		// Set loading to load sample
		setMessage('Loading sample...');
		setMessageColor('blue');

		const { features, ok, message } = await loadSample({ sampleId });

		if (!ok) {
			setMessage(message);
			setMessageColor('red');
		} else {
			// Clear features samples
			Features.clearLayers()

			// Add the features layer to Features
			Features.addData(features);

			// Set main samples
			setSampleFeatures(features);

			// Samples list
			const sampleList = features.features.map(feat => new Object({ value: feat.properties.num, label: feat.properties.num }));
			setSampleList(sampleList);
			setSelectedSample(sampleList[0]);

			// Set max and min sample
			const sampleIdSort = features.features.map(feat => feat.properties.num).sort((x, y) => x - y);
			setMinSample(sampleIdSort[0]);
			setMaxSample(sampleIdSort[sampleIdSort.length - 1]);

			// Change selected points
			changePointSample(features, 0, setSelectedSampleFeatures);
			
			// Activate button
			callback();

			// Set loading to null again
			setMessage(undefined);
		};
	}

	// Do something when selected sample set changed
	useEffect(() => {
		if (selectedSampleSet) {
			setSampleName(selectedSampleSet.label);
			setSampleId(selectedSampleSet.value);

			// Disabled button until the operation is done
			toggleFeatures(true, [ setSampleSelectionDisabled, setSampleCheckboxDisabled ]);

			if (selectedSampleSet.value) {
				// Calling the samples
				callSamples(selectedSampleSet.value, () => toggleFeatures(false, [ setSampleSelectionDisabled, setSampleCheckboxDisabled ]));
			} else {
				toggleFeatures(true, [ setSampleSelectionDisabled, setSampleCheckboxDisabled ]);
			};
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
			Features.clearLayers();
			Features.addData(sampleFeatures);
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

					// Generate sample
					const result = await generateSample(year.value, region.value, id, username, time, { 
						sampleSize, setSampleList, setSampleFeatures, setSelectedSampleFeatures, setSelectedSample, setMinSample, setMaxSample 
					});

					// Check if the process is success
					if (result) {
						setMessage(result);
						setMessageColor('red');
					}

					// New sample option
					const option = { value: id, label: id };

					// Add the option to sample set selection
					pushOption(sampleSet, setSampleSet, option, 'add');

					// Select the option
					setSelectedSampleSet(option);

					// Delete message
					setMessage(undefined);

					// Enable button again
					toggleFeatures(false, [
						setSampleGenerationDisabled,
						setSampleSelectionDisabled,
						setRegionYearDisabled,
					]);
				}}>Generate</button>
			</div>

			<div style={{ height: '0.5px', width: '100%', backgroundColor: '#F9F5F0' }}></div>
			
			<div className='flexible space fill-vertical'>

				<Select 
					options={sampleSet}
					value={selectedSampleSet}
					onChange={value => {
						setSelectedSampleSet(value);
					}}
					className='select-menu'
					styles={ { flex: 3 } }
					isDisabled={sampleGenerationDisabled}
					placeholder={'Generate or select a sample'}
				/>

				<button className="button-parameter" style={{ flex: 1 }} disabled={sampleSelectionDisabled} onClick={async () => {
					// Delete the sample in the database
					await deleteSample({ sampleId });
					
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
				}}>-</button>

				<button className='button-parameter material-icons' disabled={sampleSelectionDisabled} style={{ flex: 1 }} onClick={async () => {
					// Set the message when saving sample
					setMessage('Saving samples...');
					setMessageColor('blue');

					// Disabled button
					toggleFeatures(true, [
						setSampleGenerationDisabled,
						setSampleSelectionDisabled,
						setRegionYearDisabled,
					]);

					// Update the sample in the server
					await updateSample({ sampleId, features: sampleFeatures, time: new Date().getTime() });

					// Enable button again
					toggleFeatures(false, [
						setSampleGenerationDisabled,
						setSampleSelectionDisabled,
						setRegionYearDisabled,
					]);

					// Set the message when saving sample
					setMessage('Sample successfully saved');
					setMessageColor('green');
				}}>&#xe161;</button>

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
						await updateSampleName({ sampleId, sampleName });
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
					
					// Current all features
					const currentFeatures = sampleFeatures.features.map(feat => {
						if (feat.properties.num === selectedSample.value) {
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
							sampleName: sampleName || sampleId
						}
					};

					// Update the sample in the server
					await updateSample({ sampleId, features, time: new Date().getTime() });
		
					// Set the current sample features
					setSampleFeatures(features);

					// Add labelled sample
					Features.clearLayers();
					Features.addData(features);
				}}
				className='select-menu'
				isDisabled={sampleSelectionDisabled}
			/>
		</div>	
	)
}

/**
 * Function to generate sample
 * @param {Number} year 
 * @param {String} region 
 * @param {Number} sampleSize
 */
async function generateSample(year, region, id, username, time, prop){
	const { sampleSize, setSampleList, setSampleFeatures, setSelectedSampleFeatures, setSelectedSample, setMinSample, setMaxSample } = prop;

	const body = { year, region, sampleSize, sampleId: id, username, time };

	// Generate sampel from earth engine
	const { features, ok, message } = await createSample(body);
	if (ok) {
		setSampleFeatures(features);
	} else {
		return message;
	};
	
	// Remove all features
	Features.clearLayers();

	// Add the features to map
	Features.addData(features);

	// Samples list
	const sampleList = features.features.map(feat => new Object({ value: feat.properties.num, label: feat.properties.num }));
	setSampleList(sampleList);
	setSelectedSample(sampleList[0]);

	// Set max and min sample
	const sampleIdSort = features.features.map(feat => feat.properties.num).sort((x, y) => x - y);
	setMinSample(sampleIdSort[0]);
	setMaxSample(sampleIdSort[sampleIdSort.length - 1]);

	// Selected
	changePointSample(features, 0, setSelectedSampleFeatures);
}

/**
 * Function to change the selected sample
 * @param {GeoJSON} features 
 * @param {Number} value 
 * @param {ReactStateSetter} setSelectedSampleFeatures 
 */
function changePointSample(features, value, setSelectedSampleFeatures){
	// Selected
	const selected = features.features.filter(feat => feat.properties.num === value)[0];
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