'use server';

// Import bigquery client
import bq from "./bq";

/**
 * Function to save sample name
 * @param {{ sampleId: string, sampleName: string }} body 
 */
export default async function main(body){
	// Parameter for saving sample name
	const { sampleId, sampleName } = body;

	// Load bigquery client
	const bigquery = await bq();

	// Save to the database
	const sampleTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_SAMPLE}`;
	await bigquery.query(`UPDATE ${sampleTable} SET sample_name='${sampleName}' WHERE sample_id='${sampleId}'`);
}