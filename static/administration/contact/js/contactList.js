let contactListTableContainer = document.getElementById('table-container-div');
let loader = document.querySelector('#table-loader');
let urlParams = 'q=&page=';


async function getList(params) {
    contactListTableContainer.classList.add('hide');
    loader.classList.remove('hide');
    let response = await requestAPI(`/users/get-contact-list/${params}/`, null, {}, 'GET');
    response.json().then(function(res) {
        if(res.success) {
            contactListTableContainer.innerHTML = res.html;
            loader.classList.add('hide');
            generatePages(res.current_page, res.total_pages);
            contactListTableContainer.classList.remove('hide');
            urlParams = params;
        }
    })
}

window.addEventListener('load', getList(urlParams));


function selectFilter(filterType) {
    document.getElementById('selected-filter-text').innerText = filterType;
}

document.addEventListener("DOMContentLoaded", function() {
    var tableRows = document.querySelectorAll("#contact_table tbody tr");
    tableRows.forEach(function(row) {
        row.addEventListener("click", function() {
            var pk = this.dataset.pk;
            console.log(pk)
            window.location.href = "/administration/contact-detail/" + pk;
        });
    });
});

const sortOrders = {};

function table_sort(event, index) {
    const arrows = event.target.closest('th').querySelectorAll('path');
    table = document.getElementById('contact_table')
    const currentOrder = sortOrders[index] || 'asc';
    const arr = Array.from(table.querySelectorAll('tbody tr'));
    arr.sort((a, b) => {
        const a_val = a.children[index].innerText
        const b_val = b.children[index].innerText
        return currentOrder === 'asc' ? a_val.localeCompare(b_val) : b_val.localeCompare(a_val)
    })
    arr.forEach(elem => {
        table.querySelector("tbody").appendChild(elem)
    })
    arrows[0].setAttribute('opacity', currentOrder === 'asc' ? '0.2' : '1');
    arrows[1].setAttribute('opacity', currentOrder === 'asc' ? '1' : '0.2');
    sortOrders[index] = currentOrder === 'asc' ? 'desc' : 'asc';
}

function table_sort_by_state(event, index) {
    const arrows = event.target.closest('th').querySelectorAll('path');
    table = document.getElementById('contact_table')
    const currentOrder = sortOrders[index] || 'asc';
    const arr = Array.from(table.querySelectorAll('tbody tr'));
    arr.sort((a, b) => {
        const a_val = a.getAttribute('data-state')
        const b_val = b.getAttribute('data-state')
        return currentOrder === 'asc' ? a_val.localeCompare(b_val) : b_val.localeCompare(a_val)
    })
    arr.forEach(elem => {
        table.querySelector("tbody").appendChild(elem)
    })
    arrows[0].setAttribute('opacity', currentOrder === 'asc' ? '0.2' : '1');
    arrows[1].setAttribute('opacity', currentOrder === 'asc' ? '1' : '0.2');
    sortOrders[index] = currentOrder === 'asc' ? 'desc' : 'asc';
}


function generatePages(currentPage, totalPages) {
    const pagesContainer = document.getElementById('pages-container');
    pagesContainer.innerHTML = '';

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }

    if (startPage > 1) {
        pagesContainer.innerHTML += '<span class="cursor-pointer">1</span>';
        if (startPage > 2) {
            pagesContainer.innerHTML += '<span class="ellipsis-container">...</span>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pagesContainer.innerHTML += `<span${i === currentPage ? ' class="active"' : ' class="cursor-pointer"'}>${i}</span>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagesContainer.innerHTML += '<span class="ellipsis-container">...</span>';
        }
        pagesContainer.innerHTML += `<span class="cursor-pointer">${totalPages}</span>`;
    }
    pagesContainer.querySelectorAll('span').forEach((span) => {
        if ((!span.classList.contains('active'))  && (!span.classList.contains('ellipsis-container'))) {
            let page = span.innerText;
            let pageUrl = setParams(urlParams, 'page', page);
            span.setAttribute("onclick", `getList('${pageUrl}')`);
        }
    })
}