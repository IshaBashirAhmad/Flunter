function previewImage(event, inputElement) {
    let image = event.currentTarget.files;
    let imageTag = document.getElementById('profile-image');
    imageTag.src = window.URL.createObjectURL(image[0]);
}

function togglePasswordField(event, icon) {
    let passwordField = icon.closest('.input-wrapper').querySelector('input[data-type="password"]');

    if (icon.classList.contains('hide-password-icon') && passwordField.type == 'password') {
        passwordField.type = 'text';
        icon.classList.add('hide');
        icon.closest('.input-wrapper').querySelector('.show-password-icon').classList.remove('hide');
    }
    else if (icon.classList.contains('show-password-icon') && passwordField.type == 'text') {
        passwordField.type = 'password';
        icon.classList.add('hide');
        icon.closest('.input-wrapper').querySelector('.hide-password-icon').classList.remove('hide');
    }
}


const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
async function requestAPI(url, data, headers, method) {
    const response = await fetch(url, {
        method: method,
        mode: 'cors',
        headers: headers,
        body: data,
    });
    return response; 
}

function openAddUserModal(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `addNewUserForm(event);`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        form.querySelector('#profile-image').src = "/static/common/images/default-profile.png";
        modal.querySelector('.btn-text').innerText = 'Add';
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}

function formDataToObject(formData) {
    let getData = {}
    formData.forEach(function(value, key) {
        getData[key] = value;
    });
    return getData
}

function beforeLoad(button) {
    button.querySelector('.btn-text').innerText = '';
    button.querySelector('.spinner-border').classList.remove('hide');
    button.disabled = true;
    button.style.cursor ='not-allowed';
}

function afterLoad(button, text) {
    button.querySelector('.btn-text').innerText = text;
    button.querySelector('span').classList.add('hide');
    button.disabled = false;
    button.style.cursor ='pointer';
}


async function addNewUserForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let errorMsg = form.querySelector('.create-error-msg');
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let imageFile = document.getElementById('image-input');

    if (data.first_name.trim().length == 0) {
        errorMsg.innerText = 'Enter valid name';
        errorMsg.classList.add('active');
        return false;
    }
    else if (emailRegex.test(data.email) == false) {
        errorMsg.innerText = 'Enter valid email';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.password1.length < 8) {
        errorMsg.innerText = 'Password must be atleast 8 characters';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.password2.length < 8) {
        errorMsg.innerText = 'Confirm Password must be atleast 8 characters';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.password1 != data.password2) {
        errorMsg.innerText = 'Password and Confirm Password do not match';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        if (imageFile.files[0]) {
            formData.append('profile_picture', imageFile.files[0]);
        }
        
        let headers = { "X-CSRFToken": data.csrfmiddlewaretoken };

        beforeLoad(button);
        let response = await requestAPI("/administration/authorised-user/", formData, headers, "POST");
        response.json().then(function (res) {
            console.log(res)
            if (res.success) {
                console.log(res)
                afterLoad(button, 'Created');
                    document.getElementById('name-errors').innerText = '';
                    document.getElementById('email-errors').innerText = '';
                    document.getElementById('password1-errors').innerText = '';
                    document.getElementById('password2-errors').innerText = '';
                button.disabled = true;
                setTimeout(() => {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    location.reload();
                }, 1500)
            } 
            else {
                afterLoad(button, buttonText);
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');

                if(res.errors){
                    if(res.errors.first_name){document.getElementById('name-errors').innerText = res.errors.first_name;}
                    if(res.errors.email){document.getElementById('email-errors').innerText = res.errors.email;}
                    if(res.errors.password1){document.getElementById('password1-errors').innerText = res.errors.password1;}
                    if(res.errors.password2){document.getElementById('password2-errors').innerText = res.errors.password2;}
                } 
            }
        });
    } catch (err) {
        console.log(err);
    }
}
