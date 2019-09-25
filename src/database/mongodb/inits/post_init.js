const Post = require('../Schemas/post_document')

function find(id) {
	return new Promise((resolve, reject) => {
		Post.findOne({ user_id: id }, (err, Document) => {

			if (err) {

				init(id)
					.then(post_document => resolve(post_document))
					.catch(err => reject(err))

			} else {

				if (Document) {

					resolve(Document)

				} else {

					init(id)
						.then(post_document => resolve(post_document))
						.catch(err => reject('Não achei e não conseguir criar'))

				}

			}

		})
	})
}

function init(id) {
	return new Promise((resolve, reject) => {
		Post.create({ user_id: id }, (err, Document) => {

			if (err) {
				// Não tentarei encontrar chamando a função 'find'

				reject(err)

			} else {

				if (Document) {

					if (Document._doc) {

						resolve(Document._doc)

					} else {

						reject('Documento nulo')

					}

				} else {

					reject('post_document não criado')

				}

			}

		})
	})
}

module.exports = {

	find,

	init

}