/* eslint-disable no-underscore-dangle */
const Blog = require('../models/blog');
const User = require('../models/user');

const initialBlogs = [
  {
    title: "Karina's blog",
    author: 'Karina',
    url: 'Karina.com',
    likes: 10,
  },
  {
    title: "Hector's blog",
    author: 'Hector',
    url: 'Hector.com',
    likes: 24,
  },
];

const nonExistingId = async () => {
  const blog = new Blog({
    title: "karina's blog",
    author: 'Karina',
    url: 'Karina.com',
    likes: 6,
  });
  await blog.save();
  await blog.deleteOne();

  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
  usersInDb,
};
