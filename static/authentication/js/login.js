let errorMsg = document.querySelector('.login-error-msg');

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


// Handling Signin Form

async function signinForm(event) {
    event.preventDefault();
    if (isMobile == true) {
        document.querySelector('.platformErrorModal').click();
        return false;
    }
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let button = document.getElementById('login-btn');
    let buttonText = button.innerText;

    if (emailRegex.test(data.email) == false) {
        errorMsg.innerText = 'Enter valid email';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.password.length < 8) {
        errorMsg.innerText = 'Password must be atleast 8 characters';
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

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/auth/login/`, JSON.stringify(data), headers, 'POST');
        response.json().then(function (res) {
            if (response.status == 200) {
                afterLoad(button, 'Logged In');
                button.disabled = true;
                const accessToken = parseJwt(res.access);
                const refreshToken = parseJwt(res.refresh);
                setCookie("user_access", res.access, accessToken.exp);
                setCookie("user_refresh", res.refresh, refreshToken.exp);
                setTimeout(() => {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    location.href = location.origin + "/search-profile";
                }, 1500)
            }
            else if (response.status == 400) {
                if ('connection_limit' in res) {
                    document.querySelector('.connectionsErrorModal').click();
                }
                else {
                    displayMessages(res, errorMsg);
                    errorMsg.classList.add('active');
                }
                button.disabled = false;
                afterLoad(button, buttonText);
            }
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        });
    } catch (err) {
        console.log(err);
    }
}