export function submitRequest(email) {
    return fetch('/reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
	credentials: 'same-origin',
        body: JSON.stringify({ email: email })
    })
}
