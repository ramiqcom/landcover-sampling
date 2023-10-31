// Import some packages
import { useState } from 'react';
import Select from 'react-select';
import Login from './login';
import { Map, Tile } from './map';
import tile from './tileServer';
import saveProject from './saveProjectServer';

// Panel function as app handler
export default function Panel(){
	const [ loginPage, setLoginPage ] = useState('flex');
	const [ appState, setAppState ] = useState('none');
	const [ projectList, setProjectList ] = useState(null);
	const [ project, setProject ] = useState(null);
	const [ projectListDisabled, setProjectListDisabled ] = useState(true);
	const [ projectId, setProjectId ] = useState(null);
	const [ username, setUsername ] = useState("");
	const [ featuresId, setFeaturesId ] = useState(null);
	const [ selectedFeature, setSelectedFeature ] = useState(null);

	// List of state
	const states = {
		loginPage, setLoginPage,
		appState, setAppState,
		projectList, setProjectList,
		project, setProject,
		projectListDisabled, setProjectListDisabled,
		projectId, setProjectId,
		username, setUsername,
		featuresId, setFeaturesId,
		selectedFeature, setSelectedFeature
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
	const { projectList, project, setProject, projectListDisabled, setProjectId } = props;

	// Image and sample parameter
	const [ parameterDisabled, setParameterDisabled ] = useState(true);

	// Project name
	const [ projectName, setProjectName ] = useState("");

	// Year state
	const [year, setYear] = useState({ label: '2022', value: 2022 });

	// Region state
	const [ region, setRegion ] = useState({ value: 'Sumatera', label: 'Sumatera' });

	// Bands state
	const [ red, setRed ] = useState({ value: 'B5', label: 'B5' });
	const [ green, setGreen ] = useState({ value: 'B6', label: 'B6' });
	const [ blue, setBlue ] = useState({ value: 'B7', label: 'B7' });

	// Messages
	const [ message, setMessage ] = useState(null);

	// Message color
	const [ messageColor, setMessageColor ] = useState('blue');

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
		...props
	};

	return (
		<>
			<div id='load-project' className='flexible vertical space'>
				<Select 
					options={projectList}
					value={project}
					isDisabled={projectListDisabled}
					placeholder={'Create a new project first!'}
					onChange={value => value ? setProject(value) : null}
				/>
				<button disabled={projectListDisabled}>Load project</button>
			</div>
			
			<div id='create-project' className='flexible vertical space'>
				<button onClick={async () => {
					setProjectName("");
					setProjectId(new Date().getTime());

					// Load image to map
					await loadImage(year, region, [red, green, blue], setParameterDisabled, setMessage, setMessageColor);
				}}>Create a new project</button>
				<Selection {...states} />
			</div>
		</>	
	)
}

// Data selection
function Selection(props){
	// Parameter disabled
	const { 
		projectName, setProjectName,
		parameterDisabled, setParameterDisabled,
		year, setYear,
		region, setRegion,
		red, setRed,
		green, setGreen,
		blue, setBlue,
		message, setMessage,
		messageColor, setMessageColor,
		projectId,
		username,
		featuresId,
		selectedFeature,
	} = props;

	// Years selection
	let years = [ 2012, 2017, 2022 ];
	years = years.map(year => new Object({ label: year, value: year }));

	// Region list
	let regions = [ 'Sumatera', 'KepriBabel', 'JawaBali', 'Kalimantan', 'Sulawesi', 'Nusra', 'Maluku', 'MalukuUtara', 'Papua', 'PeninsularMalaysia', 'BorneoMalaysia' ];
	regions = regions.map(region => new Object({ label: region, value: region }));

	// Bands list
	let bands = [ 'B2', 'B3', 'B4', 'B5', 'B6', 'B7' ];
	bands = bands.map(value => new Object({ value: value, label: value }));

	return (
		<div id='parameter' className='flexible vertical space'>

			<div id='project-name'>
				Project name
				<input disabled={parameterDisabled} value={projectName} onChange={e => setProjectName(e.target.value)}/>
			</div>

			<Select
				options={regions}
				value={region}
				onChange={value => setRegion(value)}
				isDisabled={parameterDisabled}
			/>

			<Select
				options={years}
				value={year}
				onChange={value => setYear(value)}
				isDisabled={parameterDisabled}
			/>

			<div id='bands' className='flexible'>
				<Select
					options={bands}
					isDisabled={parameterDisabled}
					value={red}
					onChange={value => setRed(value)}
				/>
				<Select
					options={bands}
					isDisabled={parameterDisabled}
					value={green}
					onChange={value => setGreen(value)}
				/>
				<Select
					options={bands}
					isDisabled={parameterDisabled}
					value={blue}
					onChange={value => setBlue(value)}
				/>
			</div>

			<button disabled={parameterDisabled} onClick={async () => {
				// Load image to map
				await loadImage(year, region, [red, green, blue], setParameterDisabled, setMessage, setMessageColor);
			}}>Show image</button>

			<button disabled={parameterDisabled} onClick={async () => {
				// Show error message if project name is empty
				if (!projectName){
					setMessage('Project name is empty!');
				} else {
					// Save message
					setMessage('Saving...');
					setMessageColor('blue');
					setParameterDisabled(true);

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
					const response = await saveProject(body, 'create');

					// Condiitional if data is saved
					if (response.ok){
						setMessage(response.message);
						setMessageColor('green');
					} else {
						setMessage(`${response.message}: ${response.error}`);
						setMessageColor('red');
					};

					// Turn on parameter button again
					setParameterDisabled(false);
				};
			}}>Save project</button>

			<div id='panel-message' className='message' onClick={() => setMessage(null)} style={{ color: messageColor }}>
				{message}
			</div>
			
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
async function loadImage(year, region, [ red, green, blue ], setParameterDisabled, setMessage, setMessageColor){
	// Disabled button
	setParameterDisabled(true);

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
		setMessage(null);
	} else {
		// Show error message
		setMessage(result.message);
		setMessageColor('red');
	};

	// Enable button again
	setParameterDisabled(false);
}