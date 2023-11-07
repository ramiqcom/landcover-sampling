// Import some packages
import { useEffect, useState } from 'react';
import Select from 'react-select';
import Login from './login';
import { Map, Tile, Features, Point } from './map';
import tile from './tileServer';
import saveProject from './saveProjectServer';
import sampleServer from './sampleServer';
import loadSample from './loadSampleServer';
import updateSample from './updateSampleServer';
import Assessment from './assessment';
import { lulcLabel, lulcValue, lulcValueLabel } from './lulc';

// Panel function as app handler
export default function Panel(prop){
	const [ loginPage, setLoginPage ] = useState('flex');
	const [ appState, setAppState ] = useState('none');
	const [ projectList, setProjectList ] = useState([]);
	const [ project, setProject ] = useState(undefined);
	const [ projectId, setProjectId ] = useState(undefined);
	const [ username, setUsername ] = useState(undefined);
	const [ sampleSet, setSampleSet ] = useState([]);
	const [ selectedSample, setSelectedSample ] = useState(undefined);
	const [ sampleId, setSampleId ] = useState(undefined);

	// List of state
	const states = {
		loginPage, setLoginPage,
		appState, setAppState,
		projectList, setProjectList,
		project, setProject,
		projectId, setProjectId,
		username, setUsername,
		sampleSet, setSampleSet,
		selectedSample, setSelectedSample,
		sampleId, setSampleId,
		...prop
	};

	return (
		<div id='panel' className="flexible vertical space">
			<div id='title-panel'>
				Land cover sampling
			</div>

			<Login {...states} />

			<Application {...states} />

		</div>
	)
}

// Application
function Application(props){
	return (
		<div id='application' className='flexible vertical space' style={{ display: props.appState }}>
			<Project {...props} />
		</div>
	)
}

