'use server';

// Import packages
import bq from './bq';

export default async function main(body){
	// Bigquery client
	const bigquery = await bq();

	// Login query
	const login = `SELECT * FROM ${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_LOGIN} WHERE username='${body.username}' AND password='${body.password}'`

	// Job
	const [ job ]  = await bigquery.createQueryJob(login);

	// Rows
	const [ rows ] = await job.getQueryResults();

	// Send conditional
	if (rows.length) {
		return { message: 'Login success', ok: true };
	} else {
		return { message: "No account with that username and password", ok: false };
	};
}