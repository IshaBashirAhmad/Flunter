let activityUserSelectBtn = document.getElementById('activity-user-select-btn');
let activityUserSearchWrapper = document.getElementById('activity-user-search-wrapper');
let activityUserListWrapper = document.getElementById('activity-user-list-items-wrapper');
let selectedActivityUserNames = [];
let selectedActivityUserIds = [current_user_id];

let cityDropdown = document.getElementById('city-dropdown');
let cityField = document.getElementById('city-field');
let cityList = [];
let selectedCity = '';
let currentFilter = '';
let cityStartIndex = 0;
const batchSize = 20;

let stateDropdown = document.getElementById('state-dropdown');
let stateField = document.getElementById('state-field');
let stateList = [];
let selectedState = '';

let regionDropdown = document.getElementById('region-dropdown');
let regionField = document.getElementById('region-field');
let regionList = [];
let selectedRegion = '';

let countryDropdown = document.getElementById('country-dropdown');
let countryField = document.getElementById('country-field');
let countryList = [];
let selectedCountry = '';

let actionTypeDropdown = document.getElementById('action-type-dropdown');
let actionTypeField = document.getElementById('action-type-field');
let selectedActionType = '';

let selectedStartDate = null;
let selectedEndDate = null;

let startDate = flatpickr('#start-date-field', {
    dateFormat: "d-m-Y",
    maxDate: "today",
    onChange: function(selectedDates, dateStr, instance) {
        selectedStartDate = selectedDates[0];
        // actionDateTimeText.innerText = dateStr;
    },
});

document.getElementById('start-date-field').addEventListener('click', function(event) {
    event.preventDefault();
});


let endDate = flatpickr('#end-date-field', {
    dateFormat: "d-m-Y",
    maxDate: "today",
    onChange: function(selectedDates, dateStr, instance) {
        selectedEndDate = selectedDates[0];
        // actionDateTimeText.innerText = dateStr;
    },
});

document.getElementById('end-date-field').addEventListener('click', function(event) {
    event.preventDefault();
});


function populateLocationDropdown() {
    cityList = locationData['Unique Cities'];
    stateList = locationData['Unique States'];
    regionList = locationData['Unique Regions'];
    countryList = ['France'];
    
    loadMoreCities();
    renderList(stateDropdown, stateList, 'state');
    renderList(regionDropdown, regionList, 'region');
    renderList(countryDropdown, countryList, 'country');
}

window.addEventListener('load', populateLocationDropdown);


function searchInCityList() {
    currentFilter = normalizeText(cityField.value.toLowerCase());
    if (currentFilter === '') {
        cityDropdown.innerHTML = '';
        cityStartIndex = 0;
        loadMoreCities();
    } else {
        renderFilteredLists(cityDropdown, currentFilter, cityList, 'city');
    }
}

function searchInStateList() {
    let filterText = normalizeText(stateField.value.toLowerCase());
    if (filterText === '') {
        stateDropdown.innerHTML = '';
        renderList(stateDropdown, stateList, 'state');
    } else {
        renderFilteredLists(stateDropdown, filterText, stateList, 'state');
    }
}

function searchInRegionList() {
    let filterText = normalizeText(regionField.value.toLowerCase());
    if (filterText === '') {
        regionDropdown.innerHTML = '';
        renderList(regionDropdown, regionList, 'region');
    } else {
        renderFilteredLists(regionDropdown, filterText, regionList, 'region');
    }
}

function searchInCountryList() {
    let filterText = normalizeText(countryField.value.toLowerCase());
    if (filterText === '') {
        countryDropdown.innerHTML = '';
        renderList(countryDropdown, countryList, 'country');
    } else {
        renderFilteredLists(countryDropdown, filterText, countryList, 'country');
    }
}


function renderFilteredLists(dropdownElement, filterText, list, type='city') {
    let filteredLocation = filterList(filterText, list);
    renderList(dropdownElement, filteredLocation, type);
}

function renderList(container, list, type) {
    if (list.length == 0) {
        container.innerHTML = '<span>No Item</span>';
    }
    else {
        container.innerHTML = '';
        list.forEach(item => {
            const span = document.createElement('span');
            span.setAttribute('onclick', `selectLocation(event, this, '${type}')`);
            span.textContent = item;
            container.appendChild(span);
        });
    }
}


