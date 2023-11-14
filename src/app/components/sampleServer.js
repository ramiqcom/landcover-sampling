'use server';

// Import package
import 'node-self';
import ee from '@google/earthengine';
import { auth, init } from './eePromise';
import pify from 'pify';
import storage from './storage';
import bq from './bq';

/**
 * Function to generate sample
 * @param {{ region: string, year: number, sampleSize: number, sampleId: string, username: string, time: number }} body 
 * @returns { Promise.<{ features: GeoJSON, ok: boolean, message: string | undefined }> }
 */
export async function createSample(body){
	const { region, year, sampleSize, sampleId, username, time } = body;
	const id = `projects/${process.env.IMAGE_PROJECT}/assets/${process.env.LULC_COLLECTION}/LULC_${region}_${year}_v1`;
	
	// Key
	const key = JSON.parse(process.env.KEY);

	// Auth and init process earth engine
	await auth(key);
	await init(null, null);

	// Load image
	const image = ee.Image(id);

	// Sample generation
	const sample = image.stratifiedSample({
		numPoints: Number(sampleSize),
		scale: 30,
		region: image.geometry(),
		geometries: true
	}).map(feat =>  feat.set('num', ee.Number.parse(feat.get('system:index')), 'validation', 0));

	// Features
	const evaluateFeatures = pify(sample.evaluate, { multiArgs: true, errorFirst: false }).bind(sample);
	const [ features, errorMessage ] = await evaluateFeatures();

	// Return evaluated features
	if (errorMessage) {
		return { message: errorMessage, ok: false };
	};

	// Save the file to cloud storage
	const fileName = `sample/${sampleId}.geojson`;
	const gcs = await storage();
	features.properties = {
		region,
		year,
		sampleId,
		sampleName: sampleId
	};
	await gcs.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));
	
	// Add log to database
	const bigquery = await bq();
	const valuesTable = `VALUES ('${sampleId}', '${sampleId}', '${username}', ${time}, ${time})`;
	await bigquery.query(`INSERT INTO ${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_SAMPLE} ${valuesTable}`);

	return { features, ok: true };
}

/**
 * Function to load saved sample from the database
 * @param {{ sampleId: string }} body 
 * @returns {Promise.<{ features: GeoJSON | undefined, ok: boolean, message: string | undefined }>}
 */
export async function loadSample(body){
	// get sample id
	const { sampleId } = body;

	// Query sample
	try {
		const gcs = await storage();
		const file = await gcs.bucket(process.env.BUCKET).file(`sample/${sampleId}.geojson`).download();
		const geojson = JSON.parse(file[0].toString());
		return { features: geojson, ok: true };
	} catch (error) {
		return { ok: false, message: error.message }	
	}
}

/**
 * Function to update sample in the bigquery
 * @param {{ sampleId: string, num: number, lc: number }} body 
 */
export async function updateSample(body) {
	// Parameter
	const { sampleId, features, time } = body;

	// Save the file to cloud storage
	const fileName = `sample/${sampleId}.geojson`;
	const gcs = await storage();
	await gcs.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));

	// Add log to database
	const bigquery = await bq();
	const sampleTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_SAMPLE}`;
	await bigquery.query(`UPDATE ${sampleTable} SET last_change=${time} WHERE sample_id='${sampleId}'`);
}

/**
 * Function to save sample name
 * @param {{ sampleId: string, sampleName: string }} body 
 */
export async function updateSampleName(body){
	// Parameter for saving sample name
	const { sampleId, sampleName } = body;

	// Load bigquery client
	const bigquery = await bq();

	// Save to the database
	const sampleTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_SAMPLE}`;
	await bigquery.query(`UPDATE ${sampleTable} SET sample_name='${sampleName}' WHERE sample_id='${sampleId}'`);
}