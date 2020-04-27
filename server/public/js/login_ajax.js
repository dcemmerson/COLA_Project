function submit_request(email, password){
    return fetch('/login',{
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json'
	},
	body: JSON.stringify({username: email, password: password})
    })
}
