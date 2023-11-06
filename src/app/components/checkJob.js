'use server';

import { setTimeout } from 'node:timers/promises';

/**
 * Check status of query
 * @param {BigQuery} bigquery 
 * @param {BigQueryJob} job
 * @returns
 */
export default async function checkStatus(bigquery, job, output){
	const [ metadata ] = await bigquery.job(job.id).getMetadata();

	if (metadata.status.state == 'DONE'){
		return output;
	} else {
		await setTimeout(1000);
		return await checkStatus(bigquery, job);
	};
}