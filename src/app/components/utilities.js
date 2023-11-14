/**
 * Disable multiple feature
 * @param {Boolean} status
 * @param {Array.<ReactStateSetter>} featureSetList
 */
export function toggleFeatures(status, featureSetList){
	featureSetList.map(setter => setter(status));
}