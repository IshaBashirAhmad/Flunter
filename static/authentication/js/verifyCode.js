const inputs = ["input1", "input2", "input3", "input4", "input5", "input6"];
let errorMsg = document.querySelector('.verify-error-msg');
let button = document.querySelector('button[type="submit"]');

inputs.map((id) => {
    const input = document.getElementById(id);
    addListener(input);
});


function addListener(input) {
    input.addEventListener("keyup", function(event) {
        const code = parseInt(input.value);
        if (code >= 0 && code <= 9) {
            const n = input.nextElementSibling;
            if (n) {
                n.focus();
                input.classList.add('filled-input');
            }
            else if (!n && input.getAttribute('data-position') == 'last') {
                input.classList.add('filled-input');
            }
        } else {
            input.value = "";
        }

        const key = event.key;
        if (key === "Backspace" || key === "Delete") {
            const prev = input.previousElementSibling;
            if (prev && input.getAttribute('data-position') == 'last') {
                input.classList.remove('filled-input');
            }
            if (prev) {
                prev.focus();
                prev.classList.remove('filled-input');
            }
        }
    });

    input.addEventListener("blur", () => {
        if (input.value.trim() == '') {
            input.classList.remove('filled-input');
        }
    })
}


// Handling Verify Code Form

async function verifyCodeForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let buttonText = button.innerText;
    let formData = new FormData(form);
    let data = formDataToObject(formData);

    if (data.digit1.trim().length == 0 || data.digit2.trim().length == 0 || data.digit3.trim().length == 0 || data.digit4.trim().length == 0 || data.digit5.trim().length == 0 || data.digit6.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid verification code';
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

        let code = parseInt(data.digit1 + data.digit2 + data.digit3 + data.digit4 + data.digit5 + data.digit6);
        data.otp_code = code;
        data.otp_type = 'forgot';
        data.email = sessionStorage.getItem('em');
    
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/otp/verify`, JSON.stringify(data), headers, 'PATCH');
        response.json().then(function (res) {
            if (response.status == 200) {
                afterLoad(button, 'Verified');
                button.disabled = true;
                setTimeout(()=> {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    location.pathname = `/reset-password/${res.data.verification_token}`;
                }, 1500)
            }
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        });
    }
    catch (err) {
        console.log(err);
    }
}


async function resendCode(event) {
    try {
        let headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value,
        };
        document.getElementById('resend-btn-loader').classList.remove('hide');
        let email = sessionStorage.getItem('em');
        let response = await requestAPI(`${apiURL}/otp/send`, JSON.stringify({"email": email, "otp_type": 'forgot'}), headers, 'POST');
        response.json().then(function(res) {
            document.getElementById('resend-btn-loader').classList.add('hide');
            if (response.status) {
                setTimeout(() => {
                    location.pathname = `/verify-code/`;
                }, 500)
            }
            else {
                console.log(res);
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}