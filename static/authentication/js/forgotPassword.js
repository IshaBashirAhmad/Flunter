let errorMsg = document.querySelector('.forgot-error-msg');
let button = document.querySelector('button[type="submit"]');


// Handling Forgot Pasword Form

async function forgotPasswordForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let error = form.querySelector(".alert");
    let buttonText = button.innerText;
    let formData = new FormData(form);
    let data = formDataToObject(formData);

    if (emailRegex.test(data.email) == false) {
        errorMsg.innerText = 'Enter a valid email';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        data.otp_type = 'forgot';
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
        let headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": data.csrfmiddlewaretoken,
        };
        beforeLoad(button);
        // let response = await requestAPI('/users/send-otp/', JSON.stringify(data), headers, 'POST');
        let response = await requestAPI(`${apiURL}/otp/send`, JSON.stringify(data), headers, 'POST');
        response.json().then(function(res) {
            if (response.status == 200) {
                afterLoad(button, 'OTP Sent');
                button.disabled = true;
                setTimeout(() => {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    // location.pathname = `/verify-code/${res.token}`;
                    sessionStorage.setItem("em", `${data.email}`);
                    location.pathname = `/verify-code/`;
                }, 1500)
            }
            else {
                afterLoad(button, buttonText);
                // errorMsg.innerText = res.message;
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}