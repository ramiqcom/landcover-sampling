'use server';

// Import packages
import 'node-self';
import ee from '@google/earthengine';
import { auth, init, mapid } from './eePromise';

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

	// Data prefix
	const collection = `projects/${process.env.IMAGE_PROJECT}/assets/${process.env.IMAGE_COLLECTION}`;

	// Get the new image
	const image = ee.Image(`${collection}/${region}_${year}`);

	// Visualized image
	const visualized = visual(image, bands);

	// Get visualized data
	const [ obj, err ] = await mapid({ image: visualized });

	// Conditional if failed
	if (err) {
		return { message: err, ok: false };
	} else {
		return { url: obj.urlFormat, ok: true };
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
  const min = [];
  const max = [];
  bands.map(band => {
    min.push(percent.get(band + '_p1'));
    max.push(percent.get(band + '_p99'));
  });
  return image.visualize({ bands, min, max });
}