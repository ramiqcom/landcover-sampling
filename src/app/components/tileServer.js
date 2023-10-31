'use server';

// Import packages
import pify from 'pify';
import 'node-self';
import ee from '@google/earthengine';

// Promisify some function
const eeCallback = { multiArgs: true, errorFirst: false };
const auth = pify(ee.data.authenticateViaPrivateKey);
const init = pify(ee.initialize);
const mapid = pify(ee.data.getMapId, eeCallback);

// Main function
export default async function main(body){
	// Key
	const key = JSON.parse(process.env.KEY);

	// Run
	await auth(key);
	await init(null, null);
	return await tile(body);
}

/**
 * Function to generate ee.Image tile
 * @param {{ Region: String, Year: Number, Bands: [ String, String, String ] }} body 
 * @returns {Promise<{ url: URL, geojson: GeoJSON } | { message: String }>}
 */
async function tile(body){
	// Payload
	const { region, year, bands } = body;

	// Image name
	const imageName = region + '_' + year; 

	// Data prefix
	var prefix = `projects/${process.env.IMAGE_PROJECT}/assets/calibrated_landsat_v2_multitemporal/Landsat_`;
	var suffix = '_Calibrated_Modis_v2_multitemporal';

	// Variables
	let image;
	let roi;

	// Get the new image
	if (region !== 'PeninsularMalaysia' && region !== 'BorneoMalaysia'){
		image = ee.Image(prefix + imageName + suffix);
		roi = image.geometry();
	} else {
		image = ee.ImageCollection(`projects/${process.env.IMAGE_PROJECT}/assets/calibrated_landsat_v6_multTemporalWithMalaysia`).filter(
			ee.Filter.and(
				ee.Filter.eq('year', year),
				ee.Filter.eq('region', region)
			)
		);
		roi = image.geometry();
		image = image.median().clip(roi);
	};

	// Evaluated geometry
	let evalRoi;
	roi.evaluate(data => evalRoi = data);

	// Visualized image
	const visualized = visual(image, bands);

	// Get visualized data
	const [obj, err] = await mapid({ image: visualized });

	// Conditional if failed
	if (err) {
		return { message: err, ok: false };
	} else {
		return { url: obj.urlFormat, geojson: evalRoi, ok: true };
	};
}

/**
 * Image stretch visualization
 * @param {ee.Image} image 
 * @param {[ String, String, String ]} bands 
 * @returns { ee.Image }
 */
function visual(image, bands){
  // Percentile
  const percent = image.select(bands).reduceRegion({
    geometry: image.geometry(),
    scale: 300,
    maxPixels: 1e13,
    reducer: ee.Reducer.percentile([1, 99])
  });
  const bandVis = bands;
  const min = [];
  const max = [];
  bandVis.map(band => {
    min.push(percent.get(band + '_p1'));
    max.push(percent.get(band + '_p99'));
  });
  return image.visualize({ bands, min, max });
}