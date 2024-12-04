let sharedDropdown = document.getElementById('shared-dropdown');
let sharedField = document.getElementById('shared-field');

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


function selectShared(inputElement) {
    if(inputElement.checked) {
        sharedField.value = inputElement.nextElementSibling.innerText;
        selectedshared = inputElement.value;
    }
}

sharedField.addEventListener('focus', function() {
    sharedDropdown.classList.add('show-flex');
})

sharedField.addEventListener('blur', function(event) {
    setTimeout(() => {
        sharedDropdown.classList.remove('show-flex');
    }, 200);
})

sharedField.addEventListener('input', function() {
    let filteredSharedUsers = [];
    filteredSharedUsers = relatedUsers.filter(shared => shared.full_name.toLowerCase().includes(this.value.toLowerCase())).map((shared => shared.id));
    if (filteredSharedUsers.length == 0) {
        document.getElementById('no-shared-text').classList.remove('hide');
        document.querySelectorAll('.shared-item-list').forEach((item) => item.classList.add('hide'));
    }
    else {
        document.getElementById('no-shared-text').classList.add('hide');
        document.querySelectorAll('.shared-item-list').forEach((item) => {
            let itemID = item.getAttribute('data-id');
            if (filteredSharedUsers.includes(parseInt(itemID, 10))) {
                item.classList.remove('hide');
            }
            else {
                item.classList.add('hide');
            }
        })
    }
})


function openFilterModal(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `filterSharedProfileForm(event);`);
    if (selectedTableListType == 'shared-to')
        document.getElementById('shared-user-text').innerText = 'Shared By';
    else if (selectedTableListType == 'shared-from')
        document.getElementById('shared-user-text').innerText = 'Shared To';
    modal.addEventListener('hidden.bs.modal', event => {
        // form.reset();
        // form.removeAttribute("onsubmit");
        form.querySelector('button[type="submit"]').disabled = false;
        modal.querySelector('.btn-text').innerText = 'Apply Changes';
    })
    document.querySelector(`.${modalId}`).click();
}


function filterSharedProfileForm(event) {
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

    if (data.search_city == '')
        selectedCity = '';        
    if (data.search_state == '')
        selectedState = '';
    if (data.search_region == '')
        selectedRegion = '';
    if (data.search_country == '')
        selectedCountry = '';

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

    // let idList = searchUsersByName(data.search_shared);
    let idList = [];
    if (data.search_shared != '') {
        if ('shared_user' in data) {
            idList = [parseInt(data.shared_user)];
        }
    }

    let filterDataObject = {
        "start_date": selectedStartDate,
        "end_date": selectedEndDate,
        "city": selectedCity,
        "country": selectedCountry,
        "state": selectedState,
        "region": selectedRegion,
        "shared_users": idList
    }

    console.log(filterDataObject);

    let filterStartDate = selectedStartDate ? `${selectedStartDate.getFullYear()}-${(selectedStartDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedStartDate.getDate().toString().padStart(2, '0')}` : '';
    let filterEndDate = selectedEndDate ? `${selectedEndDate.getFullYear()}-${(selectedEndDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedEndDate.getDate().toString().padStart(2, '0')}` : '';
    // return false;

    requiredSharedToDataURL = setParams(requiredSharedToDataURL, 'city', selectedCity);
    requiredSharedToDataURL = setParams(requiredSharedToDataURL, 'state', selectedState);
    requiredSharedToDataURL = setParams(requiredSharedToDataURL, 'region', selectedRegion);
    requiredSharedToDataURL = setParams(requiredSharedToDataURL, 'country', selectedCountry);
    requiredSharedToDataURL = setParams(requiredSharedToDataURL, 'shared_from', data.shared_user || '');
    requiredSharedToDataURL = setParams(requiredSharedToDataURL, 'start_date', filterStartDate || '');
    requiredSharedToDataURL = setParams(requiredSharedToDataURL, 'end_date', filterEndDate || '');

    requiredSharedFromDataURL = setParams(requiredSharedFromDataURL, 'city', selectedCity);
    requiredSharedFromDataURL = setParams(requiredSharedFromDataURL, 'state', selectedState);
    requiredSharedFromDataURL = setParams(requiredSharedFromDataURL, 'region', selectedRegion);
    requiredSharedFromDataURL = setParams(requiredSharedFromDataURL, 'country', selectedCountry);
    requiredSharedFromDataURL = setParams(requiredSharedFromDataURL, 'shared_to', data.shared_user || '');
    requiredSharedFromDataURL = setParams(requiredSharedFromDataURL, 'start_date', filterStartDate || '');
    requiredSharedFromDataURL = setParams(requiredSharedFromDataURL, 'end_date', filterEndDate || '');

    getSharedToList(requiredSharedToDataURL);
    getSharedFromList(requiredSharedFromDataURL);
    
    document.querySelector('.shareFilterModal').click();
}