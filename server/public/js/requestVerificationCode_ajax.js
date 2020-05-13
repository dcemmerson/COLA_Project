function submitRequest(email){
    return fetch('/requestVerificationCode',{
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json'
	},
	body: JSON.stringify({username: email})
    })
}