// Project select
function Project(props){
	const { 
		projectList, 
		project, 
		setProject, 
		setProjectId,
		projectId,
		username,
		selectedSample,
		sampleId,
	} = props;

	// Save project
	const [ saveProjectDisabled, setSaveProjectDisabled ] = useState(true);

	// Region year disabled
	const [ regionYearDisabled, setRegionYearDisabled ] = useState(false);

	// Image and sample parameter
	const [ parameterDisabled, setParameterDisabled ] = useState(false);

	// Project name
	const [ projectName, setProjectName ] = useState(undefined);

	// Project name disabled
	const [ projectNameDisabled, setProjectNameDisabled ] = useState(false);

	// Enable to save project if the project if selected
	useEffect(() => {
		if (project || projectName) {
			setSaveProjectDisabled(false);
		} else {
			setSaveProjectDisabled(true);
		};
	}, [ project, projectName ]);

	// Years selection
	let years = [ 2012, 2017, 2022 ];
	years = years.map(year => new Object({ label: year, value: year }));

	// Region list
	let regions = [ 'Sumatera', 'KepriBabel', 'JawaBali', 'Kalimantan', 'Sulawesi', 'Nusra', 'Maluku', 'MalukuUtara', 'Papua', 'PeninsularMalaysia', 'BorneoMalaysia' ];
	regions = regions.map(region => new Object({ label: region, value: region }));

	// Year state
	const [year, setYear] = useState(years[2]);

	// Region state
	const [ region, setRegion ] = useState(regions[0]);

	// Bands state
	const [ red, setRed ] = useState({ value: 'B5', label: 'B5' });
	const [ green, setGreen ] = useState({ value: 'B6', label: 'B6' });
	const [ blue, setBlue ] = useState({ value: 'B7', label: 'B7' });

	// Messages
	const [ message, setMessage ] = useState(undefined);

	// Message color
	const [ messageColor, setMessageColor ] = useState('blue');

	// Image selection display
	const [ selectionDisplay, setSelectionDisplay ] = useState('flex');

	// Sampling display
	const [ samplingDisplay, setSamplingDisplay ] = useState('none');

	// Assessment display
	const [ assessmentDisplay, setAssessmentDisplay ] = useState('none')

	// Image and sampling button
	const [ imageButtonDisabled, setImageButtonDisabled ] = useState(true);
	const [ samplingButtonDisabled, setSamplingButtonDisabled ] = useState(false);
	const [ assessmentButtonDisabled, setAssessmentButtonDisabled ] = useState(false);

	// Sample parameter disabled button
	const [ sampleGenerationDisabled, setSampleGenerationDisabled ] = useState(false);
	const [ sampleSelectionDisabled, setSampleSelectionDisabled ] = useState(true);

	// Sample features
	const [ sampleFeatures, setSampleFeatures ] = useState(undefined);

	// State list
	const states = {
		projectName, setProjectName,
		parameterDisabled, setParameterDisabled,
		year, setYear,
		region, setRegion,
		red, setRed,
		green, setGreen,
		blue, setBlue,
		message, setMessage,
		messageColor, setMessageColor,
		selectionDisplay, setSelectionDisplay,
		samplingDisplay, setSamplingDisplay,
		imageButtonDisabled, setImageButtonDisabled,
		samplingButtonDisabled, setSamplingButtonDisabled,
		regionYearDisabled, setRegionYearDisabled,
		sampleGenerationDisabled, setSampleGenerationDisabled,
		sampleSelectionDisabled, setSampleSelectionDisabled,
		assessmentDisplay, setAssessmentDisplay,
		assessmentButtonDisabled, setAssessmentButtonDisabled,
		sampleFeatures, setSampleFeatures,
		...props
	};

	return (
		<>
			<div id='project-management' className='flexible space fill-vertical'>
				<Select 
					options={projectList}
					value={project}
					placeholder={'Create a new project first!'}
					onChange={value => {
						setProject(value);
					}}
					className='select-menu'
					style={{ flex: 4 }}
				/>

				<button disabled={saveProjectDisabled} style={{ flex: 1 }} onClick={async () => {
					// Show error message if project name is empty
					if (!projectName){
						setMessage('Project name is empty!');
						setMessageColor('red');
					} else {
						// Save message
						setMessage('Saving...');
						setMessageColor('blue');

						// Disabled some button
						toggleFeatures(true, [
							setProjectNameDisabled,
							setRegionYearDisabled
						]);
						
						// Create new project id if the inst already
						if (!(project)) {
							setProjectId(`${username}_${new Date().getTime()}`);
						};

						// Information needed to save project
						const body = {
							projectId,
							projectName,
							region: region.value,
							year: year.value,
							username,
							sampleId: sampleId ? sampleId : null,
							selectedSample: selectedSample ? selectedSample.value : null
						};

						// Save project
						const response = await saveProject(body);
						console.log(response);

						// Condiitional if data is saved
						if (response.ok){
							setMessage(response.message);
							setMessageColor('green');
						} else {
							setMessage(`${response.message}: ${response.error}`);
							setMessageColor('red');
						};

						// Turn on parameter button again
						toggleFeatures(false, [
							setProjectNameDisabled,
							setRegionYearDisabled
						]);
					};
				}}>Save project</button>
			</div>

			<div id='create-project' className='flexible vertical space'>
				<div id='project-name'>
					Project name
					<input value={projectName} onInput={e => setProjectName(e.target.value)} disabled={projectNameDisabled} />
				</div>

				<Select
					options={regions}
					value={region}
					onChange={value => setRegion(value)}
					className='select-menu'
					isDisabled={regionYearDisabled}
				/>

				<Select
					options={years}
					value={year}
					onChange={value => setYear(value)}
					className='select-menu'
					isDisabled={regionYearDisabled}
				/>

				<div id='parameter-panel' className='flexible vertical'>
					<div id='button-menu' className='flexible'>
						<button className='select-button' disabled={imageButtonDisabled} onClick={() => {
							setImageButtonDisabled(true);
							setSamplingButtonDisabled(false);
							setAssessmentButtonDisabled(false);
							setSamplingDisplay('none');
							setSelectionDisplay('flex');
							setAssessmentDisplay('none');
						}}>
							Image
						</button>

						<button className='select-button' disabled={samplingButtonDisabled} onClick={() => {
							setImageButtonDisabled(false);
							setSamplingButtonDisabled(true);
							setAssessmentButtonDisabled(false);
							setSamplingDisplay('flex');
							setSelectionDisplay('none');
							setAssessmentDisplay('none');
						}}>
							Sampling
						</button>

						<button className='select-button' disabled={assessmentButtonDisabled} onClick={() => {
							setImageButtonDisabled(false);
							setSamplingButtonDisabled(false);
							setAssessmentButtonDisabled(true);
							setSamplingDisplay('none');
							setSelectionDisplay('none');
							setAssessmentDisplay('flex');
						}}>
							Assessment
						</button>
					</div>
					
					<div id='menu' className='flexible-space'>
						<Selection {...states} />
						<Sampling {...states} />
						<Assessment {...states} />
					</div>
				</div>

				<div id='panel-message' className='message' onClick={() => setMessage(undefined)} style={{ color: messageColor }}>
					{message}
				</div>
				
			</div>
		</>	
	)
}

