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


function openSuccessModel(modalId) {
    document.querySelector(`.${modalId}`).click();
}

function closeCurrentModal() {
    let currentModal = document.querySelector('.modal.show');
    if (currentModal) {
        let bootstrapModal = bootstrap.Modal.getInstance(currentModal);
        bootstrapModal.hide();
    }
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
    if (data.last_name.trim().length == 0) {
        errorMsg.innerText = 'Enter valid name';
        errorMsg.classList.add('active');
        return false;
    }
    else if (emailRegex.test(data.email) == false) {
        errorMsg.innerText = 'Enter valid email';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.password.length < 8) {
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

        formData.delete('profile_picture');
        if (imageFile.files[0]) {
            formData.append('profile_picture', imageFile.files[0]);
        }
        
        let token = getCookie('user_access');
        let headers = { "Authorization": `Bearer ${token}` };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/auth-user`, formData, headers, "POST");
        response.json().then(function (res) {
            if (response.status == 200) {
                user = res.user;
                afterLoad(button, 'Created');
                authUserCount += 1;
                authUserCountSpan.innerText = authUserCount;
                if (authUserCount >= userData.user.sub?.users_limit) {
                    addUserBtn.disabled = true;
                    addUserBtn.style.background = '#888996';
                }
                let noAuthUserDiv = document.querySelector('.no-authorised-user');
                if (noAuthUserDiv)
                    noAuthUserDiv.remove();
                button.disabled = true;
                setTimeout(() => {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    closeCurrentModal()
                    openSuccessModel('successModal');
                    updateAuthUsersList(user);
                }, 1500)
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

function updateAuthUsersList(user) {
    let user_container = document.querySelector(".authorised-user-list");
    let new_wrapper = document.createElement("div");
    new_wrapper.classList.add("authorised-user");
    new_wrapper.innerHTML = `
                            <div class="user-info">
                                <img src="${user.profile_picture}" alt="authorised-user">
                                <span>${user.first_name} ${user.last_name}</span>
                            </div>
                            <div class="user-actions">
                                <svg onclick="openUpdateUserModal('addUser', '${user.id}', '${user.profile_picture}', '${user.first_name}', '${user.last_name}', '${user.email}');" class="cursor-pointer" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="1" y="1" width="38" height="38" rx="4" stroke="#2B00CC" stroke-width="2"></rect>
                                    <path opacity="0.4" d="M21.7969 28.3383H28.5282" stroke="#2B00CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M20.9031 12.5651C21.681 11.574 22.9382 11.6257 23.9304 12.4036L25.3976 13.5542C26.3898 14.3321 26.7413 15.5386 25.9634 16.5319L17.2139 27.6944C16.9215 28.0681 16.475 28.2887 16 28.294L12.6254 28.3372L11.8612 25.0492C11.7535 24.5879 11.8612 24.1023 12.1536 23.7276L20.9031 12.5651Z" stroke="#2B00CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path opacity="0.4" d="M19.2656 14.6562L24.326 18.623" stroke="#2B00CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>                                        
                                <svg onclick="openDelModal('delModal', '${user.id}');" class="cursor-pointer" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="40" height="40" rx="5" fill="#FF0000"></rect>
                                    <path d="M27.8482 17.2876C27.8482 17.2876 27.2664 24.5037 26.9289 27.5433C26.7682 28.9951 25.8714 29.8458 24.4025 29.8726C21.6071 29.923 18.8086 29.9262 16.0143 29.8672C14.6011 29.8383 13.7193 28.9769 13.5618 27.5508C13.2221 24.4844 12.6436 17.2876 12.6436 17.2876" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M29.3304 13.8287H11.1611" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M25.8296 13.8285C24.9885 13.8285 24.2643 13.2339 24.0993 12.41L23.8389 11.1071C23.6782 10.506 23.1339 10.0903 22.5135 10.0903H17.9782C17.3578 10.0903 16.8135 10.506 16.6528 11.1071L16.3925 12.41C16.2275 13.2339 15.5032 13.8285 14.6621 13.8285" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </div>`;
    user_container.append(new_wrapper);
    
}


function openUpdateUserModal(modalId, id, profile_pic, first_name, last_name, email) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `updateUserForm(event, ${id});`);
    form.querySelector('#profile-image').src = profile_pic;
    form.querySelector('input[name="first_name"]').value = first_name;
    form.querySelector('input[name="last_name"]').value = last_name;
    form.querySelector('#email').value = email;
    modal.querySelector('.btn-text').innerText = 'Update';
    modal.querySelector('#add-user-modal-header-text').innerText = 'Update User';
    modal.querySelectorAll('.hide-fields-update').forEach(item =>{
        item.classList.add('hide');
    })
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        form.querySelector('#profile-image').src = "/static/common/images/default-profile.png";
        modal.querySelector('.btn-text').innerText = 'Add';
        modal.querySelector('#add-user-modal-header-text').innerText = 'Add New User';
        modal.querySelectorAll('.hide-fields-update').forEach(item =>{
            item.classList.remove('hide');
        })
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function updateUserForm(event, id) {
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
    if (data.last_name.trim().length == 0) {
        errorMsg.innerText = 'Enter valid name';
        errorMsg.classList.add('active');
        return false;
    }
    else if (emailRegex.test(data.email) == false) {
        errorMsg.innerText = 'Enter valid email';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        formData.delete('profile_picture');
        if (imageFile.files[0]) {
            formData.append('profile_picture', imageFile.files[0]);
        }
        
        let token = getCookie('user_access');
        let headers = { "Authorization": `Bearer ${token}` };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/auth-user/update/${id}`, formData, headers, "PATCH");
        response.json().then(function (res) {
            if (response.status == 200) {
                afterLoad(button, 'Updated');
                button.disabled = true;
                setTimeout(() => {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    location.reload();
                }, 1500)
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