function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}


function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

const debouncedSearch = debounce(searchInCityList, 300);
cityField.addEventListener('input', debouncedSearch);

stateField.addEventListener('input', searchInStateList);
regionField.addEventListener('input', searchInRegionList);
countryField.addEventListener('input', searchInCountryList);


function filterList(inputText, list) {
    let hyphenatedText = inputText.replace(' ', '-');
    let unhyphenatedText = inputText.replace('-', ' ');

    return list.filter(item => {
        let normalizedItem = normalizeText(item.toLowerCase());
        return normalizedItem.includes(inputText) || normalizedItem.includes(hyphenatedText) || normalizedItem.includes(unhyphenatedText);
    });
}


function loadMoreItems(container, list, start, end) {
    for (let i = start; i < end; i++) {
        if (i >= list.length) break;
        const span = document.createElement('span');
        span.setAttribute('onclick', 'selectLocation(event, this, "city")');
        span.textContent = list[i];
        container.appendChild(span);
    }
}

function loadMoreCities() {
    let listToLoad = currentFilter ? filterList(currentFilter, cityList) : cityList;
    loadMoreItems(cityDropdown, listToLoad, cityStartIndex, cityStartIndex + batchSize);
    cityStartIndex += batchSize;
}

cityDropdown.addEventListener('scroll', () => {
    if (cityDropdown.scrollTop + cityDropdown.clientHeight >= cityDropdown.scrollHeight) {
        loadMoreCities();
    }
});


cityField.addEventListener('focus', function() {
    cityDropdown.classList.add('show-flex');
})

cityField.addEventListener('blur', function(event) {
    setTimeout(() => {
        cityDropdown.classList.remove('show-flex');
    }, 200);
})


stateField.addEventListener('focus', function() {
    stateDropdown.classList.add('show-flex');
})

stateField.addEventListener('blur', function(event) {
    setTimeout(() => {
        stateDropdown.classList.remove('show-flex');
    }, 200);
})


regionField.addEventListener('focus', function() {
    regionDropdown.classList.add('show-flex');
})

regionField.addEventListener('blur', function(event) {
    setTimeout(() => {
        regionDropdown.classList.remove('show-flex');
    }, 200);
})


countryField.addEventListener('focus', function() {
    countryDropdown.classList.add('show-flex');
})

countryField.addEventListener('blur', function(event) {
    setTimeout(() => {
        countryDropdown.classList.remove('show-flex');
    }, 200);
})


function selectLocation(event, element, type) {
    if (type == 'city') {
        cityField.value = element.innerText;
        selectedCity = element.innerText;
    }
    else if (type == 'state') {
        stateField.value = element.innerText;
        selectedState = element.innerText;
    }
    else if (type == 'region') {
        regionField.value = element.innerText;
        selectedRegion = element.innerText;
    }
    else if (type == 'country') {
        countryField.value = element.innerText;
        selectedCountry = element.innerText;
    }
}


actionTypeField.addEventListener('focus', function() {
    actionTypeDropdown.classList.add('show-flex');
})

actionTypeField.addEventListener('blur', function(event) {
    setTimeout(() => {
        actionTypeDropdown.classList.remove('show-flex');
    }, 200);
})


function filterActionType(element) {
    actionTypeField.value = element.innerText;
    selectedActionType = element.getAttribute('data-value');
}


activityUserSelectBtn.addEventListener('click', function() {
    if (activityUserSearchWrapper.classList.contains('hide')) {
        activityUserSearchWrapper.classList.remove('hide');
    }
    else {
        activityUserSearchWrapper.classList.add('hide');
    }
})


function checkEnter(event) {
    if (event.keyCode == 13) {
        event.preventDefault();
    }
}


