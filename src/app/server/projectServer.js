'use server';

// Import packages
import { bigquery } from './dataClient';

// Project table
const projectTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_PROJECT}`;

/**
 * Function to save project
 * @param {{ projectId: number, projectName: string, region: string, year: number, username: string, featuresId: number, selectedFeature: number }} body 
 * @returns {Promise.<{ message: string, ok: boolean, error: string | undefined}>}
 */
export async function saveProject(body){
	// Status
	try {
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
		const [ queryRows ] = await bigquery.query(`SELECT * FROM ${projectTable} WHERE project_id='${projectId}'`);

		// Query save
		let querySave;

		// Check length
		if (queryRows.length) {
			// Query for update
			querySave = `UPDATE ${projectTable} 
				SET project_name='${projectName}', region='${region}', year=${year}, sample_id='${sampleId}', selected_sample=${selectedSample}, visual='${visual}'
				WHERE project_id='${projectId}'`;		
		} else {
			const values = `VALUES('${projectId}', '${projectName}', ${year}, '${region}', '${sampleId}', ${selectedSample}, '${username}', '${visual}')`;

			// Query for insert data
			querySave = `INSERT INTO ${projectTable} ${values}`;
		};

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
	try {
		const { projectId } = body;
		await bigquery.query(`DELETE FROM ${projectTable} WHERE project_id='${projectId}'`);
		return { ok: true }
	} catch (error) {
		return { message: error.message, ok: false }
	}
}

/**
 * Load sample from selected value
 * @param {{ projectId: string }} body
 * @returns {{ region: string, year: string, sample_id: string, selected_sample: number, visual: string }}
 */
export async function loadProject(body){
	try {
		const { projectId } = body;

		// Project table address
		const table = `${projectTable}`;

		// Query the data from the 
		const [ result ] = await bigquery.query(`SELECT * FROM ${table} WHERE project_id='${projectId}'`);
		
		return result[0];
	} catch (error) {
		return { message: error.message, ok: false }
	}
}