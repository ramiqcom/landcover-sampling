'use server';

// Import bigquery client
import bq from "./bq";

// Main function
export default async function main(body){
	const { projectId } = body;
	const bigquery = await bq();
	await bigquery.query(`
		DELETE FROM ${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_PROJECT}
		WHERE project_id='${projectId}'
	`)
}