require('dotenv').config()
const { genSaltSync, hashSync, compare } = require('bcryptjs')
const { gerate } = require('../../services/jwt')

User_init = require('../../database/mongodb/inits/user_init')
Post_init = require('../../database/mongodb/inits/post_init')
Talk_init = require('../../database/mongodb/inits/talk_init')

module.exports = {

	store(req, res) {
		try {

			const deleteUser = (id, msg) => {
				req
					.mysql('user')
					.where({ id })
					.first()
					.del()
					.then(() => res.status(500).send(msg))
					.catch(err => res.status(500).send(err))
			}

			const user = { ...req.body }

			req
				.mysql('user')
				.where({ email: user.email })
				.select('id')
				.first()
				.then(has => {
					if (!has) {

						if (user.password !== user.confirmPassword) throw 'Senhas diferentes!!'

						if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(user.email)) throw 'Email inválido!!!'

						if(!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{3,14}$/.test(user.password)) throw 'A senha deve conter no minímo 3 carácteres entre letras e números!!!'

						if (!/^[a-záàâãéèêíïóôõöúçñ ]+$/i.test(user.name)) throw 'Nome inválido!!!'

						if (user.genre !== 'm' && user.genre !== 'f') throw 'Gênero inválido!!!'

						user.password = user.password.toLowerCase()	

						const salt = genSaltSync(10)

						user.password = hashSync(user.password, salt)
							
						delete user.confirmPassword

						req
							.mysql('user')
							.insert(user)
							.then(([ id ]) => {

								User_init
									.init(id)
									.then(user_document => {

										Talk_init
											.init(id)
											.then(talk_document => {

												Post_init
													.init(id)
													.then(post_document => {

															delete user.password

															const slice = {
																['documents']: { 
																	user: user_document,
																	post: post_document,
																	talk: talk_document
																}, 
																id, 
																...user, 
																image: 'default.jpg'
															}

															gerate(slice)
																.then(payload => {
																	res.status(201).json(payload)
																}).catch(err => {
																	res.status(500).send(err)
																})

													}).catch(err => deleteUser(id, err))

											}).catch(err => deleteUser(id, err))

									}).catch(err => deleteUser(id, err))
								
							}).catch(err => {
								res.status(500).send(err)
							})

					} else {
						res.status(400).send('Usuário já existe')
					}
				}).catch(() => {
					res.status(500).send('Falha na consulta')
				})			
		} catch(msg) {
			res.status(400).send(msg)
		}
	},

	login(req, res) {
		try {

			const { email } = req.body
			let { password } = req.body

			req
				.mysql('user')
				.where({ email })
				.first()
				.then(async user => {
					if (user) {

						password = password.toLowerCase()

						if (!await compare(password, user.password)) return res.status(400).send('Senha incorreta')

						delete user.password
						delete user.created_at
						delete user.updated_at

						User_init
							.find(user.id)
							.then(user_document => {

								Talk_init
									.find(user.id)
									.then(talk_document => {

										Post_init
											.find(user.id)
											.then(post_document => {

												const slice = {
													['documents']: { 
														user: user_document,
														post: post_document,
														talk: talk_document
													}, 
													...user
												}

												gerate(slice)
													.then(payload => {
														res.status(200).json(payload)
													}).catch(err => {
														res.status(500).send(err)
													})

											}).catch(err => res.status(500).send(err))

									}).catch(err => res.status(500).send(err))

							}).catch(err => res.status(500).send(err))

					} else {
						res.status(400).send('Usuário não encontrado')
					}
				}).catch(e => {
					res.status(500).send('Falha na consulta')
				})

		} catch(msg) {
			res.status(400).send(msg)
		}
	},

	reconnect(req, res) {
		res.status(200).json(req.payload)
	}

}
