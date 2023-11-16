'use server';

// Import bigquery client
import { bigquery } from "./dataClient";

/**
 * Function to login
 * @param {{ username: string, password: string }} body 
 * @returns {Promise.<{ message: string, ok: boolean }>}
 */
export default async function main(body){
	// Body
	const { username, password } = body;

	// Login query
	const login = `SELECT * FROM ${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_LOGIN} WHERE username='${username}' AND password='${password}'`

	// Job
	const [ rows ]  = await bigquery.query(login);

	// Conditional if there is no account
	if (!(rows.length)) {
		return { message: "No account with that username and password", ok: false };
	};

	// Check file list
	const sampleTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_SAMPLE}`;
	const [ result ] = await bigquery.query(`SELECT sample_id, sample_name FROM ${sampleTable} WHERE username='${username}'`);
	
	// Sample list
	const samples = [];
	if (result.length) {
		result.map(feat => samples.push({ value: feat.sample_id, label: feat.sample_name }));
	};

	// Check if there is any project locked to the account
	const projectTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_PROJECT}`;
	const [ projectQuery ] = await bigquery.query(`SELECT * FROM ${projectTable} WHERE username='${username}'`);
	const projects = [];
	if (projectQuery.length) {
		projectQuery.map(feat => projects.push({ value: feat.project_id, label: feat.project_name }));
	};

	// Check for the sample in agriculture
	const labelSampleAgri = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_LABELLING}`;
	const [ agriQuery ] = await bigquery.query(`SELECT * FROM ${labelSampleAgri} WHERE (username='${username}' AND type='agri')`);
	const agri = [];
	if (agriQuery.length) {
		agriQuery.map(feat => agri.push({ value: feat.sample_id, label: feat.sample_id }));
	};

	// Return if success
	return { message: 'Login success', ok: true, samples, projects, agri };
}