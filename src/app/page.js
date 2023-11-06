'use client';

import Script from 'next/script'
import initMap from './components/map';
import Panel from './components/panel';
import Layers from './components/layer';

// Main react function
export default function Home() {
  return (
    <>
      <Layers />
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