// Import packages
import { useState } from 'react';
import loginServer from './loginServer';

export default function Login(props){
	const { 
		setAppState, setLoginPage, loginPage, username, setUsername,
		setSampleSet
	} = props;

	const [ password, setPassword ] = useState(undefined);
	const [ message, setMessage ] = useState(undefined);
	const [ disabled, setDisabled ] = useState(false);
	const [ messageColor, setMessageColor ] = useState('blue');

	return (
		<div id='login' className="flexible vertical space" style={{ display: loginPage }}>
			
			<div id='username' className="flexible vertical">
				Username
				<input value={username} disabled={disabled} onInput={e => setUsername(e.target.value) }/>
			</div>
			
			<div id='password' className="flexible vertical">
				Password
				<input value={password} disabled={disabled} type='password' onInput={e => setPassword(e.target.value) }/>
			</div>

			<div id='login-button'>
				<button onClick={async (e) => {
					// Disabled button for a while
					e.target.disabled = true;

					// Disabled input for a while
					setDisabled(true);

					// Set message loading
					setMessage('Logging in...');
					setMessageColor('blue');
					
					// Check username and password
					if (!(username && password)) {
						// Set message to account not found
						setMessage('Username or password is empty')
					} else {
						// Body
						const body = { username, password };

						// Run query from server components	
						const { ok, samples, message } = await loginServer(body);

						// Check server condition
						if (!(ok)){
								// Run if the account is not found
								setMessage(message);
								setMessageColor('red');
								setLoginPage('flex');
								setAppState('none');
							} else {
								// Run if the server condition are okay
								setLoginPage('none');
								setAppState('flex');

								// Check the sample list
								if (samples.length) {
									const sampleSets = samples.map(sample => {
										const obj = {};
										if (sample.table_name) {
											obj.label = sample.table_name;
										} else {
											obj.label = sample.table_id;
										};
										obj.value = sample.table_id;
										return obj;
									});
									
									setSampleSet(sampleSets);
								} else {
									setSampleSet([]);
								};

							};
						};

					// Set login button to enable again
					e.target.disabled = false;

					// Set input to enable again
					setDisabled(false);
				}}>Login</button>
			</div>

			<div id='login-message' className='message' onClick={() => setMessage("")} style={{ color: messageColor }}>
				{message}
			</div>

		</div>
	)
}