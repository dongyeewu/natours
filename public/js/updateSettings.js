/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';


export const updateSetting = async (data, type) => {
  console.log(data);
  try{
    const url = (type === 'passWord') ? '/api/v1/users/updatePassword' : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data
    })
    
    if(res.data.status === 'success'){
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    } 
    
  } catch(err){ 
    showAlert('error', err.response.data.msg);
  }
};

// // type is either 'password' or 'data'
// export const updateSettings = async (data, type) => {
//   try {
//     const url =
//       type === 'password'
//         ? '/api/v1/users/updateMyPassword'
//         : '/api/v1/users/updateMe';

//     const res = await axios({
//       method: 'PATCH',
//       url,
//       data
//     });

//     if (res.data.status === 'success') {
//       showAlert('success', `${type.toUpperCase()} updated successfully!`);
//     }
//   } catch (err) {
//     showAlert('error', err.response.data.message);
//   }
// };
