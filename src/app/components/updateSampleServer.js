'use server';

// Import packages
import storage from "./storage";

/**
 * Function to update sample in the bigquery
 * @param {{ sampleId: string, num: number, lc: number }} body 
 */
export default async function main (body) {
	// Parameter
	const { sampleId, features } = body;

	// Save the file to cloud storage
	const fileName = `sample/${sampleId}.geojson`;
	const gcs = await storage();
	await gcs.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));
}