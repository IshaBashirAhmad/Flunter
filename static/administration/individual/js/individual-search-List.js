function selectFilter(filterType) {
    document.getElementById('selected-filter-text').innerText = filterType;
}

const sortOrders = {};

function table_sort(event, index) {
    const arrows = event.target.closest('th').querySelectorAll('path');
    table = document.getElementById('individual_table')
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
    table = document.getElementById('individual_table')
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

function deleteSearch(id) {
    var modal_button = document.getElementById('delete_search_modal_button');
    modal_button.onclick = async function () {
        try {
            let headers = { 
                'Content-Type': 'application/json'
            };
            let response = await requestAPI("/users/delete-search/"+id+"/", null, headers, "POST");
            if (response.headers.get('content-type').includes('application/json')) {
                let res = await response.json();
                if (res.success) {
                    console.log(res);
                    window.location.reload();
                } else {
                    console.log('error');
                }
            } else {
                let text = await response.text();
                console.log('Received non-JSON response:', text);
            }
        } catch (err) {
            console.log('Error:', err);
        }
    };
}

