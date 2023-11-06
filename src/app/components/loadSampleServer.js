'use server';

// Import bigquery
import bq from "./bq";

/**
 * Function to load saved sample from the database
 * @param {{ sampleId: string }} body 
 * @returns {Promise.<{ features: GeoJSON | undefined, ok: boolean, message: string | undefined }>}
 */
export default async function main(body){
	// get sample id
	const { sampleId } = body;

	// Load bigquery client
	const bigquery = await bq();

	// Query sample
	try {
		const [ rows ] = await bigquery.query(`SELECT ST_ASGEOJSON(geometry) as geometry, id, lulc, num FROM ${process.env.DATASET_SAMPLE}.${sampleId}`);
		const geojson = {
			type: 'FeatureCollection',
			features: rows.map(dict => {
				return {
					type: "Feature",
					properties: {
						id: dict.id,
						lulc: dict.lulc,
						num: dict.num
					},
					geometry: JSON.parse(dict.geometry)
				}
			})
		};
		return { features: geojson, ok: true };
	} catch (error) {
		return { ok: false, message: error.message }	
	}
}