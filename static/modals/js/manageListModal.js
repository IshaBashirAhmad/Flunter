let selectedListType = 'recruitment';

function changeManageListType(listType) {
    if (listType == 'recruitment') {
        selectedListType = 'recruitment';
    }
    else if (listType == 'prospection') {
        selectedListType = 'prospection';
    }
}


function openAddListModal(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `addNewListForm(event);`);
    modal.querySelector('#select-list-type-container').classList.remove('hide');
    modal.querySelector('#manage-list-modal-header-text').innerText = 'Create List';
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Save';
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function addNewListForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let errorMsg = form.querySelector('.create-error-msg');
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;

    if (data.name.trim().length == 0) {
        errorMsg.innerText = 'Enter valid list name.';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
        
        let token = getCookie('user_access');
        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
        console.log(data)
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/user/list`, JSON.stringify(data), headers, "POST");
        response.json().then(function (res) {
            if (response.status == 201) {
                afterLoad(button, 'Saved');
                button.disabled = true;
                setTimeout(() => {
                    document.querySelector(`.manageListModal`).click();
                    button.disabled = false;
                    afterLoad(button, 'Save');
                }, 1200)
                location.reload();
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


function openEditRecruitmentListModal(event, modalId, name, list_id) {
    // console.log(list_type)
    event.stopPropagation();
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `editRecruitmentListForm(event, '${list_id}');`);
    form.querySelector('input[name="name"]').value = name;
    modal.querySelector('#select-list-type-container').classList.add('hide');
    modal.querySelector('#manage-list-modal-header-text').innerText = 'Update List';
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('#select-list-type-container').classList.remove('hide');
        modal.querySelector('.btn-text').innerText = 'Save';
        modal.querySelector('#manage-list-modal-header-text').innerText = 'Create List';
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function editRecruitmentListForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let errorMsg = form.querySelector('.create-error-msg');
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let td = document.querySelector(`span[data-td-id='${id}'`);
    
    if (data.name.trim().length == 0) {
        errorMsg.innerText = 'Enter valid list name.';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
        
        let token = getCookie('user_access');
        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
        console.log(data)
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/user/list/${id}`, JSON.stringify(data), headers, "PATCH");
        response.json().then(function (res) {
            console.log(res)
            if (response.status == 200) {
                // getRecruitmentList();
                afterLoad(button, 'Saved');
                button.disabled = true;
                td.innerText = data.name;
                setTimeout(() => {
                    document.querySelector(`.manageListModal`).click();
                    button.disabled = false;
                    afterLoad(button, 'Save');
                }, 1200)
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