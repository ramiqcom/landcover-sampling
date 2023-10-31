// Import packages
import { useState } from 'react';
import loginServer from './loginServer';

export default function Login(props){
	const { setAppState, setLoginPage, loginPage, username, setUsername } = props;

	const [ password, setPassword ] = useState("");
	const [ message, setMessage ] = useState("");
	const [ disabled, setDisabled ] = useState(false);
	const [ messageColor, setMessageColor ] = useState('blue');

	return (
		<div id='login' className="flexible vertical space" style={{ display: loginPage }}>
			
			<div id='username' className="flexible vertical">
				Username
				<input value={username} disabled={disabled} onChange={e => setUsername(e.target.value) }/>
			</div>
			
			<div id='password' className="flexible vertical">
				Password
				<input value={password} disabled={disabled} type='password' onChange={e => setPassword(e.target.value) }/>
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
						const result = await loginServer(body);

						// Check server condition
						if (!(result.ok)){
								// Run if the account is not found
								setMessage(result.message);
								setMessageColor('red');
								setLoginPage('flex');
								setAppState('none');
							} else {
								// Run if the server condition are okay
								setLoginPage('none');
								setAppState('flex');
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