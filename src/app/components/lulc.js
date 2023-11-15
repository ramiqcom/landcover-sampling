import lulc from './data.json' assert { type: 'json' };

// LULC parameter
export let lulcCode = Object.keys(lulc);
export let lulcArray = Object.entries(lulc);
export let lulcLabel = lulcArray.map(array => array[1].label);
export let lulcPalette = lulcArray.map(array => array[1].palette);
export let lulcValue = lulcArray.map(array => array[1].value);
export let lulcValueString = lulcValue.map(value => String(value));
export let lulcValueLabel = [];
export let lulcValueScaled = [];
export let lulcValuePalette = [];
for (let i = 0; i <= lulcArray.length; i++) {
	lulcValueLabel[lulcValue[i]] = lulcLabel[i];
	lulcValueScaled[lulcValue[i]] = i + 1;
	lulcValuePalette[lulcValue[i]] = lulcPalette[i];
}