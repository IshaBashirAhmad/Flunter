const objectsList = [
    {
        id: 1,
        content: [
            {
                type: 'heading',
                text: '€90/month'
            },
            {
                type: 'heading2',
                text: '€600/month'
            },
            {
                type: 'heading3',
                text: '€1500/month'
            },
            {
                type: 'heading4',
                text: '€5000/month'
            }
        ]
    },
    {
        id: 2,
        content: [
            {
                type: 'heading',
                text: '€900/Year'
            },
            {
                type: 'heading2',
                text: '€6000/Year'
            },
            {
                type: 'heading3',
                text: '€15,000/Year'
            },
            {
                type: 'heading4',
                text: '€50,000/Year'
            }
        ]
    }
];

document.addEventListener('DOMContentLoaded', (event) => {
    
         document.getElementById('active').addEventListener('click', () => updateDisplaytext(1));
        document.getElementById('active2').addEventListener('click', () => updateDisplaytext(2));
     })


     function updateDisplaytext(id) {
        const object = objectsList.find(obj => obj.id === id);
        if (object) {
           
            document.getElementById('chng-head1').textContent = object.content.find(section => section.type === 'heading').text;
            document.getElementById('chng-head2').textContent = object.content.find(section => section.type === 'heading2').text;
            document.getElementById('chng-head3').textContent = object.content.find(section => section.type === 'heading3').text;
            document.getElementById('chng-head4').textContent = object.content.find(section => section.type === 'heading4').text;

        }
    }

    // change the color of buttons

    function changeColor(button) {
        // Remove 'active' id from all buttons
        let buttons = document.querySelectorAll('button');
        buttons.forEach(btn => btn.removeAttribute('id'));
        
        // Add 'active' id to the clicked button
        button.setAttribute('id', 'active');
    }
    
