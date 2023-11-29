// Import packages
import { useContext, useState } from 'react';
import loginServer from '../server/loginServer';
import { Context } from '../page';

export default function Login(){
	const { 
		setAppState, setLoginPage, loginPage, username, setUsername,
		setSampleSet, setProjectList, setSampleAgriList
	} = useContext(Context);

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
					try {
						if(!(username && password)) {
							throw new Error('Username or password is empty');
						}

						// Disabled input for a while
						setDisabled(true);

						// Set message loading
						setMessage('Logging in...');
						setMessageColor('blue');

						// Body
						const body = { username, password };

						// Run query from server components	
						const { ok, samples, message, projects, agri } = await loginServer(body);

						// Show error if not ok
						if (!ok) {
							throw new Error(message);
						}

						// Check the sample list
						setSampleSet(samples);

						// Check the project list
						setProjectList(projects);

						// Set the agri sample list
						setSampleAgriList(agri);

						// Run if the server condition are okay
						setLoginPage('none');
						setAppState('flex');			
					} catch (error) {
						setMessage(error.message);
						setMessageColor('red');
						setLoginPage('flex');
						setAppState('none');
					} finally {
						setDisabled(false);	
					}
				}}>Login</button>
			</div>

			<div id='login-message' className='message' onClick={() => setMessage("")} style={{ color: messageColor }}>
				{message}
			</div>

		</div>
	)
}