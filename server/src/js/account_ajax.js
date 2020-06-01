export async function submitPassword() {
    var context = {};
    context.oldPassword = document.getElementById('oldPassword').value;
    context.newPassword = document.getElementById('newPassword').value;
    context.newPasswordRe = document.getElementById('newPasswordRe').value;

    let resp = await fetch('/update_password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(context)
    })

    return await resp.json();
}
