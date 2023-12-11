// Import some packages
import * as tf from '@tensorflow/tfjs';
import { useEffect, useState, useContext } from 'react';
import { lulcValueScaled, lulcValue } from './lulc';
import { Context } from '../page';

// Assessment components
export default function Assessment(prop){
	const { 
		assessmentDisplay, sampleFeatures,
		setMessage, setMessageColor,
		cfDisplay, setCfDisplay, setCfData
	} = useContext(Context);

	// Multiple state
	const [ confusionMatrixButtonDisabled, setConfusionMatrixButtonDisabled ] = useState(true);
	const [ accuracy, setAccuracy ] = useState(undefined);
	const [ kappa, setKappa ] = useState(undefined);
	const [ cfArray, setCfArray ] = useState(undefined);
	const [ hideShowCf, setHideShowCf ] = useState('Show ');

	// Do something if the cf array change
	useEffect(() => {
		if (cfArray) {
			setConfusionMatrixButtonDisabled(false);

			// Producers accuracy
			let producerAccuracy = ['%'];
			for (let i = 0; i < cfArray.length; i++){
				const arrNum = cfArray.map(feat => feat[i]);
				const total = arrNum.reduce((x, y) => x + y);
				const correct = arrNum[i];
				const accuracy = Math.round(correct / total * 100);
				producerAccuracy.push(accuracy);	
			}
			producerAccuracy.push(Math.round(accuracy * 100)); // Add overall accuracy to the matrix

			// Create array table with inserting some information
			const cfArrayTable = cfArray.map((feat, index) => {
				const reduceValue = feat.reduce((x, y) => x + y);
				const correct = feat[index];

				// Insert lulc value
				feat.unshift(lulcValue[index]);

				// Insert the users accuracy
				feat.push(Math.round(correct / reduceValue * 100));

				return feat;
			});

			// Add producer accuracy to the main table
			cfArrayTable.push(producerAccuracy);

			// Set the cf array for the grid js confusion matrix table
			setCfData(cfArrayTable);

		} else {
			setConfusionMatrixButtonDisabled(true);
		}
	}, [ cfArray ]);

	return (
		<div id='assessment' className='flexible vertical space' style={{ display: assessmentDisplay }}>
			<button className="button-parameter" onClick={async () => {
				if (!sampleFeatures) {
					setMessage('No samples selected!');
					setMessageColor('red');
					return null;
				};

				// Get the values of the samples
				const values = sampleFeatures.features.map(feat => [ feat.properties.lulc, feat.properties.validation ]);
				
				// Get the prediction
				const prediction = values.map(feat => feat[0]);
				
				// Get the validation
				const validation = values.map(feat => feat[1]);

				// Get the validation value where it is not fill yet
				const noFillIndex = validation.map((feat, index) => !feat ? index : null).filter(feat => feat ? feat : null);
				
				// Send error message if there is some validation is null
				if (noFillIndex.length) {
					// String no fill index
					const stringNoFill = noFillIndex.join(', ');
					setMessage(`This sample id is still empty: ${stringNoFill}`);
					setMessageColor('red');
					return null;
				}

				// Scaled data to sorted integer
				const predictionEnum = prediction.map(feat => lulcValueScaled[feat]);
				const validationEnum = validation.map(feat => lulcValueScaled[feat]);

				// Tensorflow array
				const tfValidation = tf.tensor1d(validationEnum, 'int32'); 
				const tfPrediction = tf.tensor1d(predictionEnum, 'int32'); 
				const classNumber = lulcValue.length;

				// Confusion matrix
				const cm = await tf.math.confusionMatrix(tfValidation, tfPrediction, classNumber + 1).array();
				cm.shift();
				cm.map(feat => feat.shift());
				setCfArray(cm);
				
				// Sample size
				const totalSample = cm.flat().reduce((x, y) => x + y);

				// True positive
				const truePostive = cm.map((array, index) => array[index]).reduce((x, y) => x + y);

				// Expected agreement
				const expectedAggrement = totalSample / (totalSample ** 2)

				// Overall accuracy
				const overallAccuracy = truePostive / totalSample;
				setAccuracy(overallAccuracy.toFixed(3));
				
				// Kappa
				const kappa = overallAccuracy - expectedAggrement / (1 - expectedAggrement);
				setKappa(kappa.toFixed(3));

				// Delete message
				setMessage(undefined);
				setMessageColor('blue');

			}}>Run assessment</button>

			<div className='flexible space'>
				<div style={{ flex: 2 }}> Overall accuracy </div>
				<div style={{ flex: 1 }}> {accuracy} </div>
			</div>

			<div className='flexible space'>
				<div style={{ flex: 2 }}> Kappa </div>
				<div style={{ flex: 1 }}> {kappa} </div>
			</div>

			<button className='button-parameter' disabled={confusionMatrixButtonDisabled} onClick={() => {
				if (cfDisplay == 'none') {
					setCfDisplay('flex');
					setHideShowCf('Hide ')
				} else {
					setCfDisplay('none');
					setHideShowCf('Show ')
				}
			}}>{hideShowCf} confusion matrix</button>
		</div>	
	)
}