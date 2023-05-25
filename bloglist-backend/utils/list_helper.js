const _ = require('lodash')

const dummy = (blogs) => {
	return 1;
}

const totalLikes = (blogs) => {
	return blogs.reduce(
		(sum, blog) => sum + blog.likes,
		0
	)
}

const favoriteBlog = (blogs) => {
	return blogs
	.map(blog => {
		const {title, author, likes} = blog
		return {title, author, likes}
	})
	.reduce(
		(prev, current) => prev.likes > current.likes ? prev : current
	)

}

const mostBlogs = (blogs) => {
	if (blogs.length === 0) {
		return "Blog list is empty";
	}

	return _.chain(blogs)
		.groupBy("author")
		.map((group, author) => {
			return { author, blogs: group.length}
		})
		.maxBy(object => object.blogs)
		.value()
}

const mostLikes = (blogs) => {
	if (blogs.length === 0) {
		return "Blog list is empty";
	}

	return _.chain(blogs)
		.groupBy("author")
		.map((group, author) => {
			return {author, likes: group.reduce((sum, blog) => sum + blog.likes, 0)}
		})
		.maxBy(object => object.likes)
		.value()
}

module.exports = {
	dummy,
	totalLikes,
	favoriteBlog,
	mostBlogs,
	mostLikes
}