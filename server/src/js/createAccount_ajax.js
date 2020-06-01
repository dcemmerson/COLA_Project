export async function submitCredentials() {
    var context = {};
    context.email = document.getElementById('email').value.trim();
    context.password = document.getElementById('password').value;
    context.passwordRe = document.getElementById('passwordRe').value;

    let resp = await fetch('/create_account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
	credentials: 'same-origin',
        body: JSON.stringify(context)
    })

    return await resp.json();
}
