const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild // Get last child element of parent, .lastChild returns last element as a Node object

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage) // getComputedStyle = comes from browser
    const newMessageMargin = parseInt(newMessageStyles.marginBottom) // Change '16'px to 16 int
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin // Total element height WITH margins included
    
    // Visible height
    const visibleHeight = $messages.offsetHeight // Returns height of an element including vertical padding & borders. Does NOT include MARGINS

    // Height of messages container
    const scrollContainerTotalHeight = $messages.scrollHeight // Total height of elements content, including overflow/scrolled content

    // How far is user scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight // scrollTop - distance from absolute top to top of visible content. Scroll offset - if user is scrolled up

    if (scrollContainerTotalHeight - newMessageHeight <= scrollOffset) { // If full container height - new message height <= 
        $messages.scrollTop = scrollContainerTotalHeight  // Effectively setting scrollTop to bottom of all scroll container
    }

}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)

    autoscroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)

    autoscroll()
})


socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable form
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        //reenable form, clear input, refocus input
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('The message was delivered')        
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href='/'
    }
})