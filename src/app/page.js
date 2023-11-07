'use client';

import Script from 'next/script'
import initMap from './components/map';
import Panel from './components/panel';
import Layers from './components/layer';
import { useState } from 'react';
import { Grid } from 'gridjs-react';
import { lulcValueString } from './components/lulc';

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
  const [ cfData, setCfData ] = useState(() => []);

  const states = {
    imageCheckbox, setImageCheckbox,
    sampleCheckbox, setSampleCheckbox,
    selectedSampleCheckbox, setSelectedSampleCheckbox,
    imageCheckboxDisabled, setImageCheckboxDisabled,
    sampleCheckboxDisabled, setSampleCheckboxDisabled,
    labelledSampleCheckbox, setLabelledSampleCheckbox,
    cfDisplay, setCfDisplay,
    cfData, setCfData 
  };

  return (
    <>
      <ConfusionMatrix {...states} />
      <Layers {...states} />
      <Canvas />
      <Panel {...states} />
      <Script
        src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"
        integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM="
				crossOrigin=""
				onLoad={() => {
					// Initiate application state
					initMap('map');
				}}
      />
    </>
  )
}

// Confusion matrix
function ConfusionMatrix(prop) {
  const { cfDisplay, cfData } = prop;
  const columns = Array.from(lulcValueString);
  columns.unshift('');
  columns.push('%')
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