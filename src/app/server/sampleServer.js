'use server';

// Import package
import 'node-self';
import ee from '@google/earthengine';
import { auth, init, mapid } from './eePromise';
import pify from 'pify';
import { storage, bigquery } from './dataClient';
import { compositeImage } from './tileServer';

// Key
const key = JSON.parse(process.env.KEY);

// Sample table
const sampleTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_SAMPLE}`;

// Labelling table
const labelTable = `${process.env.PROJECT}.${process.env.DATASET_ACCOUNT}.${process.env.TABLE_LABELLING}`;

/**
 * Function to generate sample
 * @param {{ region: string, year: number, sampleSize: number, sampleId: string, username: string, time: number }} body 
 * @returns { Promise.<{ features: GeoJSON, ok: boolean, message: string | undefined }> }
 */
export async function createSample(body){
	// Auth and init process earth engine
	await auth(key);
	await init(null, null);

	const { region, year, sampleSize, sampleId, username, time } = body;
	const id = `projects/${process.env.IMAGE_PROJECT}/assets/${process.env.LULC_COLLECTION}/${region}_${year}`;

	// Load image
	const image = ee.Image(id);

	// Sample generation
	const sample = image.stratifiedSample({
		numPoints: Number(sampleSize),
		scale: 30,
		region: image.geometry(),
		geometries: true
	}).randomColumn().sort('random')
		.map(feat =>  feat.set('validation', 0));

	// Features
	const evaluateFeatures = pify(sample.evaluate, { multiArgs: true, errorFirst: false }).bind(sample);
	const [ features, errorMessage ] = await evaluateFeatures();

	// If cannot be evaluated send error data
	if (errorMessage) {
		return { message: errorMessage, ok: false };
	};

	// Visualized features
	const featuresVisual = sample.style({ color: 'DodgerBlue', pointSize: 5, fillColor: '00000000' });
	const [ obj, error ] = await mapid({ image: featuresVisual });

	// If cannot be visualized send error data
	if (error) {
		return { message: error, ok: false };
	};

	// Save the file to cloud storage
	const fileName = `sample/${sampleId}.geojson`;
	features.properties = {
		region,
		year,
		sampleId,
		sampleName: sampleId
	};
	await storage.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));
	
	// Add log to database
	const valuesTable = `VALUES ('${sampleId}', '${sampleId}', '${username}', ${time}, ${time})`;
	await bigquery.query(`INSERT INTO ${sampleTable} ${valuesTable}`);

	return { features, ok: true, tile: obj.urlFormat };
}

/**
 * Function to load saved sample from the database
 * @param {{ sampleId: string }} body 
 * @returns {Promise.<{ features: GeoJSON | undefined, ok: boolean, message: string | undefined }>}
 */
export async function loadSample(body){
	// Auth and init process earth engine
	await auth(key);
	await init(null, null);

	// get sample id
	const { sampleId } = body;

	// Query sample
	try {
		const file = await storage.bucket(process.env.BUCKET).file(`sample/${sampleId}.geojson`).download();
		const geojson = JSON.parse(file[0].toString());

		// Load tile url from features
		const visualized = ee.FeatureCollection(geojson).style({ color: 'DodgerBlue', pointSize: 5, fillColor: '00000000' });
		const [ obj, error ] = await mapid({ image: visualized });

		if (error) {
			return { ok: false, message: error.message }
		}

		return { features: geojson, ok: true, tile: obj.urlFormat };
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
	await storage.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));

	// Update in the bigquery
	await bigquery.query(`UPDATE ${sampleTable} SET last_change=${time} WHERE sample_id='${sampleId}'`);
}

/**
 * Function to save sample name
 * @param {{ sampleId: string, sampleName: string }} body 
 */
export async function updateSampleName(body){
	// Parameter for saving sample name
	const { sampleId, sampleName } = body;

	// Update sample name in the bigquery
	await bigquery.query(`UPDATE ${sampleTable} SET sample_name='${sampleName}' WHERE sample_id='${sampleId}'`);
}

export async function deleteSample(body){
	// Parameter to delete sample
	const { sampleId } = body;

	// Delete sample from database
	await bigquery.query(`DELETE FROM ${sampleTable} WHERE sample_id='${sampleId}'`);
}

/**
 * Function to generate agriculture sample
 * @param {{ region: string, year: number }} body
 * @returns {Promise.<{ features: GeoJSON | undefined, ok: boolean }>}
 */
export async function agriSample(body){
	// Auth and init process earth engine
	await auth(key);
	await init(null, null);

	// Parameter
	const { sampleId, region, year, type, username, time } = body;

	// Composite image
	const image = await compositeImage(region, year);

	// NBR
	const nbr = image.expression('NBR = (NIR - SWIR2) / (NIR + SWIR2)', {
		NIR: image.select('B5'),
		SWIR2: image.select('B7'),
	});

	// Group
	const group = ee.Image(0).where(nbr.lte(0.1), 1)
		.where(nbr.gt(0.1).and(nbr.lte(0.2)), 2)
		.where(nbr.gt(0.2).and(nbr.lte(0.3)), 3)
		.where(nbr.gt(0.3).and(nbr.lte(0.4)), 4)
		.where(nbr.gt(0.4).and(nbr.lte(0.5)), 5)
		.where(nbr.gt(0.5).and(nbr.lte(0.6)), 6)
		.where(nbr.gt(0.6).and(nbr.lte(0.7)), 7)
		.where(nbr.gt(0.7).and(nbr.lte(0.8)), 8)
		.where(nbr.gt(0.8).and(nbr.lte(0.9)), 9)
		.where(nbr.gt(0.9), 9)
		.selfMask()
		.rename('group');

	// Sample
	const sample = group.stratifiedSample({
		numPoints: 500,
		region: image.geometry(),
		geometries: true,
		scale: 300
	}).randomColumn().sort('random');

	// Features
	const evaluateFeatures = pify(sample.evaluate, { multiArgs: true, errorFirst: false }).bind(sample);
	const [ features, errorMessage ] = await evaluateFeatures();

	// Return evaluated features
	if (errorMessage) {
		return { message: errorMessage, ok: false };
	};

	// Save the file to cloud storage
	const fileName = `sample_labelling/${sampleId}.geojson`;
	features.properties = {
		region,
		year,
		sampleId,
		sampleName: sampleId
	};
	await storage.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));
	
	// Add log to database
	const valuesTable = `VALUES ('${sampleId}', '${sampleId}', '${username}', ${time}, ${time}, '${type}')`;
	await bigquery.query(`INSERT INTO ${labelTable} ${valuesTable}`);

	// Feature tile
	const [ obj, err ] = await mapid({ image: sample.style({ color: 'DodgerBlue', pointSize: 5, fillColor: '00000000' }) });

	// Return evaluated features
	if (err) {
		return { message: err, ok: false };
	};

	return { features, ok: true, tile: obj.urlFormat };
}

/**
 * Function to save agriculture sample
 * @param {{ sampleId: string, time: number }} body 
 */
export async function saveAgriSample(body){
	const { sampleId, time, features } = body;

	// Update in database
	await bigquery.query(`UPDATE ${labelTable} SET last_change=${time} WHERE sample_id='${sampleId}'`);

	// Save the file to cloud storage
	const fileName = `sample_labelling/${sampleId}.geojson`;
	await storage.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));
}

/**
 * Function to load agriculture sample
 * @param {{ sampleId: string }} body 
 */
export async function loadAgri(body){
	// Query sample
	try {
			// get sample id
		const { sampleId } = body;
		const file = await storage.bucket(process.env.BUCKET).file(`sample_labelling/${sampleId}.geojson`).download();
		const geojson = JSON.parse(file[0].toString());

		// Features
		// Auth and init process earth engine
		await auth(key);
		await init(null, null);

		// Load feature as tile
		const [ obj, error ] = await mapid({ image: ee.FeatureCollection(geojson).style({ color: 'DodgerBlue', pointSize: 5, fillColor: '00000000' }) });

		if (error) {
			return { ok: false, message: error };
		};

		return { features: geojson, ok: true, tile: obj.urlFormat };

	} catch (error) {

		return { ok: false, message: error.message };

	}
}