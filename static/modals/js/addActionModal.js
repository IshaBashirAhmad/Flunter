let selectedActionType = null;
let selectedActionDateTime = null;

let actionDateTimeText = document.getElementById('selected-action-date-time');
let actionTypeText = document.getElementById('selected-action-type-text');
let actionCommentTextarea = document.getElementById('action-comment-textarea');
let actionModalHeaderText = document.querySelector('#action-modal-header-text');
let actionModalDeleteBtn = document.querySelector('#action-del-btn');
let actionModalCancelBtn = document.querySelector('#action-cancel-btn');
let actionTypeDropdownBtn = document.querySelector('#action-type');

document.getElementById('action-date-input-btn').addEventListener('click', function(event) {
    event.preventDefault();
});


function selectActionType(element) {
    selectedActionType = element.getAttribute('data-value');
    actionTypeText.innerText = element.innerText;
}


function openAddActionModal(modalId, id) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `addActionForm(event, ${id});`);
    actionTypeDropdownBtn.classList.remove('disabled');
    modal.querySelector('button[type="submit"]').classList.remove('hide');
    actionModalDeleteBtn.removeAttribute('onclick');
    actionModalDeleteBtn.classList.add('visibilty-hidden');
    let actionDateTime = flatpickr('#action-date-input-btn', {
        enableTime: true,
        dateFormat: "d-m-Y H:i",
        maxDate: "today",
        onChange: function(selectedDates, dateStr, instance) {
            // console.log(selectedDates, dateStr, instance);
            selectedActionDateTime = selectedDates[0];
            actionDateTimeText.innerText = dateStr;
        },
    });
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        selectedActionType = null;
        selectedActionDateTime = null;
        actionCommentTextarea.readOnly = false;
        actionModalHeaderText.innerText = 'Add Action';
        actionTypeText.innerText = 'Choose Type';
        actionDateTimeText.innerText = 'Choose Date/Time';
        actionModalCancelBtn.innerText = 'Cancel';
        modal.querySelector('.btn-text').innerText = 'Save';
        document.querySelector('.action-error-msg').classList.remove('active');
        document.querySelector('.action-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function addActionForm(event, id=null) {
    event.preventDefault();
    let form = event.currentTarget;
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.action-error-msg');

    if (selectedActionType == null) {
        errorMsg.innerText = 'Please select an action type';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedActionDateTime == null) {
        errorMsg.innerText = 'Please select a date/time for the action';
        errorMsg.classList.add('active');
        return false;
    }
    if (actionCommentTextarea.value.trim().length == 0) {
        errorMsg.innerText = 'Please write the action comment';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let actionDateInUTC = `${selectedActionDateTime.getUTCDate()}-${selectedActionDateTime.getUTCMonth() + 1}-${selectedActionDateTime.getUTCFullYear()} ${selectedActionDateTime.getUTCHours() % 12 || 12}:${selectedActionDateTime.getUTCMinutes()} ${selectedActionDateTime.getUTCHours() >= 12 ? 'PM' : 'AM'}`;
        let data = {
            "action_type": selectedActionType,
            "action_datetime": actionDateInUTC,
            "comment": actionCommentTextarea.value,
            "profile": id
        }

        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/action`, JSON.stringify(data), headers, "POST");
        response.json().then(function(res) {
            if (response.status == 201) {
                afterLoad(button, 'Saved');
                button.disabled = true;
                
                search_data.find(record => record.id == id).actions.splice(0, 0, res.data);
                const formattedDate = `${selectedActionDateTime.getDate().toString().padStart(2, '0')}/${(selectedActionDateTime.getMonth() + 1).toString().padStart(2, '0')}/${selectedActionDateTime.getFullYear()} - ${selectedActionDateTime.getHours().toString().padStart(2, '0')}:${selectedActionDateTime.getMinutes().toString().padStart(2, '0')}`;
                let newAction = `
                    <tr class="cursor-pointer" data-action-id="${res.data.id}" data-value="${res.data.action_type}" onclick='openEditActionModal("addActionModal", ${res.data.id}, ${id}, "${res.data.created_by.first_name} ${res.data.created_by.last_name}")'>
                        <td class="action-type-text">${captalizeFirstLetter(res.data.action_type)}</td>
                        <td>${res.data.created_by.first_name} ${res.data.created_by.last_name}</td>
                        <td class="action-type-date">${formattedDate}</td>
                    </tr>
                `;
                let actionCountDiv = document.querySelector(`#action-count-${id}`);
                actionCountDiv.innerText = parseInt(actionCountDiv.innerText) + 1;
                let actionParentDiv = document.querySelector(`#action-list-container-${id}`);
                let noActionDiv = actionParentDiv.querySelector('.no-actions');
                if (noActionDiv)
                    noActionDiv.remove();
                actionParentDiv.insertAdjacentHTML('beforeend', newAction);
                document.getElementById(`action-filter-container-${id}`).querySelector('a[data-value="all"]').click();
                setTimeout(() => {
                    document.querySelector(`.addActionModal`).click();
                    button.disabled = false;
                    afterLoad(button, buttonText);
                }, 1200)
            } 
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}


