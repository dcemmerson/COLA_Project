function submit_request(email){
    return fetch('/reset',{
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json'
	},
	body: JSON.stringify({email: email})
    })
}
