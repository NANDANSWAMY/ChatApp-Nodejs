const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')

const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
//socket io new raw http server
const port = process.env.PORT || 4000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

let count = 0
// this is server 
// io.on('connection', (socket) => {
//     console.log('New WebSocket connection')
//     socket.emit('countUpdated', count)
//     socket.on('increment', () => {
//         count++
//         //socket.emit('countUpdated', count) - this jsut emits to just 
//         // to that particular browser and not all browser windows
//         io.emit('countUpdated', count) // this emit to every single connection 
//     })
// })

// Events in socket - socket.emit, io.emit, socket.broadcast.emit
//Latest events in socket - io.to.emit, socket.broadcast.to.emit

io.on('connection', (socket) => {
    //console.log('New WebSocket connection')

    //socket.emit('welcome', 'Welcome')
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)

        }

        socket.join(user.room)
        socket.emit("message", generateMessage('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('Client Message', (message, callbac) => {
        const filter = new Filter()
        const user = getUser(socket.id)
        if (filter.isProfane(message)) {
            return callbac('Bad words not allowed')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))


        callbac()


    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username}   has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }


    })

    socket.on('Sendlocation', (cords, callbac) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${cords.latitude},${cords.longitude}`))
        callbac("Location is now printed")
    })

})


app.get('/lo', (req, res) => {
    res.send("HEy")
})


server.listen(port, () => {
    console.log('Server is up on port ' + port)
})

