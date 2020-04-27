async function submit_password(){
    var context = {};
    context.email = document.getElementById('email').value;
    context.newPassword = document.getElementById('newPassword').value;
    context.newPasswordRe = document.getElementById('newPasswordRe').value;

    resp = await fetch('/create_password', {
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json'
	},
	body: JSON.stringify(context)
    })
    
    return await resp.json();
}