function openEditActionModal(modalId, actionId, id, username='') {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    actionModalCancelBtn.innerText = 'Close';
    actionModalHeaderText.innerText = username;
    
    let recordData = search_data.find(record => record.id == id);
    let actionData = recordData.actions.find(action => action.id == actionId);
    
    const actionDate = getActionDateInLocalTimezone(actionData.action_datetime);
    const formattedDate = `${actionDate.getDate().toString().padStart(2, '0')}-${(actionDate.getMonth() + 1).toString().padStart(2, '0')}-${actionDate.getFullYear()} ${actionDate.getHours().toString().padStart(2, '0')}:${actionDate.getMinutes().toString().padStart(2, '0')}`;
    actionDateTimeText.innerText = formattedDate;
    selectedActionDateTime = actionDate;

    selectedActionType = actionData.action_type;
    actionTypeText.innerText = captalizeFirstLetter(actionData.action_type);
    actionCommentTextarea.value = actionData.comment;

    let actionDateTime = flatpickr('#action-date-input-btn', {
        enableTime: true,
        dateFormat: "d-m-Y H:i",
        maxDate: "today",
        defaultDate: actionDate,
        onChange: function(selectedDates, dateStr, instance) {
            selectedActionDateTime = selectedDates[0];
            actionDateTimeText.innerText = dateStr;
        },
    });

    if (actionData.created_by.id == userData.user.id && actionData.action_type != 'opened_profile') {
        form.setAttribute("onsubmit", `editActionForm(event, ${actionId}, ${id});`);
        actionModalHeaderText.innerText = 'Update Action';
        actionCommentTextarea.readOnly = false;
        actionTypeDropdownBtn.classList.remove('disabled');
        actionModalDeleteBtn.classList.remove('visibilty-hidden');
        actionModalDeleteBtn.setAttribute('onclick', `openDeleteActionModal('delModal', ${actionId}, ${id})`);
    }
    else {
        form.setAttribute("onsubmit", `(e) => e.preventDefault()`);
        actionDateTime.destroy();
        actionCommentTextarea.readOnly = true;
        actionTypeDropdownBtn.classList.add('disabled');
        modal.querySelector('button[type="submit"]').classList.add('hide');
        actionModalDeleteBtn.classList.add('visibilty-hidden');
        actionModalDeleteBtn.removeAttribute('onclick');
    }

    if (actionData.action_type == 'opened_profile') {
        const user = relatedUsers.find(user => user.id === actionData.created_by.id);
        let comment = actionData.comment;
        actionCommentTextarea.value = replaceWords(comment, contactOptionsMappingObject) || comment;
        if (actionData.created_by.id == userData.user.id) {
            actionModalDeleteBtn.classList.remove('visibilty-hidden');
            actionModalDeleteBtn.setAttribute('onclick', `openDeleteActionModal('delModal', ${actionId}, ${id})`);
        }
    }

    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        selectedActionType = null;
        selectedActionDateTime = null;
        actionCommentTextarea.readOnly = false;
        actionModalHeaderText.innerText = 'Add Action';
        actionTypeText.innerText = 'Choose Type';
        actionDateTimeText.innerText = 'Choose Date/Time';
        actionTypeDropdownBtn.classList.remove('disabled');
        actionModalDeleteBtn.classList.add('visibilty-hidden');
        actionModalDeleteBtn.removeAttribute('onclick');
        actionModalCancelBtn.innerText = 'Cancel';
        modal.querySelector('.btn-text').innerText = 'Save';
        modal.querySelector('button[type="submit"]').classList.remove('hide');
        document.querySelector('.action-error-msg').classList.remove('active');
        document.querySelector('.action-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function editActionForm(event, action_id, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.action-error-msg');

    if (selectedActionType == null) {
        errorMsg.innerText = 'Please select an action type';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedActionDateTime == null) {
        errorMsg.innerText = 'Please select a date/time for the action';
        errorMsg.classList.add('active');
        return false;
    }
    if (actionCommentTextarea.value.trim().length == 0) {
        errorMsg.innerText = 'Please write the action comment';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let actionDateInUTC = `${selectedActionDateTime.getUTCDate()}-${selectedActionDateTime.getUTCMonth() + 1}-${selectedActionDateTime.getUTCFullYear()} ${selectedActionDateTime.getUTCHours() % 12 || 12}:${selectedActionDateTime.getUTCMinutes()} ${selectedActionDateTime.getUTCHours() >= 12 ? 'PM' : 'AM'}`;
        let data = {
            "action_type": selectedActionType,
            "action_datetime": actionDateInUTC,
            "comment": actionCommentTextarea.value
        }

        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/action/${action_id}`, JSON.stringify(data), headers, "PATCH");
        response.json().then(function(res) {
            if (response.status == 200) {
                afterLoad(button, 'Saved');
                button.disabled = true;

                let actionData = search_data.find(record => record.id == id).actions.find(action => action.id == action_id);
                actionData.action_type = res.data.action_type;
                actionData.action_datetime = res.data.action_datetime;
                actionData.comment = res.data.comment;
                
                const formattedDate = `${selectedActionDateTime.getDate().toString().padStart(2, '0')}/${(selectedActionDateTime.getMonth() + 1).toString().padStart(2, '0')}/${selectedActionDateTime.getFullYear()} - ${selectedActionDateTime.getHours().toString().padStart(2, '0')}:${selectedActionDateTime.getMinutes().toString().padStart(2, '0')}`;
                let actionParentDiv = document.querySelector(`#action-list-container-${id}`);
                let actionDiv = actionParentDiv.querySelector(`tr[data-action-id="${action_id}"]`);
                actionDiv.setAttribute('data-value', `${res.data.action_type}`);
                actionDiv.querySelector('.action-type-text').innerText = captalizeFirstLetter(res.data.action_type);
                actionDiv.querySelector('.action-type-date').innerText = formattedDate;
                setTimeout(() => {
                    document.querySelector(`.addActionModal`).click();
                    button.disabled = false;
                    afterLoad(button, buttonText);
                }, 1200)
            } 
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}


