// Import some packages
import { useEffect, useState } from 'react';
import Select from 'react-select';
import Login from './login';
import Validation from './validation';
import Labelling from './labelling';
import Assessment from './assessment';
import { toggleFeatures } from './utilities';
import { Map, Tile } from './map';
import { tile } from '../server/tileServer';
import dataRegion from './roi.json' assert { type: 'json' }
import { saveProject, loadProject, deleteProject } from '../server/projectServer';

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
	const [ sampleAgriList, setSampleAgriList ] = useState([]);

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
		sampleAgriList, setSampleAgriList,
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
		setProjectList,
		setSelectedMenu,
		sampleFeatures, setSampleFeatures
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
	let regions = Object.keys(dataRegion);
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

	// Labelling display
	const [ labellingDisplay, setLabellingDisplay ] = useState('none');

	// Assessment display
	const [ assessmentDisplay, setAssessmentDisplay ] = useState('none')

	// Image and sampling button
	const [ imageButtonDisabled, setImageButtonDisabled ] = useState(true);
	const [ samplingButtonDisabled, setSamplingButtonDisabled ] = useState(false);
	const [ assessmentButtonDisabled, setAssessmentButtonDisabled ] = useState(false);
	const [ labellingButtonDisabled, setLabellingButtonDisabled ] = useState(false);


	// Sample parameter disabled button
	const [ sampleGenerationDisabled, setSampleGenerationDisabled ] = useState(false);
	const [ sampleSelectionDisabled, setSampleSelectionDisabled ] = useState(true);

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
			setMessage('Saving project...');
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
		labellingDisplay, setLabellingDisplay,
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
							setSelectedMenu('image');

							setImageButtonDisabled(true);
							setSamplingButtonDisabled(false);
							setAssessmentButtonDisabled(false);
							setLabellingButtonDisabled(false);
							setSamplingDisplay('none');
							setSelectionDisplay('flex');
							setAssessmentDisplay('none');
							setLabellingDisplay('none');
						}}>
							Image
						</button>

						<button className='select-button' disabled={labellingButtonDisabled} onClick={() => {
							setSelectedMenu('labelling');

							setImageButtonDisabled(false);
							setSamplingButtonDisabled(false);
							setAssessmentButtonDisabled(false);
							setLabellingButtonDisabled(true);
							setSamplingDisplay('none');
							setSelectionDisplay('none');
							setAssessmentDisplay('none');
							setLabellingDisplay('flex');
						}}>
							Labelling
						</button>

						<button className='select-button' disabled={samplingButtonDisabled} onClick={() => {
							setSelectedMenu('validation');

							setImageButtonDisabled(false);
							setSamplingButtonDisabled(true);
							setAssessmentButtonDisabled(false);
							setLabellingButtonDisabled(false);
							setSamplingDisplay('flex');
							setSelectionDisplay('none');
							setAssessmentDisplay('none');
							setLabellingDisplay('none');
						}}>
							Validation
						</button>

						<button className='select-button' disabled={assessmentButtonDisabled} onClick={() => {
							setSelectedMenu('assessment');
							
							setImageButtonDisabled(false);
							setSamplingButtonDisabled(false);
							setAssessmentButtonDisabled(true);
							setLabellingButtonDisabled(false);
							setSamplingDisplay('none');
							setSelectionDisplay('none');
							setAssessmentDisplay('flex');
							setLabellingDisplay('none');
						}}>
							Assessment
						</button>
					</div>
					
					<div id='menu' className='flexible-space'>
						<Selection {...states} />
						<Labelling {...states} />
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
				try {
					// Enable button again
					toggleFeatures(true, [
						setRegionYearDisabled,
						setParameterDisabled
					]);

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
					const { url, ok, message } = await tile(body);

					// If the process error tile if it is error
					if (!ok) {
						throw new Error(message);
					}
									
					// Set image url
					setImageUrl(url);

					// Set the geojson
					const geojson = dataRegion[region.value];
					setImageGeoJson(geojson);

					// Add tile to map
					Tile.setUrl(url);
					
					// Zoom to tile
					const bounds = L.geoJSON(geojson).getBounds();
					Map.fitBounds(bounds, { maxZoom: 14 });

					// Hide message
					setMessage(undefined);
				} catch (error) {
					// Show error if it is actually broken
					setMessage(error.message);
					setMessageColor('red')
				} finally {
					// Enable button again
					toggleFeatures(false, [
						setRegionYearDisabled,
						setParameterDisabled
					]);
				}				
			}}>Show image</button>
			
		</div>
	)
}