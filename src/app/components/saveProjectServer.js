'use server';

// Import packages
import bq from './bq';

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
		sampleId,
		selectedSample
	} = body;

	// Check query to insert or update
	const [ queryRows ] = await bigquery.query(`SELECT * FROM ${table} WHERE project_id='${projectId}'`);

	// Query save
	let querySave;

	console.log(`VALUES('${projectId}', '${projectName}', '${region}', ${year}, null, null, '${username}')`);

	// Check length
	if (queryRows.length) {
		// Query for update
		querySave = `UPDATE ${table} 
			SET project_name='${projectName}', region='${region}', year=${year}, sample_id='${featuresId}', selected_sample=${selectedFeature}
			WHERE project_id='${projectId}'`;		
	} else {
		const values = `VALUES('${projectId}', '${projectName}', ${year}, '${region}', '${sampleId}', ${selectedSample}, '${username}')`;
		console.log(values);
		
		// Query for insert data
		querySave = `INSERT INTO ${table} ${values}`;
	};

	// Status
	try {
		await bigquery.query(querySave);
    return { message: 'Project successfully saved', ok: true }; 
  } catch (error) {
    return { message: 'Project fail to save', error: error.message, ok: false }
  };
}