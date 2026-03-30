require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const Person = require('./models/person')

const app = express()

morgan.token('body', function (req, res) { 
    return JSON.stringify(req.body)
})

morgan.format('data', morgan['tiny'] + ' :body')

app.use(express.json())
app.use(express.static('dist'))
app.use(morgan('data'))

app.get('/info', (request, response, next) => {
    Person.countDocuments()
        .then(count => {
            response.send(`
            <p>Phonebook has info for ${count} people </p>
            <p>${new Date()}<p/>`)
        })
        .catch(error => next(error))
})

app.get('/api/persons', (request, response, next) => {
    Person.find({})
        .then(people => {
            response.json(people)
        })
        .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if(person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body
    
    if (!body.name || !body.number) {
        return response.status(400).json({ 
            error: 'content missing' 
        })
    }

    // if(persons.find(p => p.name === body.name)) {
    //     return response.status(400).json({ 
    //         error: 'name must be unique' 
    //     })    
    // }
    const person = new Person({
        name: body.name,
        number: body.number
    })
    
    person.save()
        .then(savedPerson => {
            response.json(savedPerson)
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const { name, number } = request.body
    
    Person.findById(request.params.id)
        .then(person => {
            if(!person) {
                return response.status(404).end()
            }
            person.name = name
            person.number = number
    
            return person.save().then(updatedPerson => {
                response.json(updatedPerson)
            })
        })
        .catch(error => next(error))

})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
    console.log(error.message)

    if(error.name === 'CastError') {
        return response.status(400).send({ error: 'Malformatted id'})
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})