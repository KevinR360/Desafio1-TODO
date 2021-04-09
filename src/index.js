const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if (!user) {
    return response.status(401).json({error: 'User not found!'});
  }

  request.user = user;

  next();
}

function checksExistsTodo(request, response, next) {
  const { user } = request;
  const { id } = request.params;

  const todoExist = user.todos.some(todo => todo.id === id);

  if (!todoExist) {
    return response.status(404).json({ error: 'Todo not found!' });
  }

  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  if (!name || !username) {
    return response.status(400).json({error: 'Need send name and username'});
  }

  const userNameAlreadyExists =  users.find(user => user.username === username);

  if (userNameAlreadyExists) {
    return response.status(400).json({ error: 'This username already exists!' });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(201).json([...user.todos]);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline} = request.body;

  if (!title || !deadline) {
    return response.status(400).json({ error: 'You need send title and deadline!'});
  }

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user } = request;
  const { id } = request.params;
  const { title, deadline } = request.body;

  user.todos = user.todos.map(todo => { 
    if(todo.id === id) {
      return {
        ...todo,
        title: title || todo.title,
        deadline: deadline ? new Date(deadline) : todo.deadline,
      }
    }
    return todo;
  });

  const todoUpdated = user.todos.find(todo => todo.id === id);

  return response.status(201).json(todoUpdated);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  user.todos = user.todos.map(todo => { 
    if(todo.id === id) {
      return {
        ...todo,
        done: true,
      }
    }
    return todo;
  });

  const todoUpdated = user.todos.find(todo => todo.id === id);

  return response.status(201).json(todoUpdated);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  user.todos = user.todos.filter(todo => todo.id !== id);

  return response.status(204).json([...user.todos]);
});

module.exports = app;