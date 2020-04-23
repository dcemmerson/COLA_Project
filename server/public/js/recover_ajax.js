async function submit_password(){
    var context = {};
    context.newPassword = document.getElementById('newPassword').value;
    context.newPasswordRe = document.getElementById('newPasswordRe').value;

    console.log(context);
    resp = await fetch('/reset_password', {
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json'
	},
	body: JSON.stringify(context)
    })
    
    return await resp.json();
}
