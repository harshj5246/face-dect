const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const { response } = require('express');

const db = knex({
    client: 'pg',
    connection:{
        host: '127.0.0.1',
        user : 'postgres',
        password: 'test',
        database: 'postgres'

    } 
});

 
const app = express(); 

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors())

const database = {
    users:[
     {

        id: '123',
        name: 'harsh',
        email: 'jainh9712@gmail.com',
        password: 'harsh',
        entries: 0,
        joined: new Date()
     },
     {
 
        id: '124',
        name: 'shi',
        email: 'ish9712@gmail.com',
        password: 'mittal',
        entries: 0,
        joined: new Date()
     }

    ],
    // login: [
    //     {

    //         id: '987',
    //         hash: '',
    //         email: 'jainh9712@gmail.com'
    //     }
    // ]
}

app.get('/' , (req ,res)=>{
    res.send(database.users)      
    
})

// app.post('/signin' , (req ,res)=>{
//     res.json('signin')
// })


app.post('/signin' , (req, res)=> {
    const { email, password} = req.body;
    if(!email || !password ){
        return res.status(400).json('incorrect form subbmition');
    }
      db.select('email', 'hash',).from('login')
      .where('email', '=', email )
      .then(data =>{
        const isvalid = bcrypt.compareSync(password, data[0].hash);
        if(isvalid){
           return db.select('*').from('users')
            .where('email', '=', email)
            .then(user =>{
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else{
            res.status(400).json('wrong credentials')
        }
      })
       .catch(err => res.status(400).json('wrong credentials'))
    })

    app.post('/register', (req,res)=>{
        const { email, name , password } = req.body;
        if(!email ||!name || !password ){
            return res.status(400).json('incorrect form subbmition');
        }
        const hash = bcrypt.hashSync(password);
         db.transaction(trx => {
             trx.insert({
                 hash: hash,
                 email: email
             })
             .into('login')
             .returning('email')
             .then(loginEmail => {
                return trx('users')
                  .returning('*')
                  .insert({
                    email: loginEmail[0],
                    name: name,
                    joined: new Date()
                })
                .then(user => {
                    res.json(user[0]);
                })
               })
               .then(trx.commit)
               .catch(trx.rollback)
           })
       
        .catch(err => res.status(400).json('unable to register'))
        
    })
    
    app.get('/profile/:id',(req, res)=>{
        const { id } = req.params;
        let found = false;
        db.select('*').from('users').where({id})
        .then(user =>{
            if(user.length){
                res.json(user[0])
            }else{
                res.status(400) .json('not found')
            }
            
        })
       .catch(err => res.status(400).json('error getting user'))

    })
    app.put('/image',(req,res)=>{
        const  {id } = req.body;
      db('users').where('id', '=', id)
      .increment('entries',1)
      .returning('entries')
      .then(entries => {
          res.json(entries[0]);
      })
      .catch(err => res.status(400).json('unable to get entries'))
})
app.listen(process.env.PORT ||3000, ()=>{
    console.log(`app is running on port ${process.env.PORT}`);
}) 