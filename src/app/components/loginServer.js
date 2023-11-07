'use server';

// Import packages
import storage from "./storage";
import bq from "./bq";

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

	// Find file with that name
	const gcs = await storage();

	// Check file list
	const [ result, error ] = await gcs.bucket(process.env.BUCKET).getFiles({ prefix: `sample/${username}_` });
	
	// Sample list
	let samples;
	if (!(result.length)) {
		samples = []
	} else {
		samples = result.map(feat => feat.name.split(/[\/.]/)[1]);
	}

	// Return if success
	return { message: 'Login success', ok: true, samples };
}