function openDeleteActionModal(modalId, id, recordId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector('form');
    form.setAttribute("onsubmit", `deleteAction(event, ${id}, ${recordId})`);
    modal.querySelector('#del-modal-header').innerText = 'Delete Action';
    modal.querySelector('#warning-statement').innerText = 'Are you sure you want to delete this action?';
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        form.querySelector('button[type="submit"]').disabled = false;
        modal.querySelector('#del-modal-header').innerText = '';
        modal.querySelector('#warning-statement').innerText = '';
        modal.querySelector('.btn-text').innerText = 'Delete';
    })
    document.querySelector(`.${modalId}`).click();
}


async function deleteAction(event, id, recordId) {
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

        let token = getCookie('user_access');
        let headers = { "Authorization": `Bearer ${token}` };
        
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/action/${id}`, null, headers, "DELETE");
        if (response.status == 204) {
            afterLoad(button, 'Deleted');
            button.disabled = true;
            let actionCountDiv = document.querySelector(`#action-count-${recordId}`);
            actionCountDiv.innerText = parseInt(actionCountDiv.innerText) - 1;
            let actionDiv = document.querySelector(`tr[data-action-id="${id}"]`);
            actionDiv.remove();
            setTimeout(() => {
                document.querySelector('.delModal').click();
                button.disabled = false;
                afterLoad(button, buttonText);
                document.querySelector(`.addActionModal`).click();
            }, 1500)
        } 
        else {
            afterLoad(button, buttonText);
            displayMessages(res, errorMsg);
            errorMsg.classList.add('active');
        }
    }
    catch (err) {
        console.log(err);
    }    
}

function closeCurrentModal() {
    let currentModal = document.querySelector('.modal.show'); // Get the currently open modal
    if (currentModal) {
        let bootstrapModal = bootstrap.Modal.getInstance(currentModal); // Get the Bootstrap modal instance
        bootstrapModal.hide(); // Hide the current modal
    }
}


const contactOptionsMappingObject = {
    "email1": "Personal Email",
    "email2": "Work Email",
    "phone1": "Mobile",
    "phone2": "Direct",
}

function replaceWords(inputString, mappingObject) {
    // Build a regex pattern using the keys of the mapping object
    const pattern = new RegExp(Object.keys(mappingObject).join('|'), 'g');
    const result = inputString.replace(pattern, (matched) => mappingObject[matched]);
    
    return result;
}