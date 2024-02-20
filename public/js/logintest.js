/* eslint-disable */
import axios from 'axios';
// import { axios } from 'axios';
// const axios = require('axios');
// import { showAlert } from './alerts';
export const login = async (email,password)=>{
    console.log(email);
    console.log(password);
    try{
        const res = await axios({
            method:'POSt',
            url:'/api/v1/users/login',
            data:{
                email:email,
                password:password
            }
        });        
    }catch(e){
        console.log('錯誤訊息!')
        console.log(e);
    }
    console.log(res);
};

document.querySelector('.form').addEventListener('submit', e=>{
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password =  document.getElementById('password').value;
    login(email,password);
});