'use server';

// Import bigquery
import storage from "./storage";

/**
 * Function to load saved sample from the database
 * @param {{ sampleId: string }} body 
 * @returns {Promise.<{ features: GeoJSON | undefined, ok: boolean, message: string | undefined }>}
 */
export default async function main(body){
	// get sample id
	const { sampleId } = body;

	// Query sample
	try {
		const gcs = await storage();
		const file = await gcs.bucket(process.env.BUCKET).file(`sample/${sampleId}.geojson`).download();
		const geojson = JSON.parse(file[0].toString());
		return { features: geojson, ok: true };
	} catch (error) {
		return { ok: false, message: error.message }	
	}
}