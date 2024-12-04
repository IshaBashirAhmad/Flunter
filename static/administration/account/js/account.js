function selectCurrency(logo, name) {
    document.getElementById('currency-icon').innerText = logo;
    document.getElementById('currency-name').innerText = name;
}

function openDelModal(modalId, id, type) {
    let modal = document.querySelector(`#${modalId}`);
    if (type == 'company'){
        heading = modal.querySelector('#del-modal-header')
        body = modal.querySelector('#warning-statement')
        heading.innerText = "Delete Company";
        body.innerText = "Are you sure you want to delete this company?"
    }
    let form = modal.querySelector("form");
    console.log(modal, form)
    form.setAttribute("onsubmit", `delUserForm(event, ${id});`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Delete';
        document.querySelector('.delete-error-msg').classList.remove('active');
        document.querySelector('.delete-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}

async function delUserForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.delete-error-msg');

    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');        
        let headers = { "X-CSRFToken": data.csrfmiddlewaretoken };

        beforeLoad(button);
        let response = await requestAPI(`/administration/delete-user/${id}/`, null, headers, "DELETE");
        response.json().then(function (res) {
            if (res.success) {
                afterLoad(button, 'Deleted');
                button.disabled = true;
                setTimeout(() => {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    location.reload();
                }, 1500)
                window.location.reload();
            } 
            else {
                afterLoad(button, buttonText);
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
            }
        });
    }
    catch (err) {
        console.log(err);
    }
}