function searchActivityUser(inputField) {
    let filteredActivityUsers = [];
    if (inputField.value == '') {
        filteredActivityUsers = relatedUsers.map(activityUser => activityUser.id);
    }
    else {
        filteredActivityUsers = relatedUsers.filter(activityUser => activityUser.first_name.toLowerCase().includes(inputField.value.toLowerCase() || inputField.value === '')).map(activityUser => activityUser.id);
    }

    if (filteredActivityUsers.length == 0) {
        document.getElementById('no-activity-user-text').classList.remove('hide');
        document.querySelectorAll('.activity-user-list-item').forEach((item) => item.classList.add('hide'));
    }
    else {
        document.getElementById('no-activity-user-text').classList.add('hide');
        document.querySelectorAll('.activity-user-list-item').forEach((item) => {
            let itemID = item.getAttribute('data-id');
            if (filteredActivityUsers.includes(parseInt(itemID, 10))) {
                item.classList.remove('hide');
            }
            else {
                item.classList.add('hide');
            }
        })
    }
}


function selectActivityUser(input) {
    if (input.checked) {
        // Add user to the selected lists
        if (!selectedActivityUserIds.includes(parseInt(input.value))) {
            selectedActivityUserIds.push(parseInt(input.value));
            selectedActivityUserNames.push(input.getAttribute('data-name'));
        }
    } else {
        // Remove user from the selected lists
        const index = selectedActivityUserIds.indexOf(parseInt(input.value));
        if (index > -1) {
            selectedActivityUserIds.splice(index, 1);
            selectedActivityUserNames.splice(index, 1);
        }
    }

    // Update the selected user display (optional)
    const selectedUserString = selectedActivityUserNames.join(', ');
}


function closeDropdowns(event) {
    if (!(activityUserSelectBtn.contains(event.target)) && !(activityUserSearchWrapper.contains(event.target)) && !(activityUserSearchWrapper.classList.contains('hide'))) {
        activityUserSearchWrapper.classList.add('hide');
    }
}

document.body.addEventListener('click', closeDropdowns);


function openFilterModal(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `filterActivityUserForm(event);`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.querySelector('button[type="submit"]').disabled = false;
        modal.querySelector('.btn-text').innerText = 'Apply Changes';
    })
    document.querySelector(`.${modalId}`).click();
}


function filterActivityUserForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let errorMsg = form.querySelector('.filter-error-msg');

    if (selectedStartDate && selectedEndDate) {
        if (selectedStartDate > selectedEndDate) {
            errorMsg.innerText = 'Start date must be lower than end date';
            errorMsg.classList.add('active');
            return false;
        }
    }

    if (data.search_shared == '')
        selectedCity = '';
    if (data.search_city == '')
        selectedCity = '';
    if (data.search_state == '')
        selectedState = '';
    if (data.search_region == '')
        selectedRegion = '';
    if (data.search_country == '')
        selectedCountry = '';
    if(data.start_date == ''){
        selectedStartDate= ''
    }
    if(data.end_date == ''){
        selectedEndDate= ''
    }

    if (selectedStartDate) {
        selectedStartDate.setHours(0);
        selectedStartDate.setMinutes(0);
        selectedStartDate.setSeconds(0);
    }

    if (selectedEndDate) {
        selectedEndDate.setHours(23);
        selectedEndDate.setMinutes(59);
        selectedEndDate.setSeconds(59);
    }

    errorMsg.innerText = '';
    errorMsg.classList.remove('active');

    let filterData = {
        "start_date": selectedStartDate ? formatDate(selectedStartDate) : null,
        "end_date": selectedEndDate ? formatDate(selectedEndDate) : null,
        "city": selectedCity,
        "country": selectedCountry,
        "state": selectedState,
        "region": selectedRegion,
        "action_type": selectedActionType,
        "created_by": selectedActivityUserIds.length ? selectedActivityUserIds : '' // Pass the list of IDs
    };

    activityUserDataObject.filter_data = filterData;
    for (const [key, value] of Object.entries(filterData)) {
        activityUserListUrl = setParams(activityUserListUrl, key, value || '');
    }
    const selectedUserString = selectedActivityUserIds.join(',') || '';
    activityUserListUrl = setParams(activityUserListUrl, 'created_by', selectedUserString);
    getRelatedUserList(activityUserListUrl);
    document.querySelector('.activitiesFilterModal').click();
}


function formatDate(inputDate) {
    // Create a new Date object
    let date = new Date(inputDate);

    // Get the year, month, and day
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    let day = String(date.getDate()).padStart(2, '0');

    // Format as YYYY-MM-DD
    return `${year}-${month}-${day}`;
}