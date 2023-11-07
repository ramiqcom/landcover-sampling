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
	const samples = [];
	if (result.length) {
		result.map(feat => samples.push(feat.name.split(/[\/.]/)[1]));
	}

	// Check if there is any project locked to the account
	const projectTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_PROJECT}`;
	const [ projectQuery ] = await bigquery.query(`SELECT * FROM ${projectTable} WHERE username='${username}'`);
	const projects = [];
	if (projectQuery.length) {
		projectQuery.map(feat => projects.push({ value: feat.project_id, label: feat.project_name }));
	}

	// Return if success
	return { message: 'Login success', ok: true, samples, projects };
}