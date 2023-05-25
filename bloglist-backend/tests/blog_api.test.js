const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const helper = require('./test_helper');
const app = require('../app');
const User = require('../models/user');
const Blog = require('../models/blog');

const api = supertest(app);

// clear db and initialize data before each test
beforeEach(async () => {
  const users = await helper.usersInDb();
  const rootUser = users[0];

  await Blog.deleteMany({});

  let blogObject = new Blog({ ...helper.initialBlogs[0], user: rootUser.id });
  await blogObject.save();
  blogObject = new Blog({ ...helper.initialBlogs[1], user: rootUser.id });
  await blogObject.save();
});

// tests

describe('when there is initially some notes saved', () => {
  test('notes are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('all notes are returned', async () => {
    const response = await api.get('/api/blogs');

    expect(response.body).toHaveLength(helper.initialBlogs.length);
  });

  test('a specfic blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs');
    const blogTitles = response.body.map((b) => b.title);

    expect(blogTitles).toContain("Hector's blog");
  });

  test('unique identifier of blogs is named \'id\'', async () => {
    const response = await api.get('/api/blogs');
    expect(response.body[0].id).toBeDefined();
  });
});

describe('adding a note', () => {
  test('fails if token is invalid', async () => {
    const newBlog = {
      title: 'Test Blog',
      url: 'test.com',
      likes: 11,
    };

    const result = await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkhlY3RvciIsImlkIjoiNjQ2ZDFlODllNGFhMTlmYWE4ZWFjMjliIiwiaWF0IjoxNjg0OTYzMzE1fQ.eXwDZ1eFvgDrA3fZDobxgN1cghQejsSjhHLYV56NSts');

    expect(result.body.error).toContain('invalid token');
  });

  test('a valid blog can be added', async () => {
    const userLogin = {
      username: 'root',
      password: 'sekret',
    };
    const loginResult = await api
      .post('/api/login')
      .send(userLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const newBlog = {
      title: 'Test Blog',
      url: 'test.com',
      likes: 11,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', `Bearer ${loginResult.body.token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

    const blogTitles = blogsAtEnd.map((b) => b.title);
    expect(blogTitles).toContain('Test Blog');
  });

  test('if likes is not in request, default is 0', async () => {
    const userLogin = {
      username: 'root',
      password: 'sekret',
    };
    const loginResult = await api
      .post('/api/login')
      .send(userLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const newBlog = {
      title: "Lupita's blog",
      url: 'Lupita.com',
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', `Bearer ${loginResult.body.token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    const savedBlog = blogsAtEnd.find((b) => b.title === 'Lupita\'s blog');

    expect(savedBlog.likes).toBeDefined();
    expect(savedBlog.likes).toBe(0);
  });

  test('a blog without title is not added', async () => {
    const userLogin = {
      username: 'root',
      password: 'sekret',
    };
    const loginResult = await api
      .post('/api/login')
      .send(userLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/);
    const newBlog = {
      author: 'Lupita',
      url: 'Lupita.com',
      likes: 11,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', `Bearer ${loginResult.body.token}`)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });

  test('a blog without URL is not added', async () => {
    const userLogin = {
      username: 'root',
      password: 'sekret',
    };
    const loginResult = await api
      .post('/api/login')
      .send(userLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/);
    const newBlog = {
      title: "Lupita's blog",
      author: 'Lupita',
      likes: 11,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', `Bearer ${loginResult.body.token}`)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
});

describe('deleting a note', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogToDelete = await Blog.findOne({ title: 'Hector\'s blog' });

    const userLogin = {
      username: 'root',
      password: 'sekret',
    };
    const loginResult = await api
      .post('/api/login')
      .send(userLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', `Bearer ${loginResult.body.token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1);

    const blogTitles = blogsAtEnd.map((b) => b.title);
    expect(blogTitles).not.toContain('Hector\'s blog');
  });
});

describe('updating a blog', () => {
  test('updating likes suceeds with 200', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    const newInfo = {
      title: "Karina's blog",
      author: 'Karina',
      url: 'Karina.com',
      likes: 20,
    };

    await api.put(`/api/blogs/${blogToUpdate.id}`)
      .send(newInfo)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    const updatedBlog = blogsAtEnd[0];

    expect(updatedBlog.likes).toBe(20);
  });
});

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'root', passwordHash, name: 'root' });

    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'hectorTest',
      name: 'hectorTest',
      password: 'hectorTest',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((user) => user.username);
    expect(usernames).toContain(newUser.username);
  });

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('expected `username` to be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toEqual(usersAtStart);
  });

  test('creation fails if name or password is not provided', async () => {
    const usersAtStart = await helper.usersInDb();

    // const newUser = {
    //   name: 'Superuser',
    //   password: 'salainen',
    // };

    const newUser = {
      username: 'root',
      name: 'Superuser',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('username and password must be provided');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toEqual(usersAtStart);
  });

  test('creation fails if username or password are shorter than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      username: 'he',
      name: 'hector',
      password: 'hector',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('username and password must be at least 3 characters long');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toEqual(usersAtStart);
  });
});

// close connecion after every test
afterAll(async () => {
  await mongoose.connection.close();
});
