import { useEffect, useState } from "react";
import { Map, Grid, Labelled } from "./map";
import { squareGrid, bbox } from "@turf/turf";
import roi from './roi.json' assert { type: 'json' };
import Select from "react-select";

export default function Labelling(props){
	const { labellingDisplay, region, year } = props;

	// Labelling option
	const [ labelOptions, setLabelOptions ] = useState([
		{ label: 'Land cover', value: 'lc' },
		{ label: 'Agriculture', value: 'agri' }
	]);

	// Label option
	const [ labelOption, setLabelOption ] = useState(labelOptions[0]);

	// Lc display optiion
	const [ lcDisplay, setLcDisplay ] = useState('flex');

	// Agri display option
	const [ agriDisplay, setAgriDisplay ] = useState('none');

	// Box features
	const [ grid, setGrid ] = useState(undefined);

	// Box min
	const [ boxMin, setBoxMin ] = useState(undefined);

	// Box max
	const [ boxMax, setBoxMax ] = useState(undefined);

	// Box options
	const [ boxOptions, setBoxOptions ] = useState(undefined);

	// Box choice
	const [ box, setBox ] = useState(undefined);

	// Box feature
	const [ boxFeature, setBoxFeature ] = useState(undefined);

	// Sample select for agriculture
	const [ sampleAgriSet, setSampleAgriSet ] = useState(undefined);

	// Options of sampleAgriculture
	const [ sampleAgriList, setSampleAgriList ] = useState(undefined);

	// List of sample agri
	const [ sampleNumberAgri, setSampleNumberAgri ] = useState(undefined);

	// Selected sample agri
	const [ selectedSampleAgri, setSelectedSampleAgri ] = useState(undefined);

	// Disabled select sample agri
	const [ sampleAgriDisabled, setSampleAgriDisabled ] = useState(true);

	// Agri min and max sample
	const [ agriMin, setAgriMin ] = useState(undefined);
	const [ agriMax, setAgriMax ] = useState(undefined);

	// Show grid if the labelling display is flex
	useEffect(() => {
		if (Grid) {
			Grid.clearLayers();

			if (labellingDisplay == 'flex'){
				// Create grid
				const bounds = roi[region.value];
				const grid = squareGrid(bbox(bounds), 100, { units: 'kilometers' });
				setGrid(grid);

				// Add grid to the map
				Grid.addData(grid);

				// Set the box min max
				setBoxMin(0);
				setBoxMax(grid.features.length - 1);
				
				// Set the grid box options
				const boxes = grid.features.map((feat, index) => new Object({ value: index, label: index }));
				setBoxOptions(boxes);

				// Zoom to box one if there is no box before
				if (!(box)){
					setBox({ value: 0, label: 0 });
					Map.fitBounds(L.geoJSON(grid.features[0]).getBounds(), { maxZoom: 10 });
				}

			} else {
				Grid.clearLayers();
			}
		}
	}, [ labellingDisplay, region ]);

	// When the box choice is changed, zoom to the location
	useEffect(() => {
		if (box) {
			const selected = grid.features[box.value];
			setBoxFeature(selected);
			Map.fitBounds(L.geoJSON(selected).getBounds(), { maxZoom: 10 });
		}
	}, [ box ]);

	// Use effect when the labelling option change
	useEffect(() => {
		if (Grid) {
			switch (labelOption.value) {
				case 'lc':
					setLcDisplay('flex');
					setAgriDisplay('none');
					Grid.setStyle({ opacity: 1, fillOpacity: 0 });
					break;
				case 'agri':
					setLcDisplay('none');
					setAgriDisplay('flex');
					Grid.setStyle({ opacity: 0, fillOpacity: 0 });
					break;
			}
		}
	}, [ labelOption ]);

	// Useeffect to enable agri sample mode
	useEffect(() => {
		if (sampleAgriSet) {
			setSampleAgriDisabled(false);
		} else {
			setSampleAgriDisabled(true);
		}
	}, [ sampleAgriSet ]);

	return (
		<div id="labelling" className='flexible vertical space' style={{ display: labellingDisplay }}>
			<Select 
				options={labelOptions}
				value={labelOption}
				className="select-menu"
				onChange={value => setLabelOption(value)}
			/>

			<div className="flexible space vertical" style={{ display: lcDisplay }}>
				<div className="flexible space">
					<Select
						options={boxOptions}
						style={{ flex: 4 }}
						value={box}
						className='select-menu'
						onChange={value => setBox(value)}
					/>

					<button style={{ flex: 1 }} className="button-parameter" onClick={() => {
						if (!(box.value === boxMin)){
							setBox({ value: box.value - 1, label: box.value - 1 });
						}
					}}>{'<'}</button>

					<button style={{ flex: 1 }} className="button-parameter" onClick={() => {
						if (!(box.value === boxMax)){
							setBox({ value: box.value + 1, label: box.value + 1 });
						}
					}}>{'>'}</button>

					<button className="fa fa-location-arrow button-parameter" style={{ flex: 1 }} onClick={() => {
						Map.fitBounds(L.geoJSON(boxFeature).getBounds(), { maxZoom: 10 });
					}}></button>
				</div>
			</div>
			

			<div className="flexible space vertical" style={{ display: agriDisplay }}>
				<button className="button-parameter">Generate sample</button>
				
				<Select 
					options={sampleAgriList}
					value={sampleAgriSet}
					onChange={value => setSampleAgriSet(value)}
					placeholder={'Select or generate sample'}
				/>

				<div className="flexible space">
					
					<Select 
						options={sampleNumberAgri}
						value={selectedSampleAgri}
						onChange={value => setSelectedSampleAgri(value)}
						isDisabled={sampleAgriDisabled}
					/>

					<button className="button-parameter" style={{ flex: 1 }} onClick={() => {
						if (!(selectedSampleAgri.value === agriMin)) {
							setSelectedSampleAgri({ value: selectedSampleAgri.value - 1, label: selectedSampleAgri.value - 1  })
						}
					}}>{'<'}</button>
					<button className="button-parameter" style={{ flex: 1 }} onClick={() => {
						if (!(selectedSampleAgri.value === agriMax)) {
							setSelectedSampleAgri({ value: selectedSampleAgri.value + 1, label: selectedSampleAgri.value + 1  })
						}
					}}>{'>'}</button>
					<button className=" button-parameter fa fa-location-arrow button-parameter" style={{ flex: 1 }}></button>

				</div>

			</div>

		</div>
	);
}