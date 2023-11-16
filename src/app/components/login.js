// Import packages
import { useState } from 'react';
import loginServer from '../server/loginServer';

export default function Login(props){
	const { 
		setAppState, setLoginPage, loginPage, username, setUsername,
		setSampleSet, setProjectList, setSampleAgriList
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
				<button disabled={disabled} onClick={async (e) => {
					// Disabled input for a while
					setDisabled(true);

					// Set message loading
					setMessage('Logging in...');
					setMessageColor('blue');
					
					// Check username and password
					if (!(username && password)) {
						// Set message to account not found
						setMessage('Username or password is empty');
						setMessageColor('red');
					} else {
						// Body
						const body = { username, password };

						// Run query from server components	
						const { ok, samples, message, projects, agri } = await loginServer(body);

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
								setSampleSet(samples);

								// Check the project list
								setProjectList(projects);

								// Set the agri sample list
								setSampleAgriList(agri);
							};
						};

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