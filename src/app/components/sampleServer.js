'use server';

// Import package
import 'node-self';
import ee from '@google/earthengine';
import { auth, init } from './eePromise';
import pify from 'pify';
import storage from './storage';

/**
 * Function to generate sample
 * @param {{ region: string, year: number, sample: number }} body 
 * @returns { Promise.<{ features: GeoJSON, ok: boolean, message: string | undefined }> }
 */
export default async function main(body){
	const { region, year, sampleSize, sampleId } = body;
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
		numPoints: sampleSize,
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

	// Check if file is uploaded
	const [ result, error ] = await gcs.bucket(process.env.BUCKET).getFiles({ prefix: fileName });
	const fileMetadata = await result[0].getMetadata();
	const readyFileName = fileMetadata[0].name;

	// If error on saving
	if (readyFileName) {
		return { features, ok: true };
	} else {
		return { message: 'The fetures cannot be uploaded', ok: false };
	};
}