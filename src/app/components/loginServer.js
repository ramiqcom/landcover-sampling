'use server';

// Import packages
import bq from './bq';

/**
 * Function to login
 * @param {{ username: string, password: string }} body 
 * @returns {Promise.<{ message: string, ok: boolean }>}
 */
export default async function main(body){
	// Body
	const { username, password } = body;

	// Bigquery client
	const bigquery = await bq();

	// Login query
	const login = `SELECT * FROM ${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_LOGIN} WHERE username='${username}' AND password='${password}'`

	// Job
	const [ rows ]  = await bigquery.query(login);

	// Conditional if there is no account
	if (!(rows.length)) {
		return { message: "No account with that username and password", ok: false };
	};

	// Find table with the name
	const [ samples ] = await bigquery.query(`SELECT * FROM ${process.env.DATASET_SAMPLE}.__TABLES__ WHERE table_id LIKE 'Samples_${username}_%'`);

	// Return if success
	return { message: 'Login success', ok: true, samples };
}