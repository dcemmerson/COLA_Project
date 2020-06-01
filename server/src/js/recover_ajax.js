export async function submitPasswordReset() {
    var context = {};
    context.newPassword = document.getElementById('newPassword').value;
    context.newPasswordRe = document.getElementById('newPasswordRe').value;
    context.token = document.getElementById('token').value;
    context.userId = document.getElementById('userId').value;

    let resp = await fetch('/reset_password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(context)
    })

    return await resp.json();
}
