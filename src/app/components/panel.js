// Import some packages
import { useContext, useEffect } from 'react';
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
import { Context } from '../page';

// Panel function as app handler
export default function Panel(){
	return (
		<div id='panel' className="flexible vertical space">
			<div id='title-panel'>
				Land cover sampling
			</div>

			<Login />
			<Application />

		</div>
	)
}

// Application
function Application(){
	const { appState } = useContext(Context);

	return (
		<div id='application' className='flexible vertical space' style={{ display: appState }}>
			<Project />
		</div>
	)
}

// Project select
function Project(){
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
		saveProjectDisabled, setSaveProjectDisabled,
		regionYearDisabled, setRegionYearDisabled,
		setParameterDisabled,
		projectName, setProjectName,
		projectNameDisabled, setProjectNameDisabled,
		createProjectDisabled, setCreateProjectDisabled,
		years, year, setYear,
		regions, region, setRegion,
		red, setRed,
		green, setGreen,
		blue, setBlue,
		message, setMessage,
		messageColor, setMessageColor,
		setSelectionDisplay,
		setSamplingDisplay,
		setLabellingDisplay,
		setAssessmentDisplay,
		imageButtonDisabled, setImageButtonDisabled,
		samplingButtonDisabled, setSamplingButtonDisabled,
		assessmentButtonDisabled, setAssessmentButtonDisabled,
		labellingButtonDisabled, setLabellingButtonDisabled,
		setSampleGenerationDisabled,
		setSelectedSampleSet,
		setImageUrl,
		setImageGeoJson
	} = useContext(Context);

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
						<Selection />
						<Labelling />
						<Validation />
						<Assessment />
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
function Selection(){
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
	} = useContext(Context);

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