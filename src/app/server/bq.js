'use server';

// Import packages
import { BigQuery } from '@google-cloud/bigquery';

// Main bigquery
export default async function bq(){
	// Parse env
	const key = JSON.parse(process.env.KEY);

	return new BigQuery({
		projectId: process.env.PROJECT,
		credentials: {
			client_email: key.client_email,
			private_key: key.private_key
		}
	});
}