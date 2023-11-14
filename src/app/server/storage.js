'use server';

import { Storage } from "@google-cloud/storage";

/**
 * Function to authenticate cloud storage
 * @returns {Promise.<Storage>}
 */
export default async function storage(){
	// Parse env
	const key = JSON.parse(process.env.KEY);

	return new Storage({
		projectId: process.env.PROJECT,
		credentials: key
	});
}