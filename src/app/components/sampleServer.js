'use server';

// Import package
import 'node-self';
import ee from '@google/earthengine';
import { auth, init } from './eePromise';
import pify from 'pify';

// Main function
export default async function main(body){
	const { region, year, sampleSize} = body;
	const id = `projects/${process.env.IMAGE_PROJECT}/assets/${process.env.LULC_COLLECTION}/LULC_${region}_${year}_v1`;
	
	// Key
	const key = JSON.parse(process.env.KEY);

	// Auth and init process
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
	}).map(feat =>  feat.set('id', ee.Number.parse(feat.get('system:index'))));

	// Features
	const evaluateFeatures = pify(sample.evaluate, { multiArgs: true, errorFirst: false }).bind(sample);
	const [ features, errorMessage ] = await evaluateFeatures();

	// Return evaluated features
	if (errorMessage) {
		return { message: errorMessage }
	} else {
		return features;
	}
}