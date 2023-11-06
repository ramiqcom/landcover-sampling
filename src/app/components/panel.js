// Import some packages
import { useEffect, useState } from 'react';
import Select from 'react-select';
import Login from './login';
import { Map, Tile, Features, Point } from './map';
import tile from './tileServer';
import saveProject from './saveProjectServer';
import sampleServer from './sampleServer';
import lulc from './data.json' assert { type: 'json' };

// LULC parameter
const lulcCode = Object.keys(lulc);
const lulcArray = Object.entries(lulc);
const lulcLabel = lulcArray.map(array => array[1].label);
const lulcPalette = lulcArray.map(array => array[1].palette);
const lulcValue = lulcArray.map(array => array[1].value);

// Panel function as app handler
export default function Panel(){
	const [ loginPage, setLoginPage ] = useState('flex');
	const [ appState, setAppState ] = useState('none');
	const [ projectList, setProjectList ] = useState([]);
	const [ project, setProject ] = useState(undefined);
	const [ projectId, setProjectId ] = useState(undefined);
	const [ username, setUsername ] = useState(undefined);
	const [ featuresId, setFeaturesId ] = useState(undefined);
	const [ selectedFeature, setSelectedFeature ] = useState(undefined);

	// List of state
	const states = {
		loginPage, setLoginPage,
		appState, setAppState,
		projectList, setProjectList,
		project, setProject,
		projectId, setProjectId,
		username, setUsername,
		featuresId, setFeaturesId,
		selectedFeature, setSelectedFeature,
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
		featuresId,
		selectedFeature,
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
	}, [project, projectName]);

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

	// Image and sampling button
	const [ imageButtonDisabled, setImageButtonDisabled ] = useState(true);
	const [ samplingButtonDisabled, setSamplingButtonDisabled ] = useState(false);

	// Sample parameter disabled button
	const [ sampleGenerationDisabled, setSampleGenerationDisabled ] = useState(false);
	const [ sampleSelectionDisabled, setSampleSelectionDisabled ] = useState(true);

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
							setProjectId(new Date().getTime());
						};

						// Information needed to save project
						const body = {
							projectId,
							projectName,
							region: region.value,
							year: year.value,
							username,
							featuresId,
							selectedFeature
						};

						// Save project
						const response = await saveProject(body);

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
							setImageButtonDisabled(!imageButtonDisabled);
							setSamplingButtonDisabled(!samplingButtonDisabled);
							setSamplingDisplay('none');
							setSelectionDisplay('flex');
						}}>
							Image
						</button>

						<button className='select-button' disabled={samplingButtonDisabled} onClick={() => {
							setImageButtonDisabled(!imageButtonDisabled);
							setSamplingButtonDisabled(!samplingButtonDisabled);
							setSamplingDisplay('flex');
							setSelectionDisplay('none');
						}}>
							Sampling
						</button>
					</div>
					
					<div id='menu' className='flexible-space'>
						<Selection {...states} />
						<Sampling {...states} />
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
	} = props;

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
				await loadImage(year, region, [red, green, blue], setMessage, setMessageColor);

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
		setMessage, setMessageColor,
		setRegionYearDisabled,
		sampleGenerationDisabled, setSampleGenerationDisabled,
		sampleSelectionDisabled, setSampleSelectionDisabled
	} = props;

	const [ sampleSet, setSampleSet ] = useState([]);
	const [ selectedSampleSet, setSelectedSampleSet ] = useState(undefined);
	const [ sampleFeatures, setSampleFeatures ] = useState(undefined);
	const [ sampleSize, setSampleSize ] = useState(10);
	const [ sampleList, setSampleList ] = useState([]);
	const [ selectedSampleFeatures, setSelectedSampleFeatures ] = useState(undefined);
	const [ selectedSample, setSelectedSample ] = useState(undefined);
	const [ sampleName, setSampleName ] = useState(undefined);
	const [ sampleId, setSampleId ] = useState(undefined);
	const [ minSample, setMinSample ] = useState(undefined);
	const [ maxSample, setMaxSample ] = useState(undefined);

	// LC options
	const lcOptions = lulcLabel.map((label, i) => new Object({ label: label, value: lulcValue[i] }));
	const [ lcSelect, setLcSelect ] = useState(undefined);

	// Do something when selected sample set changed
	useEffect(() => {
		if (selectedSampleSet) {
			setSampleId(selectedSampleSet.value);
			setSampleName(selectedSampleSet.label);

			if (selectedSampleSet.value) {
				toggleFeatures(false, [ setSampleSelectionDisabled ]);
			} else {
				toggleFeatures(true, [ setSampleSelectionDisabled ]);
			};
		}
	}, [ selectedSampleSet ]);

	// Do something and selected sample change
	useEffect(() => {
		if (selectedSample) {
			toggleFeatures(false, [ setSampleSelectionDisabled ]);
			changePointSample(sampleFeatures, selectedSample.value, setSelectedSampleFeatures);
		} else {
			toggleFeatures(true, [ setSampleSelectionDisabled ]);
		}
	}, [ selectedSample ]);

	return (
		<div id='sampling' className='flexible vertical space' style={{ display: samplingDisplay }}>
			
			<div className='menu flexible fill-vertical space'>

				<div style={{ flex: 2 }}>
					Sample per class
				</div>

				<input style={{ flex: 1 }} disabled={sampleGenerationDisabled} type='number' value={sampleSize} onChange={e => setSampleSize(e.target.value) }/>

				<button className='button-parameter' style={{ flex: 1 }}  onClick={async () => {
					// Disable button
					toggleFeatures(true, [
						setSampleGenerationDisabled,
						setSampleSelectionDisabled,
						setRegionYearDisabled,
					]);

					// Set message
					setMessage('Generating sample');
					setMessageColor('blue');

					// Generate sample
					await generateSample(year.value, region.value, { 
						sampleSize, setSampleList, setSampleFeatures, setSelectedSampleFeatures, setSelectedSample, setMinSample, setMaxSample 
					});

					// Generate sample set id
					const id = new Date().getTime();

					// New sample option
					const option = { value: id, label: `Sample_${id}` };

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
					Map.fitBounds(bounds);
				}}></button>
			</div>

			<Select 
				placeholder={'Select landcover type'}
				options={lcOptions}
				value={lcSelect}
				onChange={value => setLcSelect(value)}
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
async function loadImage(year, region, [ red, green, blue ], setMessage, setMessageColor){
	// Image load message
	setMessage('Preparing image...');
	setMessageColor('blue');

	// Parameter to fetch image
	const body = {
		year: year.value,
		region: region.value,
		bands: [red.value, green.value, blue.value]
	};

	// Load tile and geojson with server action
	const result = await tile(body);
					
	// Condiitonal if the function is success
	if (result.ok){
		// Add tile to map
		Tile.setUrl(result.url);
		
		// Zoom to tile
		const geojson = L.geoJSON(result.geojson).getBounds();
		Map.fitBounds(geojson);

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
async function generateSample(year, region, prop){
	const { sampleSize, setSampleList, setSampleFeatures, setSelectedSampleFeatures, setSelectedSample, setMinSample, setMaxSample } = prop;

	const body = { year, region, sampleSize };

	// Generate sampel from earth engine
	const features = await sampleServer(body);
	setSampleFeatures(features);
	
	// Remove all features
	Features.clearLayers();

	// Add the features to map
	Features.addData(features);

	// Samples list
	const sampleList = features.features.map(feat => new Object({ value: feat.properties.id, label: feat.properties.id }));
	setSampleList(sampleList);
	setSelectedSample(sampleList[0]);

	// Set max and min sample
	const sampleIdSort = features.features.map(feat => feat.properties.id).sort((x, y) => x - y);
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
	const selected = features.features.filter(feat => feat.properties.id === value)[0];
	setSelectedSampleFeatures(selected);
	Point.clearLayers() // Clear all layers inside the selected one
	Point.addData(selected);

	// Zoom to the selected sample
	Map.fitBounds(Point.getBounds());
}