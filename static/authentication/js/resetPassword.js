let button = document.querySelector('button[type="submit"]');
let errorMsg = document.querySelector('.reset-error-msg');


function togglePasswordField(event, icon) {
    let passwordField = icon.closest('.password-input-div').querySelector('input[data-type="password"]');

    if (icon.classList.contains('hide-password-icon') && passwordField.type == 'password') {
        passwordField.type = 'text';
        icon.classList.add('hide');
        icon.closest('.password-input-div').querySelector('.show-password-icon').classList.remove('hide');
    }
    else if (icon.classList.contains('show-password-icon') && passwordField.type == 'text') {
        passwordField.type = 'password';
        icon.classList.add('hide');
        icon.closest('.password-input-div').querySelector('.hide-password-icon').classList.remove('hide');
    }
}


// Handling Reset Password Form

async function resetPasswordForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let buttonText = button.innerText;
    let formData = new FormData(form);
    let data = formDataToObject(formData);

    if (data.password.length < 8) {
        errorMsg.innerText = 'Password must be atleast 8 characters long';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.confirm_password.length < 8) {
        errorMsg.innerText = 'Confirm Password must be atleast 8 characters long';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.password != data.confirm_password) {
        errorMsg.innerText = 'Password and Confirm Password do not match';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
        
        let headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": data.csrfmiddlewaretoken,
        };
        
        let url = String(window.location.pathname);
        let token = url.split("/reset-password/")[1];
        data.verification_token = token;
        data.email = reset_email || '';
        
        beforeLoad(button);
        // let response = await requestAPI('/users/reset-password/', JSON.stringify(data), headers, "POST");
        let response = await requestAPI(`${apiURL}/password/reset`, JSON.stringify(data), headers, 'PATCH');
        response.json().then(function (res) {
            if (response.status == 200) {
                afterLoad(button, 'Password Updated');
                button.disabled = true;
                setTimeout(()=> {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    sessionStorage.clear();
                    location.href = location.origin + '/login/';
                }, 1500)
            }
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                // errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
            }
        });
    }
    catch (err) {
        console.log(err);
    }
}