// Import some packages
import { useEffect, useState } from 'react';
import Select from 'react-select';
import Login from './login';
import { Map, Tile, Features, Point } from './map';
import tile from '../server/tileServer';
import { saveProject, loadProject, deleteProject } from '../server/projectServer';
import { createSample, loadSample, updateSample, updateSampleName } from '../server/sampleServer';
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
		sampleSet, 
		setSelectedSample,
		setProjectList
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

	// New project button disabled
	const [ createProjectDisabled, setCreateProjectDisabled ] = useState(false);

	// Years selection
	let years = [ 2012, 2017, 2022 ];
	years = years.map(year => new Object({ label: year, value: year }));

	// Region list
	let regions = [ 'Sumatera', 'KepriBabel', 'JawaBali', 'Kalimantan', 'Sulawesi', 'Nusra', 'Maluku', 'MalukuUtara', 'Papua', 'PeninsularMalaysia', 'BorneoMalaysia' ];
	regions = regions.map(region => new Object({ label: region, value: region }));

	// Year state
	const [ year, setYear ] = useState(years[2]);

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

	// Selected sample set
	const [ selectedSampleSet, setSelectedSampleSet ] = useState(undefined);

	// List of samples in the set
	const [ sampleList, setSampleList ] = useState([]);

	// Image url
	const [ imageUrl, setImageUrl ] = useState(undefined);
	const [ imageGeoJson, setImageGeoJson ] = useState(undefined);

	// Load project function
	async function loadProjectData(projectId){
		// Set message
		setMessage('Loading project...');
		setMessageColor('blue');

		// Disabled button
		toggleFeatures(true, [
			setRegionYearDisabled,
			setParameterDisabled,
			setSaveProjectDisabled,
			setProjectNameDisabled,
			setCreateProjectDisabled,
			setSampleGenerationDisabled,
		]);

		const { region, year, sample_id, selected_sample, visual } = await loadProject({ projectId });
		
		// Set region and year
		setRegion({ value: region, label: region });
		setYear({ value: year, label: year });

		// Set visualization
		const [ red, green, blue ] = JSON.parse(visual);
		setRed({ value: red, label: red });
		setGreen({ value: green, label: green });
		setBlue({ value: blue, label: blue });

		// Load image
		await loadImage(year, region, [ red, green, blue ], setImageUrl, setImageGeoJson, setMessage, setMessageColor);

		// Load sample if it saved
		if (sample_id) {
			// Set the sample on map
			const selectedSampleSet = sampleSet.filter(dict => dict.value == sample_id)[0];
			setSelectedSampleSet(selectedSampleSet);

			// Function to load the selected sample if the set already loaded
			setTimeout(() => setSelectedSample({ value: selected_sample, label: selected_sample }), 2000);
		}

		// Enable button
		toggleFeatures(false, [
			setRegionYearDisabled,
			setParameterDisabled,
			setSaveProjectDisabled,
			setProjectNameDisabled,
			setCreateProjectDisabled,
			setSampleGenerationDisabled,
		]);
	}

	// Function to save project
	async function saveProjectData({ projectId, projectName, region, year, red, green, blue, username, sampleId, selectedSample }){
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
				visual: JSON.stringify([ red.value, green.value, blue.value ]),
				username,
				sampleId: sampleId ? sampleId : null,
				selectedSample: selectedSample ? selectedSample.value : null
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
		}
	}

	// Enable to save project if the project if selected
	useEffect(() => {
		if (project || projectName) {
			setSaveProjectDisabled(false);
		} else {
			setSaveProjectDisabled(true);
		};
	}, [ project, projectName ]);

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
		imageUrl, setImageUrl,
		imageGeoJson, setImageGeoJson,
		selectedSampleSet, setSelectedSampleSet,
		sampleList, setSampleList,
		...props
	};

	return (
		<>
			<div id='project-management' className='flexible space fill-vertical'>
				<Select 
					options={projectList}
					value={project}
					placeholder={'Save or select a project'}
					onChange={async value => {
						setProject(value);
						setProjectId(value.value);
						setProjectName(value.label);
						await loadProjectData(value.value);
					}}
					className='select-menu'
					style={{ flex: 8 }}
				/>

				<button style={{ flex: 1 }} disabled={createProjectDisabled} onClick={async () => {
					const newProjectId = `${username}_${new Date().getTime()}`;
					const projectOptions = { value: newProjectId, label: newProjectId };
					projectList.push({ value: newProjectId, label: newProjectId });
					setProject(projectOptions);
					setProjectName(newProjectId);
					setProjectId(newProjectId);

					// Save project
					await saveProjectData({ projectId: newProjectId, projectName: newProjectId, region, year, red, green, blue, username, sampleId, selectedSample });
				}}>+</button>

				<button style={{ flex: 1 }} disabled={createProjectDisabled} onClick={async () => {
					// Delete the project from the database
					await deleteProject({ projectId });

					// Change the project list
					const projects = projectList.filter(dict => dict.value !== projectId);
					setProjectList(projects);
					
					// Set the selected project
					setProject(undefined);
					setProjectName(undefined);
					setProjectId(undefined);
				}}>-</button>

				<button disabled={saveProjectDisabled} style={{ flex: 1 }} className='glyphicon glyphicon-floppy-disk' onClick={async () => {
					await saveProjectData({ projectId, projectName, region, year, red, green, blue, username, sampleId, selectedSample });
				}}></button>
			</div>

			<div id='create-project' className='flexible vertical space'>
				<div id='project-name'>
					Project name
					<input value={projectName} onInput={e => setProjectName(e.target.value)} disabled={projectNameDisabled} onChange={e => {
						const projects = projectList.map(dict => {
							if (dict.value == projectId) {
								dict.label = e.target.value;
							};
							return dict;
						});
						setProjectList(projects);
						setProject(projects.filter(dict => dict.value == e.target.value)[0]);
					}}
					/>
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
							Validation
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
						<Validation {...states} />
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
		setImageCheckboxDisabled,
		imageUrl, setImageUrl,
		imageGeoJson, setImageGeoJson 
	} = props;

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
				await loadImage(year.value, region.value, [ red.value, green.value, blue.value ], setImageUrl, setImageGeoJson, setMessage, setMessageColor);

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
function Validation(props){
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

				<button className='button-parameter glyphicon glyphicon-floppy-disk' disabled={sampleSelectionDisabled} style={{ flex: 1 }} onClick={async () => {
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
				}}></button>

			</div>

			<div>
				Sample name
				<input value={sampleName} disabled={sampleGenerationDisabled}
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
 * Function load image
 * @param {{ value: Number, label: Number }} year 
 * @param {{ value: String, label: String }} region 
 * @param {{ value: String, label: String }} red 
 * @param {{ value: String, label: String }} green 
 * @param {{ value: String, label: String }} blue 
 */
async function loadImage(year, region, [ red, green, blue ], setImageUrl, setImageGeoJson, setMessage, setMessageColor) {
	// Image load message
	setMessage('Preparing image...');
	setMessageColor('blue');

	// Parameter to fetch image
	const body = {
		year: year,
		region: region,
		bands: [ red, green, blue ]
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