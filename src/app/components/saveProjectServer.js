'use server';

import { BigQuery } from '@google-cloud/bigquery';
// Import packages
import bq from './bq';
import { setTimeout } from 'node:timers/promises';

// Main function
export default async function main(body){
	// Bigquery client
	const bigquery = await bq();

	// Project table address
	const table = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_PROJECT}`;

	// Process information
	const {
		projectId,
		projectName,
		region,
		year,
		username,
		featuresId,
		selectedFeature
	} = body;

	// Check query to insert or update
	const [ queryJob ] = await bigquery.createQueryJob(`SELECT * FROM ${table} WHERE project_id = ${projectId}`);
	const [ queryRows ] = await queryJob.getQueryResults();

	// Query save
	let querySave;

	// Check length
	if (queryRows.length) {
		// Query for update
		querySave = `UPDATE ${table} 
			SET project_name='${projectName}', region='${region}', year=${year}, features_id=${featuresId}, selected_id=${selectedFeature}
			WHERE project_id=${projectId}`;		
	} else {
		// Query value for insert
		const values = `VALUES('${projectName}', ${year}, '${region}', ${projectId}, '${username}', ${featuresId}, ${selectedFeature})`;

		// Query for insert data
		querySave = `INSERT INTO ${table} ${values}`;
	};

	// Run job
	const [ updateJob ] = await bigquery.createQueryJob(querySave);

	// Status
	try {
		await setTimeout(1000);
    return await checkStatus(bigquery, updateJob); 
  } catch (error) {
    return { message: 'Project fail to save', error: error.message, ok: false }
  };
}

/**
 * Check status of query
 * @param {BigQuery} bigquery 
 * @param {BigQueryJob} job
 */
async function checkStatus(bigquery, job){
	const [ metadata ] = await bigquery.job(job.id).getMetadata();

	if (metadata.status.state == 'DONE'){
		return { message: 'Project successfully saved', ok: true };
	} else {
		await setTimeout(1000);
		return await checkStatus(bigquery, job);
	};
}