// Data selection
function Selection(props){
	// Parameter disabled
	const { 
		parameterDisabled, setParameterDisabled,
		year,
		region,
		red, setRed,
		green, setGreen,
		blue, setBlue,
		setMessage,
		setMessageColor,
		selectionDisplay,
		setRegionYearDisabled,
		setImageCheckboxDisabled
	} = props;

	// Image url
	const [ imageUrl, setImageUrl ] = useState(undefined);
	const [ imageGeoJson, setImageGeoJson ] = useState(undefined);

	// Useeffect if the image url changed
	useEffect(() => {
		if (Tile) {
			if (imageUrl) {
				setImageCheckboxDisabled(false);
			} else {
				setImageCheckboxDisabled(true);
			}
		};
	}, [ imageUrl, imageGeoJson ]);

	// Bands list
	let bands = [ 'B2', 'B3', 'B4', 'B5', 'B6', 'B7' ];
	bands = bands.map(value => new Object({ value: value, label: value }));

	return (
		<div id='parameter' className='flexible vertical space' style={{ display: selectionDisplay }}>

			<div id='bands' className='flexible'>
				<Select
					options={bands}
					value={red}
					onChange={value => setRed(value)}
					className='select-menu'
					isDisabled={parameterDisabled}
				/>
				<Select
					options={bands}
					value={green}
					onChange={value => setGreen(value)}
					className='select-menu'
					isDisabled={parameterDisabled}
				/>
				<Select
					options={bands}
					value={blue}
					onChange={value => setBlue(value)}
					className='select-menu'
					isDisabled={parameterDisabled}
				/>
			</div>

			<button className='button-parameter' disabled={parameterDisabled} onClick={async () => {
				// Enable button again
				toggleFeatures(true, [
					setRegionYearDisabled,
					setParameterDisabled
				]);

				// Load image to map
				await loadImage(year, region, [ red, green, blue ], setImageUrl, setImageGeoJson, setMessage, setMessageColor);

				// Enable button again
				toggleFeatures(false, [
					setRegionYearDisabled,
					setParameterDisabled
				]);
			}}>Show image</button>
			
		</div>
	)
}

