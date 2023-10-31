'use server';

// Import packages
import bq from './bq';
import { setTimeout } from 'node:timers/promises';

// Main function
export default async function main(body){
	// Bigquery client
	const bigquery = await bq();

	// Project table address
	const table = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_PROJECT}`;
	console.log(table);

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
	console.log(queryRows);

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

	// Delay for 1 seconds
	await setTimeout(1000);

	// Status
	try {
    const [ metadata ] = await bigquery.job(updateJob.id).getMetadata();
		console.log(metadata);
    if (metadata.status.state == 'DONE'){
			return { message: 'Project successfully saved', ok: true };
		};
  } catch (error) {
    return { message: 'Project fail to save', error, ok: false }
  };
}