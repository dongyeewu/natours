/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

export const  bookTour = async tourId => {
    // 1) 打session API
    try{
        const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);
        console.log(session);
        //2 ) Create checkout form + chanre credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    }catch(err){
        console.log(err);
        showAlert('error', err);
    }
    
    
}