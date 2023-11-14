'use server';

// Import packages
import bq from './bq';

/**
 * Function to save project
 * @param {{ projectId: number, projectName: string, region: string, year: number, username: string, featuresId: number, selectedFeature: number }} body 
 * @returns {Promise.<{ message: string, ok: boolean, error: string | undefined}>}
 */
export async function saveProject(body){
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
		visual,
		username,
		sampleId,
		selectedSample
	} = body;

	// Check query to insert or update
	const [ queryRows ] = await bigquery.query(`SELECT * FROM ${table} WHERE project_id='${projectId}'`);

	// Query save
	let querySave;

	// Check length
	if (queryRows.length) {
		// Query for update
		querySave = `UPDATE ${table} 
			SET project_name='${projectName}', region='${region}', year=${year}, sample_id='${sampleId}', selected_sample=${selectedSample}, visual='${visual}'
			WHERE project_id='${projectId}'`;		
	} else {
		const values = `VALUES('${projectId}', '${projectName}', ${year}, '${region}', '${sampleId}', ${selectedSample}, '${username}', '${visual}')`;

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

/**
 * Delete project
 * @param {{ projectId: string }} body 
 */
export async function deleteProject(body){
	const { projectId } = body;
	const bigquery = await bq();
	await bigquery.query(`
		DELETE FROM ${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_PROJECT}
		WHERE project_id='${projectId}'
	`);
}

/**
 * Load sample from selected value
 * @param {{ projectId: string }} body
 * @returns {{ region: string, year: string, sample_id: string, selected_sample: number, visual: string }}
 */
export async function loadProject(body){
	const { projectId } = body;

	// Bigquery client
	const bigquery = await bq();

	// Project table address
	const table = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_PROJECT}`;

	// Query the data from the 
	const [ result ] = await bigquery.query(`SELECT * FROM ${table} WHERE project_id='${projectId}'`);
	
	return result[0];
}