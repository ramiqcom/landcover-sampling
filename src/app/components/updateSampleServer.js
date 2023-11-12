'use server';

// Import packages
import storage from "./storage";
import bq from "./bq";

/**
 * Function to update sample in the bigquery
 * @param {{ sampleId: string, num: number, lc: number }} body 
 */
export default async function main (body) {
	// Parameter
	const { sampleId, features, time } = body;

	// Save the file to cloud storage
	const fileName = `sample/${sampleId}.geojson`;
	const gcs = await storage();
	await gcs.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));

	// Add log to database
	const bigquery = await bq();
	const sampleTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_SAMPLE}`;
	await bigquery.query(`UPDATE ${sampleTable} SET last_change=${time} WHERE sample_id='${sampleId}'`);
}