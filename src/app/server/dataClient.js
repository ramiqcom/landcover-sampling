// Import packages
import { Storage } from "@google-cloud/storage";
import { BigQuery } from '@google-cloud/bigquery';

// Parse env
const key = JSON.parse(process.env.KEY);

// Export the client
export const storage = new Storage({
	projectId: process.env.PROJECT,
	credentials: key
});

// Export bigquery
export const bigquery = new BigQuery({
	projectId: process.env.PROJECT,
	credentials: {
		client_email: key.client_email,
		private_key: key.private_key
	}
});