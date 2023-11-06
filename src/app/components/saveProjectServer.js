'use server';

// Import packages
import bq from './bq';
import { setTimeout } from 'node:timers/promises';
import checkStatus from './checkJob';

/**
 * Function to save project
 * @param {{ projectId: number, projectName: string, region: string, year: number, username: string, featuresId: number, selectedFeature: number }} body 
 * @returns {Promise.<{ message: string, ok: boolean, error: string | undefined}>}
 */
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
    return await checkStatus(bigquery, updateJob, { message: 'Project successfully saved', ok: true }); 
  } catch (error) {
    return { message: 'Project fail to save', error: error.message, ok: false }
  };
}