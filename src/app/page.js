'use client';

import Script from 'next/script'
import initMap from './components/map';
import Panel from './components/panel';
import Layers from './components/layer';
import { useState } from 'react';

// Main react function
export default function Home() {
  // States for show and hide layer in the map
  const [ imageCheckboxDisabled, setImageCheckboxDisabled ] = useState(true);
  const [ sampleCheckboxDisabled, setSampleCheckboxDisabled ] = useState(true);
  const [ selectedSampleCheckboxDisabled, setSelectedSampleCheckboxDisabled ] = useState(true);
  const [ imageCheckbox, setImageCheckbox ] = useState(true);
  const [ sampleCheckbox, setSampleCheckbox ] = useState(true);
  const [ selectedSampleCheckbox, setSelectedSampleCheckbox ] = useState(true);

  const states = {
    imageCheckbox, setImageCheckbox,
    sampleCheckbox, setSampleCheckbox,
    selectedSampleCheckbox, setSelectedSampleCheckbox,
    imageCheckboxDisabled, setImageCheckboxDisabled,
    sampleCheckboxDisabled, setSampleCheckboxDisabled,
    selectedSampleCheckboxDisabled, setSelectedSampleCheckboxDisabled
  };

  return (
    <>
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

// Canvas component
function Canvas() {
  return (
    <div id='map'>

    </div>  
  )
}