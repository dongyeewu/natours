console.log("hello from parcel");
import '@babel/polyfill';
import { login, logout} from './login';
import { updateSetting } from './updateSettings';
import { bookTour } from './stripe';

// DOM elements
const loginForm = document.querySelector('.login-form');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateUser = document.querySelector('.form-user-data');
const updateUserPassword = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

if (loginForm){
  loginForm.addEventListener('submit', e=>{
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password =  document.getElementById('password').value;
    login(email,password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (updateUser){
  updateUser.addEventListener('submit', e=>{
    e.preventDefault();
   
    const name =  document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photo = document.getElementById('photo').files[0];
    
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('photo', photo);
    console.log(form);

    updateSetting(form,'data');
    // login(email,password);
  });
}

if (updateUserPassword){
  updateUserPassword.addEventListener('submit', e=>{
    e.preventDefault();
    const passwordCurrent =  document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    updateSetting({
      passwordCurrent: passwordCurrent,
      password: password,
      passwordConfirm: passwordConfirm,
    },'passWord');
    // login(email,password);
  });
}

if(bookBtn){
  bookBtn.addEventListener('click', e=>{
    // e.preventDefault();
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    console.log(tourId);
    bookTour(tourId);
  });
}

// /* eslint-disable */
// import '@babel/polyfill';
// import { displayMap } from './mapbox';
// import { login, logout } from './login';
// import { updateSettings } from './updateSettings';

// // DOM ELEMENTS
// const mapBox = document.getElementById('map');
// const loginForm = document.querySelector('.form--login');
// const logOutBtn = document.querySelector('.nav__el--logout');
// const userDataForm = document.querySelector('.form-user-data');
// const userPasswordForm = document.querySelector('.form-user-password');

// // DELEGATION
// if (mapBox) {
//   const locations = JSON.parse(mapBox.dataset.locations);
//   displayMap(locations);
// }

// if (loginForm)
//   loginForm.addEventListener('submit', e => {
//     e.preventDefault();
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
//     login(email, password);
//   });

// if (logOutBtn) logOutBtn.addEventListener('click', logout);

// if (userDataForm)
//   userDataForm.addEventListener('submit', e => {
//     e.preventDefault();
//     const name = document.getElementById('name').value;
//     const email = document.getElementById('email').value;
//     updateSettings({ name, email }, 'data');
//   });

// if (userPasswordForm)
//   userPasswordForm.addEventListener('submit', async e => {
//     e.preventDefault();
//     document.querySelector('.btn--save-password').textContent = 'Updating...';

//     const passwordCurrent = document.getElementById('password-current').value;
//     const password = document.getElementById('password').value;
//     const passwordConfirm = document.getElementById('password-confirm').value;
//     await updateSettings(
//       { passwordCurrent, password, passwordConfirm },
//       'password'
//     );

//     document.querySelector('.btn--save-password').textContent = 'Save password';
//     document.getElementById('password-current').value = '';
//     document.getElementById('password').value = '';
//     document.getElementById('password-confirm').value = '';
//   });
