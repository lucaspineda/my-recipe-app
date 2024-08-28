import React, { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";

const ProtectedRoute = ({ children }) => {
  const firebaseConfig = {
    apiKey: "AIzaSyCSiRU-d64B48InC9gQO0befLt7yzojmuw",
    authDomain: "recipe-app-1bbdc.firebaseapp.com",
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

    useEffect(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('logged in')
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/auth.user
          // ...
        } else {
          // User is signed out
          console.log('logged out')
        }
      });
    });

    return <div>{children}</div>;
};

export default ProtectedRoute;