//This is client 
//Server (emit) -> client (receive) -- acknowledgement-->server
// Client (emit) ->Server (receive) --acknowledgement-->client
const socket = io()

const $messageForm = document.getElementById('form')
const $messageForminput = document.getElementById('input')
const $messageFormButton = document.getElementById('formbutton')

const $locationButton = document.getElementById('send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    //Get new message element
    const $newMessages = $messages.lastElementChild
    //Height of the new last message
    const newMessageStyles = getComputedStyle($newMessages)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessages.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight
    //Height of Message Container
    const containerHeight = $newMessages.scrollHeight
    //How far I have scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight

    }





}


socket.on('message', (message) => {

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')

    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users


    })
    document.querySelector('#sidebar').innerHTML = html

})


socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render(locationMessageTemplate, {
        username: url.username,
        location: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})



document.getElementById('form').addEventListener('submit', (e) => {
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')
    //console.log(document.getElementById('input').value)
    const inpt = e.target.elements.input.value
    socket.emit('Client Message', inpt, (error) => {
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageForminput.value = ''
        $messageForminput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message Recieved')
    })
})

document.getElementById('send-location').addEventListener('click', () => {
    $locationButton.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by browser')

    }
    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('Sendlocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (callbac) => {
            $locationButton.removeAttribute('disabled')
            console.log(callbac)
        })


    })
})


// document.querySelector('form').addEventListener('submit', (e) => {
//     e.preventDefault()
//     console.log(document.querySelector('input').value)
//     const inpt = document.querySelector('input').value
//     socket.emit('Client Message', (inpt))
// })

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})