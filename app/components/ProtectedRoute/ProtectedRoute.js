import React, { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";


const ProtectedRoute = ({ children }) => {
  const auth = getAuth();


    useEffect(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('logged in')
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/auth.user
          // ...
        } else {
          // User is signed out
          console.log('logged oout')

          // ...
        }
      });
    });

    return <div>{children}</div>;
};

export default ProtectedRoute;