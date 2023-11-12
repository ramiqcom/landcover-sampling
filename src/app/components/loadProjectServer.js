'use server';

// Import bigquery
import bq from "./bq";

/**
 * Load sample from selected value
 * @param {{ projectId: string }} body 
 */
export default async function main(body){
	const { projectId } = body;

	// Bigquery client
	const bigquery = await bq();

	// Project table address
	const table = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_PROJECT}`;

	// Query the data from the 
	const [ result ] = await bigquery.query(`SELECT * FROM ${table} WHERE project_id='${projectId}'`);
	
	return result[0];
}