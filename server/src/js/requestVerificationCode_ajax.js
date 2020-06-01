export function submitRequest(email) {
    return fetch('/requestVerificationCode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
	credentials: 'same-origin',
        body: JSON.stringify({ username: email })
    })
}
