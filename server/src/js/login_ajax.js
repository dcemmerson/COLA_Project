export function submitRequest(email, password) {
    return fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
	credentials: 'same-origin',
        body: JSON.stringify({ username: email, password: password })
    })
}
