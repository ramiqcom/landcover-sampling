'use server';

// Import packages
import 'node-self';
import ee from '@google/earthengine';
import { auth, init, mapid } from './eePromise';
import regions from '../components/roi.json' assert { type: 'json' };

// Key
const key = JSON.parse(process.env.KEY);

// Region names
const regionNames = Object.keys(regions);
const regionValues = {};
for (let i = 0; i <= regionNames.length - 1; i++){
	regionValues[regionNames[i]] = i + 1
}

/**
 * Function to generate ee.Image tile
 * @param {{ Region: String, Year: Number, Bands: [ String, String, String ] }} body 
 * @returns {Promise<{ url: URL, geojson: GeoJSON } | { message: String }>}
 */
export async function tile(body){
	try {
		// Run
		await auth(key);
		await init(null, null);

		// Payload
		const { region, year, bands } = body;

		// Get the new image
		const image = await compositeImage(region, year);

		// Visualized image
		const visualized = visual(image, bands);

		// Get visualized data
		const [ obj, err ] = await mapid({ image: visualized });

		// If get tile error return error
		if (err) {
			throw new Error(err);
		}

		// Return object if succedd
		return { url: obj.urlFormat, ok: true };
	} catch (error) {
		return { message: error.message, ok: false };
	}
}

/**
 * Function to composite an image based on region and year
 * @param {string} region
 * @param {number} year
 * @returns {ee.Image}
 */
export async function compositeImage(region, year) {
	// Image collection
	const collection = ee.ImageCollection(`projects/${process.env.IMAGE_PROJECT}/assets/${process.env.IMAGE_COLLECTION}`);

	// Region mask
	const regionMask = ee.Image(`projects/${process.env.IMAGE_PROJECT}/assets/${process.env.REGION_MASK}`).eq(regionValues[region]);

	// Image
	const image = collection.filter(ee.Filter.eq('year', year)).mosaic().updateMask(regionMask);

	return image;
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
    scale: 1000,
    maxPixels: 1e13,
    reducer: ee.Reducer.percentile([1, 99])
  });
  const min = [];
  const max = [];
  bands.map(band => {
    min.push(percent.get(band + '_p1'));
    max.push(percent.get(band + '_p99'));
  });
  return image.visualize({ bands, min, max });
}