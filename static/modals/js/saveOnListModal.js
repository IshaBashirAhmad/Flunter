let recruitmentListContainer = document.querySelector('#recruitment-list');
let prospectionListContainer = document.querySelector('#prospection-list');
let addNewListBtn = document.getElementById('add-new-list-btn');
let newlistNameInput = document.getElementById('manage-list-name');
let selectedListType = 'recruitment';


function changeListType(listType) {
    if (listType == 'recruitment') {
        selectedListType = 'recruitment';
        prospectionListContainer.classList.add('hide');
        recruitmentListContainer.classList.remove('hide');
    }
    else if (listType == 'prospection') {
        selectedListType = 'prospection';
        recruitmentListContainer.classList.add('hide');
        prospectionListContainer.classList.remove('hide');
    }
}


async function getSavedLists() {
    let token = getCookie('user_access');
    let headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
    let responseRecruitmentList = await requestAPI(`${apiURL}/user/list/recruitment?perPage=1000`, null, headers, "GET");
    let responseProspectionList = await requestAPI(`${apiURL}/user/list/prospection?perPage=1000`, null, headers, "GET");
    responseRecruitmentList.json().then(function(res) {
        res.data.forEach((rec) => {
            recruitmentListContainer.innerHTML += `<div class="my-list-item">
                                                        <input type="radio" id="recruitment-${rec.id}" value="${rec.id}" name="recruitment" />
                                                        <label for="recruitment-${rec.id}">${rec.name}</label>
                                                    </div>`;
        })
    })
    responseProspectionList.json().then(function(res) {
        res.data.forEach((rec) => {
            prospectionListContainer.innerHTML += `<div class="my-list-item">
                                                        <input type="radio" id="prospection-${rec.id}" value="${rec.id}" name="prospection" />
                                                        <label for="prospection-${rec.id}">${rec.name}</label>
                                                    </div>`
        })
    })
}

window.addEventListener('load', getSavedLists);


function openSaveProfileInListModal(modalId, id) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `addRecordOnListForm(event, ${id});`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        changeListType('recruitment');
        modal.querySelector('.btn-text').innerText = 'Add';
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function addRecordOnListForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let errorMsg = form.querySelector('.create-error-msg');
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;

    if (selectedListType == 'recruitment' && !('recruitment' in data)) {
        errorMsg.innerText = 'Please select a list.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedListType == 'prospection' && !('prospection' in data)) {
        errorMsg.innerText = 'Please select a list.';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        data.list = selectedListType == 'recruitment' ? data.recruitment : data.prospection;
        data.profile = id;

        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
        
        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/save/list`, JSON.stringify(data), headers, "POST");
        response.json().then(function (res) {
            if (response.status == 201) {
                let saveListbutton = document.querySelector(`a[data-id="save-list-btn-${id}"]`);
                // saveListbutton.classList.add("remove-from-saved");
                saveListbutton.setAttribute("onclick", `removeProfileFromList(${id})`)
                saveListbutton.innerText = "Remove from List";
                saveListbutton.classList.add("remove-from-saved");
                afterLoad(button, 'Added');
                button.disabled = true;
                setTimeout(() => {
                    document.querySelector(`.saveListModal`).click();
                    button.disabled = false;
                    afterLoad(button, buttonText);
                }, 1200)
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


async function removeProfileFromList(record_id) {
    try {
        let data = {};
        data.profile = record_id;

        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };

        let response = await requestAPI(`${apiURL}/save/list/remove`, JSON.stringify(data), headers, "POST");
        response.json().then(function (res) {
            if (response.status == 200) {
                if (location.pathname.includes('list-candidates'))
                    getRecords(requiredDataURL);
                else {
                    let saveListbutton = document.querySelector(`a[data-id="save-list-btn-${record_id}"]`);
                    saveListbutton.classList.remove("remove-from-saved");
                    saveListbutton.setAttribute("onclick", `openSaveProfileInListModal('saveListModal', ${record_id})`)
                    saveListbutton.innerText = "Save on List";
                }
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


async function addNewListForm(event) {
    event.preventDefault();
    let form = event.target.closest('form');
    let errorMsg = form.querySelector('.create-error-msg');

    if (newlistNameInput.value.trim().length == 0) {
        errorMsg.innerText = 'Enter valid list name.';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        addNewListBtn.querySelector('svg').classList.add('hide');
        addNewListBtn.querySelector('.spinner-border').classList.remove('hide');
        
        let data = {
            "name": newlistNameInput.value,
            "list_type": selectedListType
        }

        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
        
        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };

        let response = await requestAPI(`${apiURL}/user/list`, JSON.stringify(data), headers, "POST");
        response.json().then(function (res) {
            addNewListBtn.querySelector('svg').classList.remove('hide');
            addNewListBtn.querySelector('.spinner-border').classList.add('hide');
            if (response.status == 201) {
                addNewListBtn.disabled = true;
                document.getElementById(`${selectedListType}-list`).insertAdjacentHTML('afterbegin', `<div class="my-list-item">
                                                                                                            <input type="radio" id="${selectedListType}-${res.data.id}" value="${res.data.id}" name="${selectedListType}" />
                                                                                                            <label for="${selectedListType}-${res.data.id}">${res.data.name}</label>
                                                                                                        </div>`)
                newlistNameInput.value = '';
                setTimeout(() => {
                    addNewListBtn.disabled = false;
                }, 1200)
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
        addNewListBtn.querySelector('svg').classList.remove('hide');
        addNewListBtn.querySelector('.spinner-border').classList.add('hide');
    }
}