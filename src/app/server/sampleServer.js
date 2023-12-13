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
	try {
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

		// If evaluating features failed throw error
		if (errorMessage) {
			throw new Error(errorMessage);
		}

		// Visualized features
		const featuresVisual = sample.style({ color: 'DodgerBlue', pointSize: 5, fillColor: '00000000' });
		const [ obj, error ] = await mapid({ image: featuresVisual });

		// If the tile cannot be generated throw error
		if (error) {
			throw new Error(error);
		}

		// Save the file to cloud storage
		const fileName = `sample/${sampleId}.geojson`;
		features.properties = {
			region,
			year,
			sampleId,
			sampleName: sampleId,
			selectedSample: 0
		};
		await storage.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));
		
		// Add log to database
		const valuesTable = `VALUES ('${sampleId}', '${sampleId}', '${username}', ${time}, ${time}, 0)`;
		await bigquery.query(`INSERT INTO ${sampleTable} ${valuesTable}`);

		return { features, ok: true, tile: obj.urlFormat, selectedSample: 0 };
	} catch (error) {
		return { ok: false, message: error.message }
	}
}

/**
 * Function to load saved sample from the database
 * @param {{ sampleId: string }} body 
 * @returns {Promise.<{ features: GeoJSON | undefined, ok: boolean, message: string | undefined }>}
 */
export async function loadSample(body){
	// Query sample
	try {
		// Auth and init process earth engine
		await auth(key);
		await init(null, null);

		// get sample id
		const { sampleId } = body;

		const file = await storage.bucket(process.env.BUCKET).file(`sample/${sampleId}.geojson`).download();
		const geojson = JSON.parse(file[0].toString());

		// Load tile url from features
		const visualized = ee.FeatureCollection(geojson).style({ color: 'DodgerBlue', pointSize: 5, fillColor: '00000000' });
		const [ obj, error ] = await mapid({ image: visualized });

		if (error) {
			return { ok: false, message: error.message }
		}

		return { features: geojson, ok: true, tile: obj.urlFormat, selectedSample: geojson.properties.selectedSample };
	} catch (error) {
		return { ok: false, message: error.message }	
	}
}

/**
 * Function to update sample in the bigquery
 * @param {{ sampleId: string, num: number, lc: number }} body 
 */
export async function updateSample(body) {
	try {
		// Parameter
		const { sampleId, features, time } = body;

		// Save the file to cloud storage
		const fileName = `sample/${sampleId}.geojson`;
		await storage.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));

		// Update in the bigquery
		await bigquery.query(`UPDATE ${sampleTable} SET last_change=${time}, selected_sample=${features.properties.selectedSample} WHERE sample_id='${sampleId}'`);

		return { ok: true };
	} catch (error) {
		return { ok: false, message: error.message }
	}
}

/**
 * Function to save sample name
 * @param {{ sampleId: string, sampleName: string }} body 
 */
export async function updateSampleName(body){
	try {
		// Parameter for saving sample name
		const { sampleId, sampleName } = body;

		// Update sample name in the bigquery
		await bigquery.query(`UPDATE ${sampleTable} SET sample_name='${sampleName}' WHERE sample_id='${sampleId}'`);

		return { ok: true }
	} catch (error) {
		return { ok: false, message: error.message }
	}	
}

export async function deleteSample(body){
	try {
		// Parameter to delete sample
		const { sampleId } = body;

		// Delete sample from database
		await bigquery.query(`DELETE FROM ${sampleTable} WHERE sample_id='${sampleId}'`);

		return { ok: true };
	} catch (error) {
		return { ok: false, message: error.message }
	}
}

/**
 * Function to generate agriculture sample
 * @param {{ region: string, year: number }} body
 * @returns {Promise.<{ features: GeoJSON | undefined, ok: boolean }>}
 */
export async function agriSample(body){
	try {
		// Auth and init process earth engine
		await auth(key);
		await init(null, null);

		// Parameter
		const { sampleId, region, year, type, username, time, size } = body;

		// Composite image
		const image = await compositeImage(region, year);

		// Land cover
		const idLc = `projects/${process.env.IMAGE_PROJECT}/assets/${process.env.LULC_COLLECTION}/${region}_${year}`;

		// Load land cover image
		const lc = ee.Image(idLc);

		// Land cover only low level
		const lowLevel = lc.eq(40).or(lc.eq(50)).selfMask();

		// Sample
		const sample = lowLevel.stratifiedSample({
			numPoints: Math.ceil(size / 2),
			region: image.geometry(),
			geometries: true,
			scale: 300
		}).randomColumn().sort('random');

		// Features
		const evaluateFeatures = pify(sample.evaluate, { multiArgs: true, errorFirst: false }).bind(sample);
		const [ features, errorMessage ] = await evaluateFeatures();

		// If evaluating features failed show error
		if (errorMessage) {
			throw new Error(errorMessage);
		}

		// Save the file to cloud storage
		const fileName = `sample_labelling/${sampleId}.geojson`;
		features.properties = {
			region,
			year,
			sampleId,
			sampleName: sampleId,
			selectedSample: 0
		};
		await storage.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));
		
		// Add log to database
		const valuesTable = `VALUES ('${sampleId}', '${sampleId}', '${username}', ${time}, ${time}, '${type}', 0)`;
		await bigquery.query(`INSERT INTO ${labelTable} ${valuesTable}`);

		// Feature tile
		const [ obj, err ] = await mapid({ image: sample.style({ color: 'DodgerBlue', pointSize: 5, fillColor: '00000000' }) });

		// If generating tile failed show error
		if (err) {
			throw new Error(err);
		}

		// If everything works out return the data generated
		return { features, ok: true, tile: obj.urlFormat, selectedSample: 0 };
	} catch (error) {
		return { message: error.message, ok: false };
	}
}

/**
 * Function to save agriculture sample
 * @param {{ sampleId: string, time: number }} body 
 */
export async function saveAgriSample(body){
	try {
		const { sampleId, time, features } = body;

		// Save the file to cloud storage
		const fileName = `sample_labelling/${sampleId}.geojson`;
		await storage.bucket(process.env.BUCKET).file(fileName).save(JSON.stringify(features));

		// Update in database
		await bigquery.query(`UPDATE ${labelTable} SET last_change=${time}, selected_sample=${features.properties.selectedSample} WHERE sample_id='${sampleId}'`);

		return { ok: true };
	} catch (error) {
		return { ok: false, message: error.message }
	}	
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

		// If generating tile failed show error
		if (error) {
			throw new Error(error);
		};

		// Return the data if it succeded
		return { features: geojson, ok: true, tile: obj.urlFormat, selectedSample: geojson.properties.selectedSample };
	} catch (error) {
		return { ok: false, message: error.message };
	}
}

/**
 * Delete the agriculture saple
 * @param {{ sampleId: string }} body 
 */
export async function deleteAgri(body){
	try {
		// get sample id
		const { sampleId } = body;

		// Delete sample from database
		await bigquery.query(`DELETE FROM ${labelTable} WHERE sample_id='${sampleId}'`);

		// Also delete from the bucket
		await storage.bucket(process.env.BUCKET).file(`sample_labelling/${sampleId}.geojson`).delete();

		// If succed, return ok
		return { ok: true };
	} catch (error) {
		return { ok: false, error: error.message }
	}
}