// Sampling components
function Sampling(props){
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
		selectedSample, setSelectedSample
	} = props;

	const [ selectedSampleSet, setSelectedSampleSet ] = useState(undefined);
	const [ sampleSize, setSampleSize ] = useState(10);
	const [ sampleList, setSampleList ] = useState([]);
	const [ selectedSampleFeatures, setSelectedSampleFeatures ] = useState(undefined);
	const [ sampleName, setSampleName ] = useState(undefined);
	const [ minSample, setMinSample ] = useState(undefined);
	const [ maxSample, setMaxSample ] = useState(undefined);

	// LC options
	const lcOptions = lulcLabel.map((label, i) => new Object({ label: label, value: lulcValue[i] }));
	const [ lcSelect, setLcSelect ] = useState(undefined);

	// Function to call samples
	async function callSamples(sampleId, callback) {
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
		};
	}

	// Do something when selected sample set changed
	useEffect(() => {
		if (selectedSampleSet) {
			setSampleName(selectedSampleSet.label);
			setSampleId(selectedSampleSet.value);

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
		<div id='sampling' className='flexible vertical space' style={{ display: samplingDisplay }}>
			
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
					setMessage('Generating sample');
					setMessageColor('blue');
					
					// Generate sample set id
					const id = `${username}_${region.value}_${year.value}_${new Date().getTime()}`;

					// Generate sample
					const result = await generateSample(year.value, region.value, id, { 
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
					placeholder={'Generate sample first!'}
					onChange={value => {
						setSelectedSampleSet(value);
					}}
					className='select-menu'
					styles={ { flex: 3 } }
					isDisabled={sampleGenerationDisabled}
				/>

				<button className='button-parameter' disabled={sampleSelectionDisabled} style={{ flex: 1 }} onClick={() => {
					// Disabled button
					toggleFeatures(true, [
						setSampleGenerationDisabled,
						setSampleSelectionDisabled,
						setRegionYearDisabled,
					]);

					// Enable button again
					toggleFeatures(false, [
						setSampleGenerationDisabled,
						setSampleSelectionDisabled,
						setRegionYearDisabled,
					]);
				}}>Save</button>

			</div>

			<div>
				Sample name
				<input value={sampleName} disabled={sampleGenerationDisabled} onInput={e => setSampleName(e.target.value)}/>	
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

				<button className='fa fa-location-arrow button-parameter' disabled={sampleSelectionDisabled} onClick={() => {
					const bounds = Point.getBounds();
					Map.fitBounds(bounds, { maxZoom: 14 });
				}}></button>
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
					await updateSample({ sampleId, features });
		
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
 * Function load image
 * @param {{ value: Number, label: Number }} year 
 * @param {{ value: String, label: String }} region 
 * @param {{ value: String, label: String }} red 
 * @param {{ value: String, label: String }} green 
 * @param {{ value: String, label: String }} blue 
 */
async function loadImage(year, region, [ red, green, blue ], setImageUrl, setImageGeoJson, setMessage, setMessageColor){
	// Image load message
	setMessage('Preparing image...');
	setMessageColor('blue');

	// Parameter to fetch image
	const body = {
		year: year.value,
		region: region.value,
		bands: [ red.value, green.value, blue.value ]
	};

	// Load tile and geojson with server action
	const result = await tile(body);

	// Set the image url
	setImageUrl(result.url);
	setImageGeoJson(result.geojson);
					
	// Condiitonal if the function is success
	if (result.ok){
		// Add tile to map
		Tile.setUrl(result.url);
		
		// Zoom to tile
		const geojson = L.geoJSON(result.geojson).getBounds();
		Map.fitBounds(geojson, { maxZoom: 14 });

		// Hide message
		setMessage(undefined);
	} else {
		// Show error message
		setMessage(result.message);
		setMessageColor('red');
	};
}

/**
 * Disable multiple feature
 * @param {Boolean} status
 * @param {Array.<ReactStateSetter>} featureSetList
 */
function toggleFeatures(status, featureSetList){
	featureSetList.map(setter => setter(status));
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

/**
 * Function to generate sample
 * @param {Number} year 
 * @param {String} region 
 * @param {Number} sampleSize
 */
async function generateSample(year, region, id, prop){
	const { sampleSize, setSampleList, setSampleFeatures, setSelectedSampleFeatures, setSelectedSample, setMinSample, setMaxSample } = prop;

	const body = { year, region, sampleSize, sampleId: id };

	// Generate sampel from earth engine
	const { features, ok, message } = await sampleServer(body);
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