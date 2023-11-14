'use server'

// Import packages
import pify from 'pify';
import 'node-self';
import ee from '@google/earthengine';

// Promisify some function
const eeCallback = { multiArgs: true, errorFirst: false };
export const auth = pify(ee.data.authenticateViaPrivateKey);
export const init = pify(ee.initialize);
export const mapid = pify(ee.data.getMapId, eeCallback);
