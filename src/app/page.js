'use client';

import Script from 'next/script'
import initMap from './components/map';
import Panel from './components/panel';
import Layers from './components/layer';
import { useState, createContext } from 'react';
import { Grid } from 'gridjs-react';
import dataRegion from './components/roi.json' assert { type: 'json' }
import { lulcValueString } from './components/lulc';

// Context
export let Context = createContext();

// Main react function
export default function Home() {
  // States for show and hide layer in the map
  const [ imageCheckboxDisabled, setImageCheckboxDisabled ] = useState(true);
  const [ sampleCheckboxDisabled, setSampleCheckboxDisabled ] = useState(true);
  const [ imageCheckbox, setImageCheckbox ] = useState(true);
  const [ sampleCheckbox, setSampleCheckbox ] = useState(true);
  const [ selectedSampleCheckbox, setSelectedSampleCheckbox ] = useState(true);
  const [ labelledSampleCheckbox, setLabelledSampleCheckbox ] = useState(true);
  const [ cfDisplay, setCfDisplay ] = useState('none');
  const [ cfData, setCfData ] = useState([]);
  const [ agriCheckbox, setAgriCheckbox ] = useState(true);
  const [ selectedAgriCheckbox, setSelectedAgriCheckbox ] = useState(true);
  const [ agriCheckboxDisabled, setAgriCheckboxDisabled ] = useState(true);

  // Selected option
	const [ selectedMenu, setSelectedMenu ] = useState('image');

  // Agri features
	const [ agriFeatures, setAgriFeatures ] = useState(true);

  // Sample features for validation
	const [ sampleFeatures, setSampleFeatures ] = useState(undefined);

  // lot of states
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
    imageCheckbox, setImageCheckbox,
    sampleCheckbox, setSampleCheckbox,
    selectedSampleCheckbox, setSelectedSampleCheckbox,
    imageCheckboxDisabled, setImageCheckboxDisabled,
    sampleCheckboxDisabled, setSampleCheckboxDisabled,
    labelledSampleCheckbox, setLabelledSampleCheckbox,
    cfDisplay, setCfDisplay,
    cfData, setCfData,
    selectedMenu, setSelectedMenu,
    agriCheckbox, setAgriCheckbox,
    selectedAgriCheckbox, setSelectedAgriCheckbox,
    agriCheckboxDisabled, setAgriCheckboxDisabled,
    agriFeatures, setAgriFeatures,
    sampleFeatures, setSampleFeatures,
    saveProjectDisabled, setSaveProjectDisabled,
		regionYearDisabled, setRegionYearDisabled,
		parameterDisabled, setParameterDisabled,
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
		selectionDisplay, setSelectionDisplay,
		samplingDisplay, setSamplingDisplay,
		labellingDisplay, setLabellingDisplay,
		assessmentDisplay, setAssessmentDisplay,
		imageButtonDisabled, setImageButtonDisabled,
		samplingButtonDisabled, setSamplingButtonDisabled,
		assessmentButtonDisabled, setAssessmentButtonDisabled,
		labellingButtonDisabled, setLabellingButtonDisabled,
		sampleGenerationDisabled, setSampleGenerationDisabled,
		sampleSelectionDisabled, setSampleSelectionDisabled,
		selectedSampleSet, setSelectedSampleSet,
		sampleList, setSampleList,
		imageUrl, setImageUrl,
		imageGeoJson, setImageGeoJson
  };

  return (
    <>
      <Context.Provider value={states}>
        <ConfusionMatrix {...states} />

        <div className='flexible vertical space' id='floating'>
          <Layers {...states} />
        </div>
        
        <Canvas />
        <Panel />
        <Script
          src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"
          integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM="
          crossOrigin=""
          onLoad={() => {
            // Initiate application state
            initMap('map');
          }}
        />
      </Context.Provider>
    </>
  )
}

// Confusion matrix
function ConfusionMatrix(prop) {
  const { cfDisplay, cfData } = prop;
  const columns = Array.from(lulcValueString).map(feat => new Object({ label: feat, id: feat }));
  columns.unshift({ label: '', id: 'acc' });
  columns.push({ label: '%', id: 'acc' });
  return (
    <div style={{ display: cfDisplay }} id='cf-div'>
      <Grid
        columns={columns}
        data={cfData}
        style={{
          container: { fontSize: 'small' },
          td: { padding: 2, textAlign: 'center' },
          th: { padding: 2, textAlign: 'center' }
        }}
      />  
    </div>
  )
}

// Canvas component
function Canvas() {
  return (
    <div id='map'>

    </div>  
  )
}